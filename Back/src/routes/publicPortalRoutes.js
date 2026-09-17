const express=require('express');
const pool=require('../config/db');
const {getReceivables}=require('../models/receivablesModel');
const router=express.Router();
const attempts=new Map();
router.use((req,res,next)=>{
  res.set({'Cache-Control':'no-store, private','Pragma':'no-cache','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'});
  const now=Date.now();
  for(const [key,value] of attempts) if(value.until<=now) attempts.delete(key);
  const key=req.ip;
  if(!attempts.has(key) && attempts.size>=10000) return res.status(429).json({error:'Intente más tarde.'});
  const item=attempts.get(key)||{count:0,until:now+15*60*1000};
  attempts.set(key,item);item.count++;
  if(item.count>20) return res.status(429).json({error:'Demasiadas consultas. Espere 15 minutos.'});
  next();
});
router.post('/consulta',async(req,res)=>{
  const cedula=String(req.body?.cedula||'').trim();
  if(!/^\d{10}$/.test(cedula)) return res.status(400).json({error:'Ingrese una cédula de 10 dígitos.'});
  try{
    const [users]=await pool.query('SELECT user_id,CONCAT_WS(\' \',last_name,first_name) name FROM users WHERE national_id=? LIMIT 2',[cedula]);
    if(users.length!==1) return res.status(404).json({error:'No se pudo encontrar una cuenta para esta consulta. Comuníquese con la Junta.'});
    const user=users[0];
    const [invoices]=await pool.query(`SELECT i.invoice_id,i.billing_month,i.description,i.total_amount,i.status,
      COALESCE((SELECT SUM(p.invoice_amount) FROM payments p WHERE p.invoice_id=i.invoice_id AND p.status='posted'),0) paid
      FROM invoices i WHERE i.user_id=? ORDER BY i.billing_month DESC,i.invoice_id DESC`,[user.user_id]);
    const [readings]=await pool.query(`SELECT r.invoice_id,m.code meter_code,r.previous_reading,r.current_reading,r.consumption,r.amount
      FROM readings r JOIN invoices i ON i.invoice_id=r.invoice_id JOIN meters m ON m.meter_id=r.meter_id WHERE i.user_id=?`,[user.user_id]);
    const [concepts]=await pool.query(`SELECT ic.invoice_id,COALESCE(ic.description_snapshot,ac.description) description,
      COALESCE(ic.amount_snapshot,ac.amount) amount FROM invoice_concept ic JOIN invoices i ON i.invoice_id=ic.invoice_id
      JOIN additional_concepts ac ON ac.concept_id=ic.concept_id WHERE i.user_id=?`,[user.user_id]);
    const [payments]=await pool.query(`SELECT p.invoice_id,p.payment_id,p.payment_date,p.invoice_amount,p.status
      FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id WHERE i.user_id=? ORDER BY p.payment_date DESC`,[user.user_id]);
    const [attendance]=await pool.query(`SELECT m.reason,m.meeting_date,a.attended,ac.application_month,
      CASE WHEN a.attended='no' THEN ac.amount ELSE 0 END fine_amount
      FROM attendance a JOIN meetings m ON m.meeting_id=a.meeting_id LEFT JOIN additional_concepts ac ON ac.concept_id=m.concept_id
      WHERE a.user_id=? ORDER BY m.meeting_date DESC`,[user.user_id]);
    const [[clock]]=await pool.query('SELECT NOW() cutoff');
    const debts=(await getReceivables(clock.cutoff)).filter(r=>r.user_id===user.user_id && r.agreement_id)
      .map(r=>({description:r.description,remaining:Number(r.total_debt)}));
    const [debtPayments]=await pool.query(`SELECT dp.payment_date,dp.amount_paid,dp.status,pa.description
      FROM debt_payments dp JOIN payment_agreements pa ON pa.agreement_id=dp.agreement_id WHERE pa.user_id=? ORDER BY dp.payment_date DESC`,[user.user_id]);
    res.json({name:user.name,queriedAt:new Date().toISOString(),invoices:invoices.map(i=>({...i,
      remaining:i.status==='cancelled'?0:Math.max(0,Math.round((Number(i.total_amount)-Number(i.paid))*100)/100),
      readings:readings.filter(r=>r.invoice_id===i.invoice_id),concepts:concepts.filter(r=>r.invoice_id===i.invoice_id),payments:payments.filter(r=>r.invoice_id===i.invoice_id)})),attendance,debts,debtPayments});
  }catch(e){console.error('Error portal público:',e.code||'consulta');res.status(500).json({error:'No se pudo completar la consulta. Intente nuevamente.'});}
});
module.exports=router;
