const pool = require('../config/db');

const getAll = async () => {
    const [rows] = await pool.query(`
        SELECT oi.*, su.username as treasurer_username
        FROM other_incomes oi
        JOIN system_users su ON oi.system_user_id = su.system_user_id
        ORDER BY oi.income_date DESC, oi.created_at DESC
    `);
    return rows;
};

const create = async (incomeData) => {
    const { system_user_id, amount, income_date, description, payment_method, reference_number, account_id } = incomeData;
    const [result] = await pool.query(
        'INSERT INTO other_incomes (system_user_id, amount, income_date, description, payment_method, reference_number, account_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [system_user_id, amount, income_date, description, payment_method || 'cash', reference_number || null, account_id || null]
    );
    return result.insertId;
};

module.exports = {
    getAll,
    create
};
