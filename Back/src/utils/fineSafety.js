const fail = (message, status = 409) => Object.assign(new Error(message), {status});
async function assertMonthOpen(db, month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ''))) throw fail('Seleccione el mes para cobrar las multas (YYYY-MM)', 400);
  const [rows] = await db.query(`SELECT period_id FROM accounting_periods
    WHERE DATE(start_date)<=LAST_DAY(CONCAT(?,'-01')) AND DATE(end_date)>=CONCAT(?,'-01') LIMIT 1`, [month,month]);
  if (rows.length) throw fail(`El mes ${month} pertenece a un período cerrado`);
}
async function invoiceBlock(db, invoice) {
  if (invoice.status !== 'pending') return 'Factura pagada o anulada. Primero anule el cobro; la factura debe quedar pendiente.';
  const [payments] = await db.query("SELECT payment_id FROM payments WHERE invoice_id=? AND status='posted' LIMIT 1", [invoice.invoice_id]);
  if (payments.length) return 'Factura con pagos o abonos. Primero anule todos los cobros vigentes.';
  const [closed] = await db.query(`SELECT period_id FROM accounting_periods WHERE
    DATE(?) BETWEEN DATE(start_date) AND DATE(end_date) OR
    (DATE(start_date)<=LAST_DAY(CONCAT(?,'-01')) AND DATE(end_date)>=CONCAT(?,'-01')) LIMIT 1`,
    [invoice.issue_date,invoice.billing_month,invoice.billing_month]);
  return closed.length ? 'Factura de un período cerrado' : null;
}
function monthWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Guayaquil',year:'numeric',month:'2-digit'}).formatToParts(now);
  const year=Number(parts.find(p=>p.type==='year').value), month=Number(parts.find(p=>p.type==='month').value);
  return {current:`${year}-${String(month).padStart(2,'0')}`, previous:`${month===1?year-1:year}-${String(month===1?12:month-1).padStart(2,'0')}`};
}
async function assertSelectableMonth(db, month) {
  const {current,previous}=monthWindow();
  if (month!==current && month!==previous) throw fail('Seleccione el mes actual o el anterior. No se permiten meses futuros ni más antiguos.',400);
  await assertMonthOpen(db,month);
  if (month<current) {
    const [rows]=await db.query(`SELECT i.invoice_id FROM invoices i WHERE i.invoice_type='water' AND i.billing_month=?
      AND (i.status='paid' OR EXISTS(SELECT 1 FROM payments p WHERE p.invoice_id=i.invoice_id AND p.status='posted')) LIMIT 1`,[month]);
    if(rows.length) throw fail('El mes anterior ya tiene cobros o abonos. Seleccione el mes actual para las nuevas multas.');
  }
}
async function selectableMonths(db) {
  const {current,previous}=monthWindow();
  const result=[];
  for(const value of [current,previous]) {
    let reason=null;
    try { await assertSelectableMonth(db,value); } catch(e) { if(!e.status) throw e; reason=e.message; }
    result.push({value,label:value,disabled:Boolean(reason),reason});
  }
  return result;
}
module.exports = {fail, assertMonthOpen, invoiceBlock, monthWindow, assertSelectableMonth, selectableMonths};
