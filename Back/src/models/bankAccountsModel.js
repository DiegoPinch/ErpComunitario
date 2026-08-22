const pool = require('../config/db');

const getAllAccounts = async () => {
    // Obtenemos cuentas y su balance actual sumando movimientos
    const query = `
        SELECT 
            b.*,
            (
                b.initial_balance +
                COALESCE((SELECT SUM(amount_paid) FROM payments WHERE account_id = b.account_id), 0) +
                COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE account_id = b.account_id), 0) +
                COALESCE((SELECT SUM(amount) FROM other_incomes WHERE account_id = b.account_id), 0) -
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method != 'cash'), 0) +
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method = 'cash'), 0)
            ) as current_balance
        FROM bank_accounts b
        ORDER BY b.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
};

const getActiveAccounts = async () => {
    const query = `
        SELECT 
            b.*,
            (
                b.initial_balance +
                COALESCE((SELECT SUM(amount_paid) FROM payments WHERE account_id = b.account_id), 0) +
                COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE account_id = b.account_id), 0) +
                COALESCE((SELECT SUM(amount) FROM other_incomes WHERE account_id = b.account_id), 0) -
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method != 'cash'), 0) +
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method = 'cash'), 0)
            ) as current_balance
        FROM bank_accounts b
        WHERE b.status = 'active'
        ORDER BY b.bank_name ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
};

const getAccountBalance = async (accountId) => {
    const query = `
        SELECT 
            b.initial_balance +
            COALESCE((SELECT SUM(amount_paid) FROM payments WHERE account_id = b.account_id), 0) +
            COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE account_id = b.account_id), 0) +
            COALESCE((SELECT SUM(amount) FROM other_incomes WHERE account_id = b.account_id), 0) -
            COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method != 'cash'), 0) +
            COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method = 'cash'), 0) as current_balance
        FROM bank_accounts b
        WHERE b.account_id = ?
    `;
    const [rows] = await pool.query(query, [accountId]);
    return parseFloat(rows[0]?.current_balance || 0);
};

const createAccount = async (accountData) => {
    const { bank_name, account_number, account_type, initial_balance } = accountData;
    const [result] = await pool.query(
        'INSERT INTO bank_accounts (bank_name, account_number, account_type, initial_balance) VALUES (?, ?, ?, ?)',
        [bank_name, account_number, account_type || 'savings', initial_balance || 0]
    );
    return result.insertId;
};

const updateAccount = async (id, accountData) => {
    const { bank_name, account_number, account_type, status } = accountData;
    // initial_balance is usually not updated after transactions exist, but for simplicity we allow it or we don't.
    // Let's not allow updating initial_balance to keep audit trails safe.
    const [result] = await pool.query(
        'UPDATE bank_accounts SET bank_name = ?, account_number = ?, account_type = ?, status = ? WHERE account_id = ?',
        [bank_name, account_number, account_type, status, id]
    );
    return result.affectedRows;
};

module.exports = {
    getAllAccounts,
    getActiveAccounts,
    getAccountBalance,
    createAccount,
    updateAccount
};
