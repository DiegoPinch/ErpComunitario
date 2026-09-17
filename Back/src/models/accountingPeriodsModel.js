const crypto = require('crypto');
const pool = require('../config/db');
const { money } = require('../utils/accountingRules');
const { lockFinancialLedger } = require('../utils/periodLock');

const invalid = (message, status = 400) => Object.assign(new Error(message), { status });
const validDate = value => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return false;
    const [, year, month, day] = match.map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};

const getAllPeriods = async () => {
    const [rows] = await pool.query(`
        SELECT ap.*, a.name as administration_name, su.username as treasurer_username
        FROM accounting_periods ap
        JOIN administrations a ON ap.administration_id = a.administration_id
        JOIN system_users su ON ap.system_user_id = su.system_user_id
        ORDER BY ap.end_date DESC, ap.created_at DESC`);
    return rows;
};

const getPeriodById = async (id) => {
    const [rows] = await pool.query(`
        SELECT ap.*, a.name as administration_name, su.username as treasurer_username
        FROM accounting_periods ap
        JOIN administrations a ON ap.administration_id = a.administration_id
        JOIN system_users su ON ap.system_user_id = su.system_user_id
        WHERE ap.period_id = ?`, [id]);
    return rows[0];
};

const generateAccountingPeriod = async (periodData) => {
    const { administration_id, system_user_id, title, start_date, end_date, physical_balance, observations } = periodData;
    if (!validDate(start_date) || !validDate(end_date)) throw invalid('Las fechas del período no son válidas');
    if (start_date > end_date) throw invalid('La fecha inicial no puede ser posterior a la fecha final');
    if (!String(title || '').trim()) throw invalid('El título del cierre es obligatorio');
    const physicalBalance = money(physical_balance, 'Saldo físico');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [administrations] = await connection.query(
            "SELECT administration_id FROM administrations WHERE administration_id=? AND status='active' FOR UPDATE",
            [Number(administration_id)]
        );
        if (!administrations.length) throw invalid('La directiva indicada no está activa');

        const [overlaps] = await connection.query(
            `SELECT period_id, title FROM accounting_periods
             WHERE DATE(start_date) <= ? AND DATE(end_date) >= ? FOR UPDATE`, [end_date, start_date]
        );
        if (overlaps.length) throw invalid(`El rango se cruza con el cierre: ${overlaps[0].title}`, 409);

        const [lastPeriods] = await connection.query(
            'SELECT period_id, end_date, physical_balance FROM accounting_periods ORDER BY end_date DESC LIMIT 1 FOR UPDATE'
        );
        let previousBalance = 0;
        if (lastPeriods.length) {
            const [continuity] = await connection.query('SELECT DATEDIFF(?, DATE(?)) AS days', [start_date, lastPeriods[0].end_date]);
            if (Number(continuity[0].days) !== 1) {
                throw invalid('El período debe comenzar exactamente al día siguiente del último cierre', 409);
            }
            previousBalance = money(lastPeriods[0].physical_balance);
        } else {
            const [openingRows] = await connection.query(`
                SELECT
                  (SELECT COALESCE(SUM(initial_balance),0) FROM bank_accounts) +
                  (SELECT COALESCE(SUM(invoice_amount),0) FROM payments WHERE status='posted' AND payment_date < ?) +
                  (SELECT COALESCE(SUM(amount_paid),0) FROM debt_payments WHERE status='posted' AND payment_date < ?) +
                  (SELECT COALESCE(SUM(amount),0) FROM other_incomes WHERE status='posted' AND income_date < ?) -
                  (SELECT COALESCE(SUM(amount),0) FROM expenses
                    WHERE status='posted' AND expense_date < ? AND (account_id IS NULL OR payment_method != 'cash')) AS total`,
                [`${start_date} 00:00:00`, `${start_date} 00:00:00`, `${start_date} 00:00:00`, start_date]
            );
            previousBalance = money(openingRows[0].total);
        }

        const startDateTime = `${start_date} 00:00:00`;
        const endDateTime = `${end_date} 23:59:59`;
        const [inconsistent] = await connection.query(`SELECT p.payment_id
          FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
          WHERE p.status='posted' AND p.payment_date BETWEEN ? AND ? AND (
            (p.payment_method<>'cash' AND p.account_id IS NULL)
            OR (p.payment_method='cash' AND p.account_id IS NOT NULL)
            OR p.invoice_amount<0
            OR (SELECT COALESCE(SUM(q.invoice_amount),0) FROM payments q
                WHERE q.invoice_id=i.invoice_id AND q.status='posted')>i.total_amount
          ) LIMIT 1`,[startDateTime,endDateTime]);
        if (inconsistent.length) throw invalid(`No se puede cerrar: revisar el pago ${inconsistent[0].payment_id}`,409);
        const [regularRows] = await connection.query(
            "SELECT COALESCE(SUM(invoice_amount),0) AS total FROM payments WHERE status='posted' AND payment_date BETWEEN ? AND ?",
            [startDateTime, endDateTime]
        );
        const [debtRows] = await connection.query(
            "SELECT COALESCE(SUM(amount_paid),0) AS total FROM debt_payments WHERE status='posted' AND payment_date BETWEEN ? AND ?",
            [startDateTime, endDateTime]
        );
        const [otherRows] = await connection.query(
            "SELECT COALESCE(SUM(amount),0) AS total FROM other_incomes WHERE status='posted' AND income_date BETWEEN ? AND ?",
            [startDateTime, endDateTime]
        );
        const [expenseRows] = await connection.query(
            `SELECT COALESCE(SUM(amount),0) AS total FROM expenses
             WHERE status='posted' AND expense_date BETWEEN ? AND ?
               AND (account_id IS NULL OR payment_method != 'cash')`, [startDateTime, endDateTime]
        );
        const receivables = await require('./receivablesModel').getReceivables(endDateTime, connection);
        const invoiceReceivableRows = [{total: receivables.filter(r => r.invoice_id).reduce((s,r)=>s+Number(r.total_debt),0)}];
        const agreementReceivableRows = [{total: receivables.filter(r => r.agreement_id).reduce((s,r)=>s+Number(r.total_debt),0)}];

        const regularIncomes = money(regularRows[0].total);
        const debtIncomes = money(debtRows[0].total);
        const otherIncomes = money(otherRows[0].total);
        const totalIncomes = money(regularIncomes + debtIncomes + otherIncomes);
        const totalExpenses = money(expenseRows[0].total);
        const systemBalance = money(previousBalance + totalIncomes - totalExpenses);
        const difference = money(physicalBalance - systemBalance);
        const snapshot = {
            version: 2, start_date, end_date, previous_balance: previousBalance,
            regular_incomes: regularIncomes, debt_incomes: debtIncomes, other_incomes: otherIncomes,
            total_incomes: totalIncomes, total_expenses: totalExpenses,
            system_balance: systemBalance, physical_balance: physicalBalance, difference,
            pending_invoices: money(invoiceReceivableRows[0].total || 0),
            pending_agreements: money(agreementReceivableRows[0].total || 0),
            receivables
        };
        const snapshotJson = JSON.stringify(snapshot);
        const integrityHash = crypto.createHash('sha256').update(snapshotJson).digest('hex');

        const [result] = await connection.query(
            `INSERT INTO accounting_periods
             (administration_id, system_user_id, title, start_date, end_date, previous_balance,
              total_incomes, total_expenses, system_balance, physical_balance, difference,
              observations, snapshot_json, integrity_hash, closed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [administration_id, system_user_id, String(title).trim(), start_date, end_date,
                previousBalance, totalIncomes, totalExpenses, systemBalance, physicalBalance,
                difference, observations || null, snapshotJson, integrityHash]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, after_json)
             VALUES (?, 'ACCOUNTING_PERIOD_CLOSED', 'accounting_period', ?, ?)`,
            [system_user_id, result.insertId, snapshotJson]
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

module.exports = { getAllPeriods, getPeriodById, generateAccountingPeriod };
