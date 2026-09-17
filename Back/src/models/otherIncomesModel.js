const pool = require('../config/db');
const { money, validatePaymentMethod } = require('../utils/accountingRules');
const { assertAccountingDateOpen, lockFinancialLedger } = require('../utils/periodLock');

const getAll = async () => {
    const [rows] = await pool.query(`
        SELECT oi.*, su.username as treasurer_username
        FROM other_incomes oi
        JOIN system_users su ON oi.system_user_id = su.system_user_id
        WHERE oi.status = 'posted'
        ORDER BY oi.income_date DESC, oi.created_at DESC
    `);
    return rows;
};

const create = async (incomeData) => {
    const { system_user_id, amount, income_date, description, payment_method, reference_number, account_id } = incomeData;
    const incomeAmount = money(amount, 'Monto del ingreso');
    if (incomeAmount <= 0) throw Object.assign(new Error('El ingreso debe ser mayor que cero'), { status: 400 });
    const method = payment_method || 'cash';
    validatePaymentMethod(method, account_id);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        await assertAccountingDateOpen(connection, income_date);
        const [result] = await connection.query(
            `INSERT INTO other_incomes (system_user_id, amount, income_date, description, payment_method,
             reference_number, account_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'posted')`,
            [system_user_id, incomeAmount, income_date, description, method, reference_number || null,
                method === 'cash' ? null : account_id]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, after_json)
             VALUES (?, 'OTHER_INCOME_POSTED', 'other_income', ?, ?)`,
            [system_user_id, result.insertId, JSON.stringify({ amount: incomeAmount, income_date, description, payment_method: method, account_id })]
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

const voidIncome = async (incomeId, systemUserId, reason) => {
    if (!reason || String(reason).trim().length < 5) {
        throw Object.assign(new Error('Debe indicar un motivo de al menos 5 caracteres'), { status: 400 });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [rows] = await connection.query(
            "SELECT * FROM other_incomes WHERE income_id=? AND status='posted' FOR UPDATE", [incomeId]
        );
        if (!rows.length) {
            await connection.commit();
            return 0;
        }
        await assertAccountingDateOpen(connection, rows[0].income_date);
        const [result] = await connection.query(
            "UPDATE other_incomes SET status='voided', voided_at=NOW(), voided_by=?, void_reason=? WHERE income_id=?",
            [systemUserId, String(reason).trim(), incomeId]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, reason, before_json, after_json)
             VALUES (?, 'OTHER_INCOME_VOIDED', 'other_income', ?, ?, ?, ?)`,
            [systemUserId, incomeId, String(reason).trim(), JSON.stringify(rows[0]), JSON.stringify({ status: 'voided' })]
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
    getAll,
    create,
    voidIncome
};
