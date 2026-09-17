// Exercise existing PDF controllers in memory without saving customer data.
require('dotenv').config({ quiet: true });
const { Writable } = require('node:stream');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
async function check(name, handler, query) {
  const chunks = [];
  const res = new Writable({ write(chunk, encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); } });
  let status = 200;
  res.setHeader = () => {};
  res.status = code => { status = code; return res; };
  res.json = body => { res.end(JSON.stringify(body)); };
  const done = new Promise((resolve, reject) => { res.on('finish', resolve); res.on('error', reject); });
  await handler({ query }, res, error => res.destroy(error));
  await done;
  assert.equal(status, 200, name);
  assert.equal(Buffer.concat(chunks).subarray(0, 5).toString(), '%PDF-', name);
  if (process.env.REPORT_QA_DIR) {
    const fs = require('node:fs');
    const path = require('node:path');
    fs.mkdirSync(process.env.REPORT_QA_DIR, {recursive:true});
    fs.writeFileSync(path.join(process.env.REPORT_QA_DIR,name.replace(/[^a-z0-9]/gi,'_')+'.pdf'),Buffer.concat(chunks));
  }
  console.log(`PASS ${name}: PDF generado`);
}
(async () => {
  const receipts = require('../src/controllers/pdfController');
  const [[payment]] = await pool.query('SELECT invoice_id FROM payments WHERE status=\'posted\' ORDER BY payment_id DESC LIMIT 1');
  if (payment) await check('ticket', receipts.generateReceiptPdf, { invoiceIds: String(payment.invoice_id) });
  const range = { startDate: '2026-01-01', endDate: '2026-12-31', format: 'pdf' };
  await check('cartera', require('../src/controllers/reportsController').getDelinquency, {
    startMonth:'2026-01',endMonth:'2026-08',format:'pdf'
  });
  await check('bancos', require('../src/controllers/reportsController').getBankReport, {
    startMonth:'2026-01',endMonth:'2026-08',format:'pdf'
  });
  await check('cobranza por mes facturado', require('../src/controllers/reportsController').getRecollection, {
    startMonth: '2026-08', endMonth: '2026-08', format: 'pdf'
  });
  await check('reporte detallado de ingresos', require('../src/controllers/reportsController').getIncomesReport, {
    startMonth: '2026-08', endMonth: '2026-08', format: 'pdf'
  });
  await check('reporte diario', require('../src/controllers/dailyCollectionsReportController').getDailyCollections, range);
  await check('arqueo 30 agosto', require('../src/controllers/dailyCollectionsReportController').getDailyCollections, {
    date:'2026-08-30',format:'pdf'
  });
  await check('reporte integral', require('../src/controllers/comprehensiveReportController').getComprehensivePdf, range);
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
