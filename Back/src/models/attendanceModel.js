const pool = require('../config/db');
const {lockFinancialLedger, assertAccountingDateOpen} = require('../utils/periodLock');
const {fail, assertMonthOpen, invoiceBlock} = require('../utils/fineSafety');
async function meetingData(db,id) {
  const [rows] = await db.query(`SELECT m.*,ac.application_month,ac.amount FROM meetings m
    JOIN additional_concepts ac ON ac.concept_id=m.concept_id WHERE m.meeting_id=?`,[id]);
  if (!rows.length) throw fail('Reunión o concepto de multa no encontrado',404);
  return rows[0];
}
async function userInvoices(db, meeting, userId) {
  const [rows] = await db.query(`SELECT DISTINCT i.* FROM invoices i WHERE i.user_id=? AND
    ((i.billing_month=? AND i.invoice_type='water') OR EXISTS
      (SELECT 1 FROM invoice_concept ic WHERE ic.invoice_id=i.invoice_id AND ic.concept_id=?)) ORDER BY i.invoice_id`,
    [userId,meeting.application_month,meeting.concept_id]);
  return rows;
}
async function getAttendanceByMeetingId(meetingId) {
  const meeting = await meetingData(pool,meetingId);
  const [rows] = await pool.query(`SELECT u.user_id,CONCAT_WS(' ',u.last_name,u.first_name) user_name,
    a.attendance_id,COALESCE(a.attended,'yes') attended,a.observations
    FROM users u LEFT JOIN attendance a ON a.user_id=u.user_id AND a.meeting_id=?
    WHERE u.status=TRUE AND u.exempt_from_fines=FALSE ORDER BY u.last_name,u.first_name`,[meetingId]);
  let monthBlock = null;
  try { await assertMonthOpen(pool,meeting.application_month); } catch(e) { monthBlock=e.message; }
  for (const row of rows) {
    const invoices = await userInvoices(pool,meeting,row.user_id);
    row.lock_reason = monthBlock;
    for (const invoice of invoices) row.lock_reason ||= await invoiceBlock(pool,invoice);
    if (invoices.length>1) row.lock_reason ||= 'Hay varias facturas posibles; se requiere revisión';
    row.locked = Boolean(row.lock_reason);
    row.invoice_status = invoices[0]?.status || null;
    row.application_month = meeting.application_month;
  }
  return rows;
}
async function updateAttendanceBulk(meetingId, list, actor, options = {}) {
  if (!Array.isArray(list) || !list.length) throw fail('La lista de asistencia está vacía',400);
  if (!actor) throw fail('Responsable requerido',401);
  const ids = list.map(r=>Number(r.user_id));
  if (new Set(ids).size!==ids.length || ids.some(id=>!Number.isInteger(id)||id<=0) ||
      list.some(r=>!['yes','no','justified'].includes(r.attended))) throw fail('Asistencia inválida o usuarios duplicados',400);
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    await lockFinancialLedger(db);
    const meeting = await meetingData(db,meetingId);
    if (options.application_month !== meeting.application_month) throw fail('El mes de cobro cambió. Recargue la asistencia y revise el mes.');
    await assertMonthOpen(db,meeting.application_month);
    await assertAccountingDateOpen(db,new Date());
    const plans=[], conflicts=[];
    for (const record of list) {
      const [users] = await db.query('SELECT user_id FROM users WHERE user_id=? AND status=TRUE AND exempt_from_fines=FALSE',[record.user_id]);
      if (!users.length) throw fail('La lista contiene un socio inactivo, exento o inexistente',400);
      const [previousRows] = await db.query('SELECT * FROM attendance WHERE meeting_id=? AND user_id=?',[meetingId,record.user_id]);
      if (previousRows.length>1) throw fail('Existen asistencias duplicadas; revise los datos antes de continuar');
      const previous=previousRows[0];
      const fingerprint=previous ? JSON.stringify([previous.attended,String(previous.observations || '').trim()]) : null;
      if (Object.prototype.hasOwnProperty.call(record,'expected') && record.expected!==fingerprint) {
        throw fail('La asistencia cambió desde que abrió la pantalla. Recargue la lista antes de guardar.');
      }
      const observations=String(record.observations || '').trim();
      if (previous && previous.attended===record.attended && String(previous.observations || '').trim()===observations) continue;
      // El cliente envía únicamente cambios; para listas antiguas sin registro, un sí implícito no afecta una factura protegida.
      const invoices=await userInvoices(db,meeting,record.user_id);
      let blocked=null;
      for (const invoice of invoices) blocked ||= await invoiceBlock(db,invoice);
      if (invoices.length>1) blocked ||= 'Hay varias facturas posibles; se requiere revisión';
      if (blocked) { conflicts.push(`Socio ${record.user_id}: ${blocked}`); continue; }
      plans.push({record,previous,observations,invoice:invoices[0]});
    }
    if (conflicts.length) throw fail(`No se guardó ningún cambio. ${conflicts.join(' ')}`);
    const summary={application_month:meeting.application_month,changes:plans.length,
      added:plans.filter(p=>p.record.attended==='no'&&p.previous?.attended!=='no').length,
      removed:plans.filter(p=>p.previous?.attended==='no'&&p.record.attended!=='no').length};
    summary.added_amount=Number((summary.added*Number(meeting.amount)).toFixed(2));
    if (options.preview) { await db.rollback(); return summary; }
    if (plans.some(p=>p.previous) && String(options.reason || '').trim().length<5) throw fail('Indique un motivo de corrección de al menos 5 caracteres',400);
    for (const plan of plans) {
      const {record,previous,observations}=plan;
      let invoice=plan.invoice;
      if (record.attended==='no') {
        if (!invoice) {
          const [created]=await db.query(`INSERT INTO invoices (user_id,invoice_type,billing_month,description,total_amount,issue_date,status)
            VALUES (?,'water',?,'Factura Mensual',0,CURRENT_DATE,'pending')`,[record.user_id,meeting.application_month]);
          invoice={invoice_id:created.insertId};
        }
        const [linked]=await db.query('SELECT id FROM invoice_concept WHERE invoice_id=? AND concept_id=?',[invoice.invoice_id,meeting.concept_id]);
        if (!linked.length) await db.query(`INSERT INTO invoice_concept
          (invoice_id,concept_id,amount_snapshot,description_snapshot,concept_type_snapshot)
          SELECT ?,concept_id,amount,description,concept_type FROM additional_concepts WHERE concept_id=?`,[invoice.invoice_id,meeting.concept_id]);
      } else if (invoice) {
        await db.query('DELETE FROM invoice_concept WHERE invoice_id=? AND concept_id=?',[invoice.invoice_id,meeting.concept_id]);
      }
      if (invoice) await db.query('CALL sp_update_invoice_total(?)',[invoice.invoice_id]);
      if (previous) await db.query('UPDATE attendance SET attended=?,observations=? WHERE attendance_id=?',[record.attended,observations,previous.attendance_id]);
      else await db.query('INSERT INTO attendance (meeting_id,user_id,attended,observations) VALUES (?,?,?,?)',[meetingId,record.user_id,record.attended,observations]);
      await db.query(`INSERT INTO financial_audit_log (system_user_id,action,entity_type,entity_id,reason,before_json,after_json)
        VALUES (?,'ATTENDANCE_UPDATED','meeting',?,?,?,?)`,[actor,meetingId,String(options.reason || 'Registro de asistencia').slice(0,255),
        JSON.stringify(previous || null),JSON.stringify({...record,application_month:meeting.application_month,invoice_id:invoice?.invoice_id})]);
    }
    await db.commit();
    return summary;
  } catch(e) { await db.rollback(); throw e; } finally { db.release(); }
}
const getAllAttendance=async()=> (await pool.query('SELECT * FROM attendance'))[0];
const getAttendanceById=async id=> (await pool.query('SELECT * FROM attendance WHERE attendance_id=?',[id]))[0][0];
module.exports={getAllAttendance,getAttendanceById,getAttendanceByMeetingId,updateAttendanceBulk};
