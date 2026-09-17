require('dotenv').config({ quiet: true });

const pool = require('../src/config/db');
const reportsModel = require('../src/models/reportsModel');

const startMonth = process.argv[2] || '2026-01';
const endMonth = process.argv[3] || startMonth;

const money = value => Math.round(Number(value || 0) * 100) / 100;

async function main() {
  const rows = await reportsModel.getCashIncomesDetailReport(startMonth, endMonth);
  const reportTotals = new Map();
  for (const row of rows) {
    const date = new Date(row.payment_date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    reportTotals.set(month, money((reportTotals.get(month) || 0) + Number(row.amount)));
  }

  const [ledgerRows] = await pool.query(`
    SELECT month_year, ROUND(SUM(amount), 2) AS ledger_total
    FROM (
      SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month_year, invoice_amount AS amount
      FROM payments WHERE status='posted'
      UNION ALL
      SELECT DATE_FORMAT(payment_date, '%Y-%m'), amount_paid
      FROM debt_payments WHERE status='posted'
      UNION ALL
      SELECT DATE_FORMAT(income_date, '%Y-%m'), amount
      FROM other_incomes WHERE status='posted'
    ) income_ledger
    WHERE month_year BETWEEN ? AND ?
    GROUP BY month_year
    ORDER BY month_year
  `, [startMonth, endMonth]);

  const comparison = ledgerRows.map(row => ({
    mes: row.month_year,
    reporte: money(reportTotals.get(row.month_year)),
    movimientos: money(row.ledger_total),
    diferencia: money((reportTotals.get(row.month_year) || 0) - Number(row.ledger_total))
  }));
  console.table(comparison);
  if (comparison.some(row => row.diferencia !== 0)) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());
