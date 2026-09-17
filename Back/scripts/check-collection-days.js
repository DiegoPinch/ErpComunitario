require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const pool=require('../src/config/db');
const {listCollectionDays}=require('../src/controllers/cashCountController');

(async()=>{
  let payload;
  await listCollectionDays({query:{year:'2026'}},{json:value=>{payload=value;}},error=>{throw error;});
  assert.ok(Array.isArray(payload));
  assert.ok(payload.every(row=>/^2026-\d{2}-\d{2}$/.test(row.collection_date)));
  assert.ok(payload.every(row=>Number.isFinite(Number(row.expected_cash))));
  console.table(payload.map(row=>({fecha:row.collection_date,movimientos:row.movement_count,
    total:row.total_income,esperado_efectivo:row.expected_cash,
    arqueo:row.count_status})));
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>pool.end());
