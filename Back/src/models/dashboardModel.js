const pool=require('../config/db');
const {getCashBalanceReport}=require('./reportsModel');
const {getReceivables}=require('./receivablesModel');
const {monthWindow}=require('../utils/fineSafety');
const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
async function getDashboardStats(month=monthWindow().current){
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month)) || month<'2000-01' || month>monthWindow().current)
    throw Object.assign(new Error('Seleccione un mes válido, no futuro'),{status:400});
  const year=month.slice(0,4);
  const [[dates]]=await pool.query("SELECT LAST_DAY(CONCAT(?,'-01')) last_day",[month]);
  const day=dates.last_day instanceof Date ? dates.last_day.getDate():Number(String(dates.last_day).slice(8,10));
  const cutoff=`${month}-${day} 23:59:59`;
  const [flow,receivables,[consumption],[breakdown],[users],[billing]]=await Promise.all([
    getCashBalanceReport(`${year}-01`,`${year}-12`),getReceivables(cutoff),
    pool.query(`SELECT r.month_year month,
      SUM(CASE WHEN UPPER(m.type)='CONSUMO' THEN r.consumption ELSE 0 END) domestic_consumption,
      SUM(CASE WHEN UPPER(m.type)='RIEGO' THEN r.consumption ELSE 0 END) irrigation_consumption
      FROM readings r JOIN meters m ON m.meter_id=r.meter_id JOIN invoices i ON i.invoice_id=r.invoice_id
      WHERE r.month_year BETWEEN ? AND ? AND i.status<>'cancelled' GROUP BY r.month_year`,[`${year}-01`,`${year}-12`]),
    pool.query(`SELECT 'Facturas' category,COALESCE(SUM(invoice_amount),0) amount FROM payments WHERE status='posted' AND DATE_FORMAT(payment_date,'%Y-%m')=?
      UNION ALL SELECT 'Abonos a cuentas por cobrar',COALESCE(SUM(amount_paid),0) FROM debt_payments WHERE status='posted' AND DATE_FORMAT(payment_date,'%Y-%m')=?
      UNION ALL SELECT 'Ingresos extraordinarios',COALESCE(SUM(amount),0) FROM other_incomes WHERE status='posted' AND DATE_FORMAT(income_date,'%Y-%m')=?`,[month,month,month]),
    pool.query('SELECT COUNT(*) count FROM users WHERE status=TRUE'),
    pool.query(`SELECT i.billing_month month,SUM(i.total_amount) billed,
      SUM(COALESCE(p.paid,0)) collected,
      SUM(GREATEST(i.total_amount-COALESCE(p.paid,0),0)) pending
      FROM invoices i LEFT JOIN (SELECT invoice_id,SUM(invoice_amount) paid FROM payments
        WHERE status='posted' GROUP BY invoice_id) p ON p.invoice_id=i.invoice_id
      WHERE i.status<>'cancelled' AND i.billing_month BETWEEN ? AND ?
      GROUP BY i.billing_month`,[`${year}-01`,`${year}-12`])
  ]);
  const months=Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);
  const history=months.map(value=>({month:value,
    income:round(billing.find(r=>r.month===value)?.collected||0),
    billed:round(billing.find(r=>r.month===value)?.billed||0),
    pending:round(billing.find(r=>r.month===value)?.pending||0),
    expense:round(flow.egresos.find(r=>r.mes===value)?.total_egresos||0)}));
  const selected=history.find(r=>r.month===month);
  const groups=new Map();
  for(const r of receivables){
    const item=groups.get(r.user_id)||{name:r.user_name,total_amount:0,months:new Set()};
    item.total_amount+=Math.round(Number(r.total_debt)*100);
    if(r.invoice_id && r.billing_month) item.months.add(r.billing_month);
    groups.set(r.user_id,item);
  }
  return {month,year,kpis:{income:selected.income,expense:selected.expense,billed:selected.billed,
    debt:selected.pending,activeUsers:Number(users[0].count)},
    breakdown:breakdown.slice(1),history,consumption:months.map(value=>({month:value,domestic_consumption:0,irrigation_consumption:0,...consumption.find(r=>r.month===value)})),
    debtors:[...groups.values()].sort((a,b)=>b.total_amount-a.total_amount).slice(0,10)
      .map(r=>({name:r.name,total_amount:r.total_amount/100,months:r.months.size}))};
}
module.exports={getDashboardStats};
