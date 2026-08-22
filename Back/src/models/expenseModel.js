const pool = require('../config/db');

/**
 * Obtiene el balance total actual (Ingresos - Egresos)
 */
const getCurrentBalance = async () => {
    // 1. Ingresos Pagos de facturas
    const [incomeResult] = await pool.query('SELECT SUM(invoice_amount) as total_income FROM payments');
    const totalPayments = parseFloat(incomeResult[0]?.total_income || 0);

    // 2. Ingresos por abonos a deudas
    const [debtIncomeResult] = await pool.query('SELECT SUM(amount_paid) as total_income FROM debt_payments');
    const totalDebtPayments = parseFloat(debtIncomeResult[0]?.total_income || 0);

    // 3. Ingresos extraordinarios / Saldos Iniciales
    const [otherIncomeResult] = await pool.query('SELECT SUM(amount) as total_income FROM other_incomes');
    const totalOtherIncomes = parseFloat(otherIncomeResult[0]?.total_income || 0);

    // 4. Egresos totales reales (excluyendo transferencias de efectivo a cuenta bancaria)
    const [expenseResult] = await pool.query("SELECT SUM(amount) as total_expense FROM expenses WHERE account_id IS NULL OR payment_method != 'cash'");
    const totalExpense = parseFloat(expenseResult[0]?.total_expense || 0);

    const totalIncome = totalPayments + totalDebtPayments + totalOtherIncomes;
    const global = totalIncome - totalExpense;

    // Efectivo (Cash)
    const getCashIncomesSum = async (table, col) => {
        const [res] = await pool.query(`SELECT SUM(${col}) as total FROM ${table} WHERE account_id IS NULL`);
        return parseFloat(res[0]?.total || 0);
    };

    const cashIncomePayments = await getCashIncomesSum('payments', 'invoice_amount');
    const cashIncomeDebt = await getCashIncomesSum('debt_payments', 'amount_paid');
    const cashIncomeOther = await getCashIncomesSum('other_incomes', 'amount');
    
    const [cashExpenseRes] = await pool.query("SELECT SUM(amount) as total FROM expenses WHERE payment_method = 'cash'");
    const cashExpense = parseFloat(cashExpenseRes[0]?.total || 0);

    const cash = (cashIncomePayments + cashIncomeDebt + cashIncomeOther) - cashExpense;

    const bankAccountsModel = require('./bankAccountsModel');
    const accounts = await bankAccountsModel.getAllAccounts();

    return { global, cash, accounts };
};

/**
 * Obtiene la suma total de dinero pendiente de cobrar a favor de la Junta.
 */
const getGlobalDebt = async () => {
    const [globalDebtResult] = await pool.query(`
        SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'pending') +
            (SELECT COALESCE(SUM(remaining_amount), 0) FROM payment_agreements WHERE status = 'active') as global_debt
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
            SUM(ac.amount) as total_collected
        FROM invoice_concept ic
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        JOIN invoices i ON ic.invoice_id = i.invoice_id
        WHERE i.status = 'paid'
        GROUP BY ac.concept_id, ac.description

        UNION ALL

        SELECT 
            0 as concept_id,
            'CONSUMO DE AGUA' as description,
            SUM(r.amount) as total_collected
        FROM readings r
        JOIN invoices i ON r.invoice_id = i.invoice_id
        WHERE i.status = 'paid'
    `;
    const [rows] = await pool.query(query);
    return rows;
};

const getAllExpenses = async () => {
    const query = `
    SELECT e.*, c.name as category_name 
    FROM expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.category_id
    ORDER BY e.expense_date DESC, e.created_at DESC
  `;
    const [rows] = await pool.query(query);
    return rows;
};

const createExpense = async (expenseData) => {
    const { category_id, amount, expense_date, description, payment_method, reference_number, system_user_id, account_id } = expenseData;
    const expenseAmount = parseFloat(amount);

    // --- SALDO SHIELD: Validación de fondos antes de proceder ---
    const balances = await getCurrentBalance();
    
    let availableFunds = 0;
    if (payment_method === 'cash') {
        // Gasto en efectivo o depósito de efectivo a banco (se paga con efectivo de caja chica)
        availableFunds = balances.cash;
    } else {
        // Gasto de cuenta bancaria
        const account = balances.accounts.find(a => a.account_id === parseInt(account_id));
        if (!account) throw new Error('Cuenta bancaria no encontrada');
        availableFunds = account.current_balance;
    }

    if (expenseAmount > availableFunds) {
        const sourceName = payment_method === 'cash' ? 'la caja (efectivo)' : 'esta cuenta bancaria';
        const error = new Error(`Fondos insuficientes en ${sourceName} para registrar este egreso. Saldo disponible: $${availableFunds.toFixed(2)}`);
        error.status = 400;
        throw error;
    }

    const [result] = await pool.query(
        `INSERT INTO expenses (category_id, system_user_id, amount, expense_date, description, payment_method, reference_number, account_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [category_id, system_user_id, expenseAmount, expense_date, description, payment_method || 'cash', reference_number, account_id || null]
    );

    return result.insertId;
};

const updateExpense = async (id, expenseData) => {
    const { category_id, amount, expense_date, description, payment_method, reference_number, account_id } = expenseData;
    const newAmount = parseFloat(amount);

    // --- SALDO SHIELD para actualización ---
    // Obtenemos el gasto actual para saber cuánto "devolver" al balance antes de validar
    const [currentExpense] = await pool.query('SELECT amount, account_id, payment_method FROM expenses WHERE expense_id = ?', [id]);
    if (!currentExpense.length) throw new Error('Egreso no encontrado');

    const oldAmount = parseFloat(currentExpense[0].amount);
    const oldAccountId = currentExpense[0].account_id;
    const oldPaymentMethod = currentExpense[0].payment_method;
    
    const balances = await getCurrentBalance();

    let availableFunds = 0;
    if (payment_method === 'cash') {
        availableFunds = balances.cash + (oldPaymentMethod === 'cash' ? oldAmount : 0);
    } else {
        const account = balances.accounts.find(a => a.account_id === parseInt(account_id));
        if (!account) throw new Error('Cuenta bancaria no encontrada');
        availableFunds = account.current_balance + (oldPaymentMethod !== 'cash' && oldAccountId === parseInt(account_id) ? oldAmount : 0);
    }

    if (newAmount > availableFunds) {
        const sourceName = payment_method === 'cash' ? 'la caja (efectivo)' : 'esta cuenta bancaria';
        const error = new Error(`Fondos insuficientes en ${sourceName} para modificar este egreso. Saldo máximo disponible: $${availableFunds.toFixed(2)}`);
        error.status = 400;
        throw error;
    }

    const [result] = await pool.query(
        `UPDATE expenses 
         SET category_id = ?, amount = ?, expense_date = ?, description = ?, payment_method = ?, reference_number = ?, account_id = ?
         WHERE expense_id = ?`,
        [category_id, newAmount, expense_date, description, payment_method || 'cash', reference_number, account_id || null, id]
    );

    return result.affectedRows;
};
const deleteExpense = async (id) => {
    const [result] = await pool.query('DELETE FROM expenses WHERE expense_id = ?', [id]);
    return result.affectedRows;
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
