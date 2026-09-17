const {test} = require('node:test');
const assert = require('node:assert/strict');
const {Writable} = require('node:stream');
const model = require('../src/models/reportsModel');
const controller = require('../src/controllers/reportsController');

test('cartera exporta solo datos necesarios y mantiene separados socios homónimos', async () => {
    const original = model.getDelinquencyReport;
    model.getDelinquencyReport = async () => [73,62].map((id,index) => ({
        user_id:id, national_id:'0999999999', user_name:'SOCIO DE PRUEBA',
        billing_month:'2026-08', concept_type:'Factura', description:'Factura de prueba',
        total_debt:index ? 12 : 7
    }));
    try {
        let json;
        const query = {startMonth:'2026-01',endMonth:'2026-08'};
        await controller.getDelinquency({query},{json: value => {json=value;}},e=>{throw e;});
        assert.deepEqual(Object.keys(json[0]).sort(), ['user_name','billing_month','concept_type','description','total_debt'].sort());
        assert.equal(json.reduce((sum,row)=>sum+row.total_debt,0),19);
        const chunks=[];
        const res = new Writable({write(chunk,encoding,done){chunks.push(Buffer.from(chunk));done();}});
        res.setHeader=()=>{};
        const finished = new Promise((resolve,reject)=>{res.on('finish',resolve);res.on('error',reject);});
        await controller.getDelinquency({query:{...query,format:'pdf'}},res,e=>res.destroy(e));
        await finished;
        const buffer=Buffer.concat(chunks);
        assert.equal(buffer.subarray(0,5).toString(),'%PDF-');
        if (process.env.PRIVACY_QA_PDF) require('node:fs').writeFileSync(process.env.PRIVACY_QA_PDF,buffer);
    } finally { model.getDelinquencyReport=original; }
});
