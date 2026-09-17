const {test}=require('node:test');
const assert=require('node:assert/strict');
const pool=require('../src/config/db');
const controller=require('../src/controllers/cashCountController');

test('arqueo usa saldo del servidor y conserva conteo/responsable en auditoría',async()=>{
    const original=pool.getConnection;
    let recorded,expectedSql,committed=false;
    pool.getConnection=async()=>({
        beginTransaction:async()=>{},commit:async()=>{committed=true;},rollback:async()=>{},release:()=>{},
        query:async(sql,params)=>{
            if(sql.includes('accounting_ledger_lock'))return [[{lock_id:1}]];
            if(sql.includes('FROM accounting_periods'))return [[]];
            if(sql.includes('AS expected')){expectedSql=sql;return [[{expected:25.30}]];}
            recorded=params;return [{insertId:1}];
        }
    });
    try{
        let body;
        await controller.save({user:{id:73},body:{date:'2026-01-01',counted:24,expected:999,reason:'Conteo diario'}},
          {status:()=>({json:value=>{body=value;}})},error=>{throw error;});
        assert.equal(body.difference,-1.30);
        assert.equal(body.expected,25.30);
        assert.equal(recorded[0],73);
        assert.match(expectedSql,/BETWEEN \? AND \?/);
        assert.equal(body.scope,'daily_cash_movement');
        assert.equal(committed,true);
    }finally{pool.getConnection=original;}
});

test('arqueo rechaza conteo negativo antes de escribir',async()=>{
    let error;
    await controller.save({body:{date:'2026-01-01',counted:-1,reason:'Prueba'}},{},e=>{error=e;});
    assert.equal(error.status,400);
});
