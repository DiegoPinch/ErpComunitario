const pool = require('../config/db');
const { money } = require('../utils/accountingRules');
const { assertAccountingDateOpen, lockFinancialLedger } = require('../utils/periodLock');

/**
 * Obtiene el balance total actual (Ingresos - Egresos)
 */
const calculateCurrentBalance = async (db) => {
    const [paymentRows] = await db.query("SELECT COALESCE(SUM(invoice_amount),0) AS total FROM payments WHERE account_id IS NULL AND status='posted'");
    const [debtRows] = await db.query("SELECT COALESCE(SUM(amount_paid),0) AS total FROM debt_payments WHERE account_id IS NULL AND status='posted'");
    const [otherRows] = await db.query("SELECT COALESCE(SUM(amount),0) AS total FROM other_incomes WHERE account_id IS NULL AND status='posted'");
    const [cashExpenseRows] = await db.query("SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE LOWER(payment_method)='cash' AND status='posted'");
    const cashIncomePayments = Number(paymentRows[0].total);
    const cashIncomeDebt = Number(debtRows[0].total);
    const cashIncomeOther = Number(otherRows[0].total);
    
    const cash = money(cashIncomePayments + cashIncomeDebt + cashIncomeOther - Number(cashExpenseRows[0].total));

    const [accounts] = await db.query(`
        SELECT b.*,
          b.initial_balance
          + COALESCE((SELECT SUM(invoice_amount) FROM payments WHERE account_id=b.account_id AND status='posted'),0)
          + COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE account_id=b.account_id AND status='posted'),0)
          + COALESCE((SELECT SUM(amount) FROM other_incomes WHERE account_id=b.account_id AND status='posted'),0)
          - COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id=b.account_id AND LOWER(payment_method)!='cash' AND status='posted'),0)
          + COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id=b.account_id AND LOWER(payment_method)='cash' AND status='posted'),0)
          AS current_balance
        FROM bank_accounts b`);

    const global = money(cash + accounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0));
    return { global, cash, accounts, reconciled: true };
};

const getCurrentBalance = () => calculateCurrentBalance(pool);

/**
 * Obtiene la suma total de dinero pendiente de cobrar a favor de la Junta.
 */
const getGlobalDebt = async () => {
    const [globalDebtResult] = await pool.query(`
        SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'pending') +
            (SELECT COALESCE(SUM(remaining_amount), 0) FROM payment_agreements WHERE status = 'active') -
            (SELECT COALESCE(SUM(COALESCE(ic.amount_snapshot, ac.amount)), 0)
               FROM invoice_concept ic
               JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
               JOIN invoices i ON i.invoice_id=ic.invoice_id
              WHERE ic.agreement_id IS NOT NULL AND i.status='pending') as global_debt
    `);
    return parseFloat(globalDebtResult[0]?.global_debt || 0);
};

/**
 * Obtiene la recaudación total agrupada por concepto de rubros adicionales
 * basándose solo en facturas pagadas.
 */
const getCollectionByConcept = async () => {
    const query = `
        SELECT 
            ac.concept_id,
            ac.description,
            SUM(COALESCE(ic.amount_snapshot, ac.amount)) as total_collected
        FROM invoice_concept ic
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        JOIN invoices i ON ic.invoice_id = i.invoice_id
        JOIN payments p ON p.invoice_id = i.invoice_id AND p.status = 'posted'
        GROUP BY ac.concept_id, ac.description

        UNION ALL

        SELECT 
            0 as concept_id,
            'CONSUMO DE AGUA' as description,
            SUM(r.amount) as total_collected
        FROM readings r
        JOIN invoices i ON r.invoice_id = i.invoice_id
        JOIN payments p ON p.invoice_id = i.invoice_id AND p.status = 'posted'
    `;
    const [rows] = await pool.query(query);
    return rows;
};

const getAllExpenses = async () => {
    const query = `
    SELECT e.*, c.name as category_name 
    FROM expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.category_id
    WHERE e.status = 'posted'
    ORDER BY e.expense_date DESC, e.created_at DESC
  `;
    const [rows] = await pool.query(query);
    return rows;
};

