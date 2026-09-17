const pool = require('../config/db');
const { money } = require('../utils/accountingRules');
const { lockFinancialLedger } = require('../utils/periodLock');

const getAllAccounts = async () => {
    // Obtenemos cuentas y su balance actual sumando movimientos
    const query = `
        SELECT 
            b.*,
            (
                b.initial_balance +
                COALESCE((SELECT SUM(invoice_amount) FROM payments WHERE account_id = b.account_id AND status = 'posted'), 0) +
                COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE account_id = b.account_id AND status = 'posted'), 0) +
                COALESCE((SELECT SUM(amount) FROM other_incomes WHERE account_id = b.account_id AND status='posted'), 0) -
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method != 'cash' AND status='posted'), 0) +
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method = 'cash' AND status='posted'), 0)
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
                COALESCE((SELECT SUM(invoice_amount) FROM payments WHERE account_id = b.account_id AND status = 'posted'), 0) +
                COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE account_id = b.account_id AND status = 'posted'), 0) +
                COALESCE((SELECT SUM(amount) FROM other_incomes WHERE account_id = b.account_id AND status='posted'), 0) -
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method != 'cash' AND status='posted'), 0) +
                COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method = 'cash' AND status='posted'), 0)
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
            COALESCE((SELECT SUM(invoice_amount) FROM payments WHERE account_id = b.account_id AND status = 'posted'), 0) +
            COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE account_id = b.account_id AND status = 'posted'), 0) +
            COALESCE((SELECT SUM(amount) FROM other_incomes WHERE account_id = b.account_id AND status='posted'), 0) -
            COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method != 'cash' AND status='posted'), 0) +
            COALESCE((SELECT SUM(amount) FROM expenses WHERE account_id = b.account_id AND payment_method = 'cash' AND status='posted'), 0) as current_balance
        FROM bank_accounts b
        WHERE b.account_id = ?
    `;
    const [rows] = await pool.query(query, [accountId]);
    return parseFloat(rows[0]?.current_balance || 0);
};

const createAccount = async (accountData, systemUserId) => {
    const { bank_name, account_number, account_type, initial_balance } = accountData;
    const initialBalance = money(initial_balance || 0, 'Saldo inicial');
    if (initialBalance < 0) throw Object.assign(new Error('El saldo inicial no puede ser negativo'), { status: 400 });
    if (!String(bank_name || '').trim() || !String(account_number || '').trim()) {
        throw Object.assign(new Error('Banco y número de cuenta son obligatorios'), { status: 400 });
    }
    if (!['savings', 'checking'].includes(account_type || 'savings')) {
        throw Object.assign(new Error('Tipo de cuenta inválido'), { status: 400 });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [periods] = await connection.query('SELECT EXISTS(SELECT 1 FROM accounting_periods LIMIT 1) AS has_period');
        if (Number(periods[0].has_period) === 1 && initialBalance !== 0) {
            throw Object.assign(new Error('Después del primer cierre, la cuenta debe iniciar en $0.00; registre el dinero como ingreso extraordinario'), { status: 409 });
        }
        const [result] = await connection.query(
            'INSERT INTO bank_accounts (bank_name, account_number, account_type, initial_balance) VALUES (?, ?, ?, ?)',
            [String(bank_name).trim(), String(account_number).trim(), account_type || 'savings', initialBalance]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, after_json)
             VALUES (?, 'BANK_ACCOUNT_CREATED', 'bank_account', ?, ?)`,
            [systemUserId, result.insertId, JSON.stringify({ bank_name, account_number, account_type: account_type || 'savings', initial_balance: initialBalance })]
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

const updateAccount = async (id, accountData, systemUserId) => {
    const { bank_name, account_number, account_type, status } = accountData;
    if (!['savings', 'checking'].includes(account_type) || !['active', 'inactive'].includes(status)) {
        throw Object.assign(new Error('Tipo o estado de cuenta inválido'), { status: 400 });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [rows] = await connection.query('SELECT * FROM bank_accounts WHERE account_id=? FOR UPDATE', [id]);
        if (!rows.length) {
            await connection.commit();
            return 0;
        }
        const [result] = await connection.query(
            'UPDATE bank_accounts SET bank_name=?, account_number=?, account_type=?, status=? WHERE account_id=?',
            [String(bank_name || '').trim(), String(account_number || '').trim(), account_type, status, id]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, before_json, after_json)
             VALUES (?, 'BANK_ACCOUNT_UPDATED', 'bank_account', ?, ?, ?)`,
            [systemUserId, id, JSON.stringify(rows[0]), JSON.stringify({ bank_name, account_number, account_type, status })]
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
    getAllAccounts,
    getActiveAccounts,
    getAccountBalance,
    createAccount,
    updateAccount
};
