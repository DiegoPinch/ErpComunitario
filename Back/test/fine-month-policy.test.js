const test=require('node:test');
const assert=require('node:assert/strict');
const {monthWindow,assertSelectableMonth,selectableMonths}=require('../src/utils/fineSafety');
const db=({closed=false,paid=false}={})=>({query:async sql=>[sql.includes('accounting_periods')?(closed?[{period_id:1}]:[]):(paid?[{invoice_id:1}]:[])]});
test('ventana mensual usa Ecuador y resuelve cambio de año',()=>{
  assert.deepEqual(monthWindow(new Date('2026-01-01T06:00:00Z')),{current:'2026-01',previous:'2025-12'});
  assert.deepEqual(monthWindow(new Date('2026-01-01T02:00:00Z')),{current:'2025-12',previous:'2025-11'});
});
test('rechaza meses futuros y antiguos, admite actual y anterior sin cobros',async()=>{
  const {current,previous}=monthWindow();
  await assertSelectableMonth(db(),current);
  await assertSelectableMonth(db(),previous);
  await assert.rejects(assertSelectableMonth(db(),'2099-12'),/actual o el anterior/);
  await assert.rejects(assertSelectableMonth(db(),'2000-01'),/actual o el anterior/);
});
test('anterior cobrado y períodos cerrados no son seleccionables',async()=>{
  const {current,previous}=monthWindow();
  await assert.rejects(assertSelectableMonth(db({paid:true}),previous),/cobros o abonos/);
  await assert.rejects(assertSelectableMonth(db({closed:true}),current),/cerrado/);
  const options=await selectableMonths(db({paid:true}));
  assert.equal(options[0].disabled,false);
  assert.equal(options[1].disabled,true);
});