const createExpense = async (expenseData) => {
    const { category_id, amount, expense_date, payment_method, reference_number, system_user_id, account_id } = expenseData;
    const description = String(expenseData.description ?? '').trim();
    const expenseAmount = money(amount, 'Monto del egreso');
    if (expenseAmount <= 0) throw Object.assign(new Error('El egreso debe ser mayor que cero'), { status: 400 });
    const method = String(payment_method || 'cash').toLowerCase();
    if (!['cash', 'transfer', 'deposit', 'card'].includes(method)) {
        throw Object.assign(new Error('Método de egreso inválido'), { status: 400 });
    }
    if (method !== 'cash' && (!Number.isInteger(Number(account_id)) || Number(account_id) <= 0)) {
        throw Object.assign(new Error('El egreso bancario requiere una cuenta'), { status: 400 });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        await assertAccountingDateOpen(connection, expense_date);
        const balances = await calculateCurrentBalance(connection);
        const account = account_id ? balances.accounts.find(a => Number(a.account_id) === Number(account_id)) : null;
        if (account_id && (!account || account.status !== 'active')) {
            throw Object.assign(new Error('Cuenta bancaria inexistente o inactiva'), { status: 400 });
        }
        const availableFunds = method === 'cash' ? balances.cash : Number(account.current_balance);
        if (expenseAmount > availableFunds) {
            const sourceName = method === 'cash' ? 'la caja (efectivo)' : 'esta cuenta bancaria';
            throw Object.assign(new Error(`Fondos insuficientes en ${sourceName}. Disponible: $${availableFunds.toFixed(2)}`), { status: 400 });
        }
        const [result] = await connection.query(
            `INSERT INTO expenses
             (category_id, system_user_id, amount, expense_date, description, payment_method,
              reference_number, account_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'posted')`,
            [category_id, system_user_id, expenseAmount, expense_date, description, method,
                reference_number || null, account_id ? Number(account_id) : null]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, after_json)
             VALUES (?, 'EXPENSE_POSTED', 'expense', ?, ?)`,
            [system_user_id, result.insertId, JSON.stringify({ amount: expenseAmount, expense_date,
                payment_method: method, account_id: account_id ? Number(account_id) : null, description })]
        );
        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const updateExpense = async (id, expenseData, systemUserId) => {
    const { category_id, amount, expense_date, payment_method, reference_number, account_id } = expenseData;
    const description = String(expenseData.description ?? '').trim();
    const newAmount = money(amount, 'Monto del egreso');
    if (newAmount <= 0) throw Object.assign(new Error('El egreso debe ser mayor que cero'), { status: 400 });

    const method = String(payment_method || 'cash').toLowerCase();
    if (!['cash', 'transfer', 'deposit', 'card'].includes(method)) throw Object.assign(new Error('Método de egreso inválido'), { status: 400 });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [currentExpense] = await connection.query("SELECT * FROM expenses WHERE expense_id=? AND status='posted' FOR UPDATE", [id]);
        if (!currentExpense.length) {
            await connection.commit();
            return 0;
        }
        const previous = currentExpense[0];
        await assertAccountingDateOpen(connection, previous.expense_date);
        await assertAccountingDateOpen(connection, expense_date);
        const balances = await calculateCurrentBalance(connection);
        const account = account_id ? balances.accounts.find(a => Number(a.account_id) === Number(account_id)) : null;
        if (method !== 'cash' && (!account || account.status !== 'active')) throw Object.assign(new Error('Cuenta bancaria inexistente o inactiva'), { status: 400 });
        if (method === 'cash' && account_id && (!account || account.status !== 'active')) throw Object.assign(new Error('Cuenta bancaria de destino inexistente o inactiva'), { status: 400 });
        let availableFunds = method === 'cash' ? balances.cash : Number(account.current_balance);
        if (method === 'cash' && String(previous.payment_method).toLowerCase() === 'cash') availableFunds += Number(previous.amount);
        if (method !== 'cash' && Number(previous.account_id) === Number(account_id)) {
            availableFunds += String(previous.payment_method).toLowerCase() === 'cash'
                ? -Number(previous.amount)
                : Number(previous.amount);
        }
        if (newAmount > availableFunds) throw Object.assign(new Error(`Fondos insuficientes. Disponible: $${availableFunds.toFixed(2)}`), { status: 400 });
        const [result] = await connection.query(
            `UPDATE expenses SET category_id=?, amount=?, expense_date=?, description=?, payment_method=?,
             reference_number=?, account_id=? WHERE expense_id=? AND status='posted'`,
            [category_id, newAmount, expense_date, description, method, reference_number || null,
                account_id ? Number(account_id) : null, id]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, before_json, after_json)
             VALUES (?, 'EXPENSE_UPDATED', 'expense', ?, ?, ?)`,
            [systemUserId, id, JSON.stringify(previous), JSON.stringify({ category_id, amount: newAmount,
                expense_date, description, payment_method: method, reference_number: reference_number || null,
                account_id: account_id ? Number(account_id) : null })]
        );
        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
const deleteExpense = async (id, systemUserId, reason) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [rows] = await connection.query("SELECT * FROM expenses WHERE expense_id=? AND status='posted' FOR UPDATE", [id]);
        if (!rows.length) {
            await connection.commit();
            return 0;
        }
        await assertAccountingDateOpen(connection, rows[0].expense_date);
        const finalReason = String(reason || 'Anulación confirmada desde el módulo de egresos').trim();
        const [result] = await connection.query(
            "UPDATE expenses SET status='voided', voided_at=NOW(), voided_by=?, void_reason=? WHERE expense_id=?",
            [systemUserId, finalReason, id]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, reason, before_json, after_json)
             VALUES (?, 'EXPENSE_VOIDED', 'expense', ?, ?, ?, ?)`,
            [systemUserId, id, finalReason, JSON.stringify(rows[0]), JSON.stringify({ status: 'voided' })]
        );
        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getCurrentBalance,
    getGlobalDebt,
    getCollectionByConcept,
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};
