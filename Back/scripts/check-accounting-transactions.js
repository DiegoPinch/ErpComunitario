// Run only on an explicitly selected restored copy. All test rows are rolled back.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const pool = require('../src/config/db');
async function main() {
  const expected = process.argv.find(arg => arg.startsWith('--test-database='))?.slice(16);
  if (!expected) throw new Error('Indique --test-database=NOMBRE_DE_LA_COPIA');
  const connection = await pool.getConnection();
  const originalGetConnection = pool.getConnection;
  const originalQuery = pool.query;
  try {
    const [[target]] = await connection.query('SELECT DATABASE() AS name');
    assert.equal(target.name, expected);
    await connection.beginTransaction();
    // Models use real SQL but commits become savepoint releases in this test only.
    const adapter = {
      query: connection.query.bind(connection),
      beginTransaction: () => connection.query('SAVEPOINT model_operation'),
      commit: () => connection.query('RELEASE SAVEPOINT model_operation'),
      rollback: () => connection.query('ROLLBACK TO SAVEPOINT model_operation'),
      release: () => {}
    };
    pool.getConnection = async () => adapter;
    pool.query = adapter.query;
    const [users] = await connection.query('SELECT user_id,system_user_id FROM system_users LIMIT 1');
    assert.ok(users.length, 'Se necesita un usuario de sistema para la prueba');
    const user = users[0];
    const payments = require('../src/models/paymentsModel');
    const expenses = require('../src/models/expenseModel');
    const reports = require('../src/models/reportsModel');
    const baseline = await expenses.getCurrentBalance();
    const [agreement] = await connection.query(
      "INSERT INTO payment_agreements(user_id,description,total_amount,remaining_amount) VALUES (?,'TEST ROLLBACK',100,100)", [user.user_id]);
    const ids = [];
    for (const amount of [10.15, 20.25]) {
      const [invoice] = await connection.query(
        "INSERT INTO invoices(user_id,invoice_type,billing_month,total_amount) VALUES (?,'other','2026-09',?)", [user.user_id, amount]);
      ids.push(invoice.insertId);
    }
    const input = { invoiceIds: ids, debtPayments: [{ agreement_id: agreement.insertId, amount: 5.60 }],
      amountTendered: 40, paymentMethod: 'cash', systemUserId: user.system_user_id, idempotencyKey: crypto.randomUUID() };
    const result = await payments.collectCombinedPayment(input);
    assert.equal(result.totalDue, 36);
    assert.equal(result.changeAmount, 4);
    assert.equal(Math.round(((await expenses.getCurrentBalance()).global - baseline.global) * 100), 3600);
    const repeat = await payments.collectCombinedPayment(input);
    assert.equal(repeat.collection_id, result.collection_id);
    await assert.rejects(payments.collectCombinedPayment({ ...input, idempotencyKey: crypto.randomUUID() }));
    await payments.voidPayment(ids[0], user.system_user_id, 'Prueba reversible');
    await payments.voidPayment(ids[1], user.system_user_id, 'Prueba reversible');
    const [[collection]] = await connection.query('SELECT status FROM payment_collections WHERE collection_id=?', [result.collection_id]);
    assert.equal(collection.status, 'partially_voided');
    await payments.voidDebtPayment(result.debt_payment_ids[0], user.system_user_id, 'Prueba reversible');
    assert.equal((await expenses.getCurrentBalance()).global, baseline.global);
    const [[restored]] = await connection.query('SELECT remaining_amount FROM payment_agreements WHERE agreement_id=?', [agreement.insertId]);
    assert.equal(Number(restored.remaining_amount), 100);
    console.log('PASS cobro combinado, cambio, idempotencia, doble cobro y anulaciones');

    const [account] = await connection.query("INSERT INTO bank_accounts(bank_name,account_number,initial_balance) VALUES ('TEST ROLLBACK','TEST',100)");
    const [income] = await connection.query("INSERT INTO other_incomes(system_user_id,amount,income_date,description) VALUES (?,50,CURRENT_DATE,'TEST ROLLBACK')", [user.system_user_id]);
    const before = await expenses.getCurrentBalance();
    const expenseId = await expenses.createExpense({ amount: 10, expense_date: new Date(), payment_method: 'cash',
      account_id: account.insertId, category_id: null, system_user_id: user.system_user_id, description: 'TEST ROLLBACK' });
    assert.equal((await expenses.getCurrentBalance()).global, before.global);
    await expenses.deleteExpense(expenseId, user.system_user_id, 'Prueba reversible');
    const monthly = await reports.getCashBalanceReport('2000-01', '2099-12');
    const movementBalance = monthly.ingresos.reduce((n,r) => n + Number(r.total_ingresos), 0)
      - monthly.egresos.reduce((n,r) => n + Number(r.total_egresos), 0);
    const [[initial]] = await connection.query('SELECT SUM(initial_balance) AS amount FROM bank_accounts');
    assert.equal(Math.round((movementBalance + Number(initial.amount))*100), Math.round(before.global*100));
    await require('../src/models/otherIncomesModel').voidIncome(income.insertId, user.system_user_id, 'Prueba reversible');
    console.log('PASS transferencia interna, anulación ingreso y conciliación de reporte mensual');

    const [installmentInvoice] = await connection.query(
      "INSERT INTO invoices(user_id,invoice_type,billing_month,total_amount) VALUES (?,'other','2026-09',15)", [user.user_id]);
    const [concept] = await connection.query(
      "INSERT INTO additional_concepts(concept_type,description,amount,applies_to,application_month) VALUES ('installment','TEST ROLLBACK',15,'user','2026-09')");
    await connection.query('INSERT INTO invoice_concept(invoice_id,concept_id,agreement_id) VALUES (?,?,?)',
      [installmentInvoice.insertId, concept.insertId, agreement.insertId]);
    await payments.collectCombinedPayment({ invoiceIds: [installmentInvoice.insertId], amountTendered: 15,
      paymentMethod: 'cash', systemUserId: user.system_user_id });
    const [[afterInstallment]] = await connection.query('SELECT remaining_amount FROM payment_agreements WHERE agreement_id=?', [agreement.insertId]);
    assert.equal(Number(afterInstallment.remaining_amount), 85);
    await payments.voidPayment(installmentInvoice.insertId, user.system_user_id, 'Prueba reversible');
    const [[afterVoid]] = await connection.query('SELECT remaining_amount FROM payment_agreements WHERE agreement_id=?', [agreement.insertId]);
    assert.equal(Number(afterVoid.remaining_amount), 100);
    console.log('PASS cuota facturada y restauración de saldo del convenio');

    const [[periodCount]] = await connection.query('SELECT COUNT(*) AS count FROM accounting_periods');
    if (Number(periodCount.count) === 0) {
      const [administration] = await connection.query("INSERT INTO administrations(name,start_date) VALUES ('TEST ROLLBACK',CURRENT_DATE)");
      const [[dates]] = await connection.query("SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS today");
      const periodId = await require('../src/models/accountingPeriodsModel').generateAccountingPeriod({
        administration_id: administration.insertId, system_user_id: user.system_user_id, title: 'TEST ROLLBACK',
        start_date: dates.today, end_date: dates.today, physical_balance: (await expenses.getCurrentBalance()).global
      });
      const [[period]] = await connection.query('SELECT integrity_hash=SHA2(snapshot_json,256) AS valid FROM accounting_periods WHERE period_id=?', [periodId]);
      assert.equal(Number(period.valid), 1);
      await assert.rejects(expenses.createExpense({ amount: 1, expense_date: dates.today, payment_method: 'cash',
        system_user_id: user.system_user_id }), /cerrado/);
      console.log('PASS cierre, hash almacenado y bloqueo de egresos en período cerrado');
    }
  } finally {
    pool.getConnection = originalGetConnection;
    pool.query = originalQuery;
    await connection.rollback();
    connection.release();
    await pool.end();
    console.log('ROLLBACK: los registros de prueba no se conservaron');
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
