// Datos sintéticos únicamente para la copia local confirmada por el usuario.
require('dotenv').config({quiet:true});
const {randomInt}=require('node:crypto');
const assert=require('node:assert/strict');
const pool=require('../src/config/db');
const {lockFinancialLedger,assertAccountingDateOpen}=require('../src/utils/periodLock');
const {assertMonthOpen,invoiceBlock}=require('../src/utils/fineSafety');
async function main(){
  assert.ok(['localhost','127.0.0.1'].includes(process.env.DB_HOST),'Solo host local');
  const db=await pool.getConnection();
  const month='2026-09';
  try {
    const [[target]]=await db.query('SELECT DATABASE() name');
    assert.equal(target.name,'water_system_prod');
    const [[routine]]=await db.query('SHOW CREATE PROCEDURE sp_record_reading_and_invoice');
    assert.ok(!/\b(COMMIT|START TRANSACTION|ROLLBACK)\b/i.test(routine['Create Procedure']),'Procedure no debe controlar la transacción externa');
    await db.beginTransaction();
    await lockFinancialLedger(db);
    await assertMonthOpen(db,month);
    await assertAccountingDateOpen(db,new Date());
    const [before]=await db.query('SELECT * FROM readings WHERE month_year=? ORDER BY reading_id',[month]);
    const [pending]=await db.query(`SELECT mh.user_id,m.meter_id,m.type,
      COALESCE((SELECT r.current_reading FROM readings r WHERE r.meter_id=m.meter_id AND r.month_year<? ORDER BY r.month_year DESC LIMIT 1),m.initial_reading) previous_reading
      FROM meter_history mh JOIN meters m ON m.meter_id=mh.meter_id
      WHERE mh.assigned=1 AND NOT EXISTS(SELECT 1 FROM readings r WHERE r.meter_id=m.meter_id AND r.month_year=?)`,[month,month]);
    assert.equal(new Set(pending.map(r=>r.meter_id)).size,pending.length,'Asignaciones duplicadas');
    const ready=[],skipped=[];
    for(const row of pending){
      const [invoices]=await db.query("SELECT * FROM invoices WHERE user_id=? AND billing_month=? AND invoice_type='water'",[row.user_id,month]);
      let reason=invoices.length>1?'Varias facturas':null;
      for(const inv of invoices) reason ||= await invoiceBlock(db,inv);
      const [future]=await db.query('SELECT reading_id FROM readings WHERE meter_id=? AND month_year>? LIMIT 1',[row.meter_id,month]);
      if(future.length) reason='Tiene lecturas posteriores';
      if(reason){skipped.push({meter_id:row.meter_id,reason});continue;}
      assert.ok(Number.isInteger(Number(row.previous_reading)) && Number(row.previous_reading)>=0);
      ready.push({...row,current_reading:Number(row.previous_reading)+randomInt(1,9)});
    }
    console.log(JSON.stringify({database:target.name,month,existing:before.length,pending:pending.length,toInsert:ready.length,consumption:'1 a 8 m3 por medidor',skipped}));
    if(!process.argv.includes('--apply')){await db.rollback();return;}
    for(const row of ready){
      await db.query('CALL sp_record_reading_and_invoice(?,?,?,?)',[row.user_id,row.meter_id,month,row.current_reading]);
    }
    const [after]=await db.query('SELECT * FROM readings WHERE month_year=? ORDER BY reading_id',[month]);
    assert.deepEqual(after.filter(r=>before.some(b=>b.reading_id===r.reading_id)),before,'Se alteraron lecturas existentes');
    assert.equal(after.length,before.length+ready.length);
    const inserted=after.filter(r=>!before.some(b=>b.reading_id===r.reading_id));
    assert.ok(inserted.every(r=>r.consumption>=1 && r.consumption<=8));
    await db.commit();
    console.log(JSON.stringify({saved:inserted.length,totalReadings:after.length,readingIds:inserted.map(r=>r.reading_id),readingAmount:inserted.reduce((s,r)=>s+Math.round(Number(r.amount)*100),0)/100}));
  }catch(e){await db.rollback();throw e;}finally{db.release();await pool.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
