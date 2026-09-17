// Solo copia local explícita: todas las filas y pagos de prueba se revierten.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const pool=require('../src/config/db');
async function main() {
  const expected=process.argv.find(a=>a.startsWith('--test-database='))?.slice(16);
  assert.ok(expected,'Indique --test-database=NOMBRE_COPIA');
  const db=await pool.getConnection();
  const original=pool.getConnection, originalQuery=pool.query;
  try {
    assert.equal((await db.query('SELECT DATABASE() name'))[0][0].name,expected);
    await db.beginTransaction();
    const adapter={query:db.query.bind(db),beginTransaction:()=>db.query('SAVEPOINT attendance_test'),
      commit:()=>db.query('RELEASE SAVEPOINT attendance_test'),rollback:()=>db.query('ROLLBACK TO SAVEPOINT attendance_test'),release:()=>{}};
    pool.getConnection=async()=>adapter; pool.query=adapter.query;
    const [[actor]]=await db.query('SELECT system_user_id FROM system_users LIMIT 1');
    const [users]=await db.query('SELECT user_id FROM users WHERE status=TRUE AND exempt_from_fines=FALSE LIMIT 2');
    assert.equal(users.length,2);
    const month='2098-11';
    const [[existing]]=await db.query('SELECT COUNT(*) n FROM invoices WHERE billing_month=?',[month]);
    assert.equal(existing.n,0,'Mes de pruebas debe estar libre');
    const meetings=require('../src/models/meetingsModel');
    const attendance=require('../src/models/attendanceModel');
    const payments=require('../src/models/paymentsModel');
    await assert.rejects(meetings.createMeeting({reason:'TEST ROLLBACK',meeting_date:'2025-01-01',meeting_type:'minga',fine_amount:15,application_month:month}),/actual o el anterior/);
    // Fixture aislada que representa una reunión ya existente; la API no permite crear meses futuros.
    const [concept]=await db.query("INSERT INTO additional_concepts(concept_type,description,amount,applies_to,application_month) VALUES ('fine','TEST ROLLBACK',15,'user',?)",[month]);
    const [event]=await db.query("INSERT INTO meetings(reason,meeting_date,meeting_type,concept_id) VALUES ('TEST ROLLBACK','2025-01-01','minga',?)",[concept.insertId]);
    const meetingId=event.insertId;
    const row={user_id:users[0].user_id,attended:'no',observations:'test'};
    const opts={application_month:month,reason:'Prueba reversible'};
    const apply=(records,options=opts)=>attendance.updateAttendanceBulk(meetingId,records,actor.system_user_id,options);
    assert.equal((await apply([row],{...opts,preview:true})).added,1);
    assert.equal((await db.query('SELECT COUNT(*) n FROM attendance WHERE meeting_id=?',[meetingId]))[0][0].n,0);
    await apply([row]);
    const [[invoice]]=await db.query('SELECT * FROM invoices WHERE user_id=? AND billing_month=?',[row.user_id,month]);
    assert.equal(invoice.total_amount,15);
    assert.equal((await apply([row])).changes,0);
    console.log('PASS mes explícito independiente de fecha, vista previa sin escritura e idempotencia');
    await payments.collectCombinedPayment({invoiceIds:[invoice.invoice_id],amountTendered:15,paymentMethod:'cash',systemUserId:actor.system_user_id});
    await assert.rejects(apply([{...row,attended:'yes'},{user_id:users[1].user_id,attended:'no'}]),/No se guardó/);
    assert.equal((await db.query('SELECT COUNT(*) n FROM attendance WHERE meeting_id=?',[meetingId]))[0][0].n,1);
    assert.equal((await attendance.getAttendanceByMeetingId(meetingId)).find(r=>r.user_id===row.user_id).locked,true);
    // Simular total distinto sin alterar el pago, y probar defensa del procedure.
    await db.query('SAVEPOINT procedure_test');
    await db.query('UPDATE invoice_concept SET amount_snapshot=20 WHERE invoice_id=?',[invoice.invoice_id]);
    await assert.rejects(db.query('CALL sp_update_invoice_total(?)',[invoice.invoice_id]),/protegida/);
    await db.query('ROLLBACK TO SAVEPOINT procedure_test');
    console.log('PASS factura pagada bloqueada, atomicidad y protección del procedure');
    await payments.voidPayment(invoice.invoice_id,actor.system_user_id,'Prueba reversible');
    assert.equal((await attendance.getAttendanceByMeetingId(meetingId)).find(r=>r.user_id===row.user_id).locked,false);
    await assert.rejects(apply([{...row,attended:'yes'}],{application_month:month}),/motivo/);
    await apply([{...row,attended:'yes'}]);
    assert.equal((await db.query('SELECT total_amount FROM invoices WHERE invoice_id=?',[invoice.invoice_id]))[0][0].total_amount,0);
    await apply([row]);
    assert.equal((await db.query('SELECT total_amount FROM invoices WHERE invoice_id=?',[invoice.invoice_id]))[0][0].total_amount,15);
    const [[audit]]=await db.query("SELECT COUNT(*) n FROM financial_audit_log WHERE action='ATTENDANCE_UPDATED' AND entity_id=?",[meetingId]);
    assert.equal(audit.n,3);
    await assert.rejects(meetings.deleteMeeting(meetingId),/historial/);
    console.log('PASS anulación habilita corrección, motivo obligatorio, recálculo e historial');
    // Pending con pago vigente debe seguir bloqueada aunque su estado sea inconsistente.
    await payments.collectCombinedPayment({invoiceIds:[invoice.invoice_id],amountTendered:15,paymentMethod:'cash',systemUserId:actor.system_user_id});
    await db.query("UPDATE invoices SET status='pending' WHERE invoice_id=?",[invoice.invoice_id]);
    await assert.rejects(apply([{...row,attended:'yes'}]),/pagos o abonos/);
    console.log('PASS estado pendiente con cobros vigentes no permite cambios');
    const [paidWithoutFine]=await db.query("INSERT INTO invoices(user_id,invoice_type,billing_month,total_amount,status) VALUES (?,'water',?,7,'paid')",[users[1].user_id,month]);
    const second={user_id:users[1].user_id,attended:'no'};
    await assert.rejects(apply([second]),/No se guardó/);
    assert.equal((await attendance.getAttendanceByMeetingId(meetingId)).find(r=>r.user_id===second.user_id).locked,true);
    await db.query("UPDATE invoices SET status='cancelled' WHERE invoice_id=?",[paidWithoutFine.insertId]);
    await assert.rejects(apply([second]),/No se guardó/);
    await assert.rejects(apply([{...row,expected:null,attended:'yes'}]),/cambió/);
    await assert.rejects(apply([second],{...opts,application_month:'2098-10'}),/mes de cobro cambió/);
    console.log('PASS factura pagada SIN multa previa, anulada y pantalla desactualizada bloqueadas');
    await assert.rejects(meetings.updateMeeting(meetingId,{reason:'TEST',meeting_date:'2025-01-01',meeting_type:'minga',fine_amount:15,application_month:'2098-12'}),/ya tiene asistencia/);
    const [admin]=await db.query("INSERT INTO administrations(name,start_date) VALUES ('TEST ROLLBACK',CURRENT_DATE)");
    await db.query(`INSERT INTO accounting_periods (administration_id,system_user_id,title,start_date,end_date,previous_balance,total_incomes,total_expenses,system_balance,physical_balance,difference)
      VALUES (?,?,'TEST ROLLBACK','2098-11-01','2098-11-30',0,0,0,0,0,0)`,[admin.insertId,actor.system_user_id]);
    await assert.rejects(apply([row]),/cerrado/);
    await db.query("UPDATE invoices SET status='pending' WHERE invoice_id=?",[paidWithoutFine.insertId]);
    await assert.rejects(db.query('CALL sp_update_invoice_total(?)',[paidWithoutFine.insertId]),/cerrado/);
    console.log('PASS período cerrado y metadatos de reunión protegidos');
  } finally {
    pool.getConnection=original; pool.query=originalQuery;
    await db.rollback();db.release();await pool.end();
    console.log('ROLLBACK completo: no se conservan filas ni pagos de prueba');
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
