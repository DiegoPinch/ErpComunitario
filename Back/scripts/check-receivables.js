require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const pool=require('../src/config/db');
const {getReceivables}=require('../src/models/receivablesModel');
(async()=>{
    const db=await pool.getConnection();
    try {
        await db.beginTransaction();
        const [[p]]=await db.query(`SELECT p.payment_id,p.invoice_id,i.total_amount
          FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
          WHERE p.status='posted' AND i.total_amount>1
          AND (SELECT COUNT(*) FROM payments q WHERE q.invoice_id=i.invoice_id AND q.status='posted')=1 LIMIT 1`);
        assert.ok(p,'Se requiere una factura pagada para la prueba');
        const cutoff='2099-12-31 23:59:59';
        await db.query('UPDATE payments SET invoice_amount=0.50 WHERE payment_id=?',[p.payment_id]);
        let rows=await getReceivables(cutoff,db);
        assert.equal(Number(rows.find(r=>r.invoice_id===p.invoice_id).total_debt),Number(p.total_amount)-0.5);
        await db.query("UPDATE invoices SET status='cancelled' WHERE invoice_id=?",[p.invoice_id]);
        rows=await getReceivables(cutoff,db);
        assert.equal(rows.some(r=>r.invoice_id===p.invoice_id),false);
        console.log('PASS cartera: abono parcial descuenta el importe; factura cancelada excluida');
    } finally {await db.rollback();db.release();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>pool.end());
