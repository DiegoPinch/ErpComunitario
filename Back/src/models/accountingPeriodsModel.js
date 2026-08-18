const pool = require('../config/db');

const getAllPeriods = async () => {
    const [rows] = await pool.query(`
        SELECT ap.*, a.name as administration_name, su.username as treasurer_username
        FROM accounting_periods ap
        JOIN administrations a ON ap.administration_id = a.administration_id
        JOIN system_users su ON ap.system_user_id = su.system_user_id
        ORDER BY ap.created_at DESC
    `);
    return rows;
};

const getPeriodById = async (id) => {
    const [rows] = await pool.query(`
        SELECT ap.*, a.name as administration_name, su.username as treasurer_username
        FROM accounting_periods ap
        JOIN administrations a ON ap.administration_id = a.administration_id
        JOIN system_users su ON ap.system_user_id = su.system_user_id
        WHERE ap.period_id = ?
    `, [id]);
    return rows[0];
};

const generateAccountingPeriod = async (periodData) => {
    const { administration_id, system_user_id, title, start_date, end_date, physical_balance, observations } = periodData;

    // Calcular el Saldo Anterior (Cascada)
    const [lastPeriod] = await pool.query(
        "SELECT physical_balance FROM accounting_periods ORDER BY end_date DESC, created_at DESC LIMIT 1"
    );
    const previous_balance = lastPeriod.length > 0 ? parseFloat(lastPeriod[0].physical_balance) : 0;

    // Calcular ingresos regulares
    const [incomesResult] = await pool.query(
        "SELECT SUM(amount_paid) as total FROM payments WHERE payment_date >= ? AND payment_date <= ?",
        [start_date, end_date]
    );
    const regular_incomes = parseFloat(incomesResult[0].total || 0);

    // Calcular abonos a deudas
    const [debtIncomesResult] = await pool.query(
        "SELECT SUM(amount_paid) as total FROM debt_payments WHERE payment_date >= ? AND payment_date <= ?",
        [start_date, end_date]
    );
    const debt_incomes = parseFloat(debtIncomesResult[0].total || 0);

    // Calcular ingresos extraordinarios / saldos iniciales
    const [otherIncomesResult] = await pool.query(
        "SELECT SUM(amount) as total FROM other_incomes WHERE income_date >= ? AND income_date <= ?",
        [start_date, end_date]
    );
    const other_incomes = parseFloat(otherIncomesResult[0].total || 0);

    const total_incomes = regular_incomes + debt_incomes + other_incomes;

    // Calcular egresos
    const [expensesResult] = await pool.query(
        "SELECT SUM(amount) as total FROM expenses WHERE expense_date >= ? AND expense_date <= ?",
        [start_date, end_date]
    );
    const total_expenses = parseFloat(expensesResult[0].total || 0);

    // Saldo del sistema ahora incluye el arrastre del periodo anterior
    const system_balance = previous_balance + total_incomes - total_expenses;
    const difference = parseFloat(physical_balance || 0) - system_balance;

    const [result] = await pool.query(
        `INSERT INTO accounting_periods 
        (administration_id, system_user_id, title, start_date, end_date, previous_balance, total_incomes, total_expenses, system_balance, physical_balance, difference, observations) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [administration_id, system_user_id, title, start_date, end_date, previous_balance, total_incomes, total_expenses, system_balance, physical_balance || 0, difference, observations]
    );
    
    return result.insertId;
};

module.exports = {
    getAllPeriods,
    getPeriodById,
    generateAccountingPeriod
};
