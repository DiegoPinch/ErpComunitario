// Integration checks against the configured database; SELECT statements only.
require('dotenv').config({ quiet: true });
const pool = require('../src/config/db');
async function main() {
  const reports = require('../src/models/reportsModel');
  const checks = Object.entries(reports).map(([name, fn]) => [name, () =>
    name === 'getDailyCollectionsReport' ? fn('2026-09-11') :
    ['getDetailedCollectionsReport', 'getComprehensiveReport'].includes(name)
      ? fn('2000-01-01 00:00:00', '2099-12-31 23:59:59') : fn('2000-01', '2099-12')]);
  for (const [module, names] of Object.entries({
    expenseModel: ['getCurrentBalance', 'getGlobalDebt', 'getCollectionByConcept', 'getAllExpenses'],
    bankAccountsModel: ['getAllAccounts', 'getActiveAccounts'],
    dashboardModel: ['getDashboardStats'],
    accountingPeriodsModel: ['getAllPeriods'],
    otherIncomesModel: ['getAll'],
    paymentAgreementsModel: ['getAllAgreements'],
    additionalConceptsModel: ['getAllConcepts']
  })) {
    const model = require(`../src/models/${module}`);
    for (const name of names) checks.push([`${module}.${name}`, () => model[name]()]);
  }
  const [[invoice]] = await pool.query('SELECT invoice_id FROM payments ORDER BY payment_id DESC LIMIT 1');
  if (invoice) {
    checks.push(['receipt', () => require('../src/models/paymentsModel').getPaymentReceiptData([invoice.invoice_id])]);
    checks.push(['invoice details', () => require('../src/models/invoicesModel').getInvoiceDetails(invoice.invoice_id)]);
  }
  let failures = 0;
  for (const [name, check] of checks) {
    try { await check(); console.log(`PASS ${name}`); }
    catch (error) { failures++; console.log(`FAIL ${name}: ${error.code || ''} ${error.message}`); }
  }
  console.log(`${checks.length - failures}/${checks.length} consultas correctas`);
  if (failures) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
