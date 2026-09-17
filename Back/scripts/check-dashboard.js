require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const pool=require('../src/config/db');
const {getDashboardStats}=require('../src/models/dashboardModel');
const {getCashBalanceReport}=require('../src/models/reportsModel');
async function main(){
  try{
    for(const month of ['2026-01','2026-08','2026-09']){
      const data=await getDashboardStats(month);
      const report=await getCashBalanceReport(month,month);
      assert.equal(data.history.length,12);
      assert.equal(data.consumption.length,12);
      assert.equal(data.history[0].month,'2026-01');
      assert.equal(data.history[11].month,'2026-12');
      const [[paid]]=await pool.query(`SELECT COALESCE(SUM(p.invoice_amount),0) total FROM payments p
        JOIN invoices i ON i.invoice_id=p.invoice_id WHERE p.status='posted' AND i.status<>'cancelled' AND i.billing_month=?`,[month]);
      assert.equal(data.kpis.income,Number(paid.total));
      assert.equal(data.kpis.expense,Number(report.egresos[0]?.total_egresos||0));
      assert.equal(Math.round((data.kpis.income+data.kpis.debt)*100),Math.round(data.kpis.billed*100));
      assert.ok(data.debtors.every(r=>!('national_id' in r)));
      console.log('PASS',month,JSON.stringify(data.kpis));
    }
    await assert.rejects(getDashboardStats('2026-13'),/mes válido/);
    await assert.rejects(getDashboardStats('2099-01'),/mes válido/);
  }finally{await pool.end();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
