const pool = require('../config/db');
const {lockFinancialLedger} = require('../utils/periodLock');
const {fail,assertMonthOpen,assertSelectableMonth} = require('../utils/fineSafety');
const {money} = require('../utils/accountingRules');

const formatDateES = (dateStr) => {
  if (!dateStr) return '';
  const datePart = typeof dateStr === 'string' ? dateStr.substring(0, 10) : new Date(dateStr).toISOString().substring(0, 10);
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
};

const formatMonthES = (dateStr) => {
  if (!dateStr) return '';
  const datePart = typeof dateStr === 'string' ? dateStr.substring(0, 10) : new Date(dateStr).toISOString().substring(0, 10);
  const [year, month] = datePart.split('-');
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[parseInt(month) - 1]} ${year}`;
};

const getAllMeetings = async () => {
  const query = `
    SELECT 
      m.meeting_id,
      m.reason,
      m.meeting_date,
      m.minutes,
      m.notes,
      m.meeting_type,
      m.fine_config_id,
      m.concept_id,
      ac.application_month,
      (EXISTS(SELECT 1 FROM attendance a WHERE a.meeting_id=m.meeting_id) OR EXISTS(SELECT 1 FROM invoice_concept ic WHERE ic.concept_id=m.concept_id)) AS financial_locked,
      COALESCE(ac.amount, 0.00) as fine_amount
    FROM meetings m
    LEFT JOIN additional_concepts ac ON m.concept_id = ac.concept_id
    ORDER BY m.meeting_date DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

const getMeetingById = async (id) => {
  const query = `
    SELECT 
      m.meeting_id,
      m.reason,
      m.meeting_date,
      m.minutes,
      m.notes,
      m.meeting_type,
      m.fine_config_id,
      m.concept_id,
      ac.application_month,
      (EXISTS(SELECT 1 FROM attendance a WHERE a.meeting_id=m.meeting_id) OR EXISTS(SELECT 1 FROM invoice_concept ic WHERE ic.concept_id=m.concept_id)) AS financial_locked,
      COALESCE(ac.amount, 0.00) as fine_amount
    FROM meetings m
    LEFT JOIN additional_concepts ac ON m.concept_id = ac.concept_id
    WHERE m.meeting_id = ?
  `;
  const [rows] = await pool.query(query, [id]);
  return rows[0];
};

const createMeeting = async (meeting) => {
  const { reason, meeting_date, minutes, notes, meeting_type, fine_config_id, fine_amount } = meeting;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    await assertSelectableMonth(connection,meeting.application_month);
    if (money(fine_amount)<0) throw fail('La multa no puede ser negativa',400);

    // El mes de facturación se elige explícitamente; no se deriva de la fecha del evento.
    const appMonth = meeting.application_month;

    // 2. Format the concept description exactly as requested
    const typeLabel = meeting_type === 'minga' ? 'Minga' : 'Sesión';
    const dateFormatted = formatDateES(meeting_date);
    const monthFormatted = formatMonthES(meeting_date);
    const conceptDescription = `Multa Inasistencia a ${typeLabel} - ${monthFormatted}, Fecha: ${dateFormatted}`;

    // 3. Create the additional concept of type 'fine'
    const [conceptResult] = await connection.query(
      `INSERT INTO additional_concepts (concept_type, description, amount, applies_to, application_month)
       VALUES ('fine', ?, ?, 'user', ?)`,
      [conceptDescription, fine_amount ?? 5.00, appMonth]
    );
    const conceptId = conceptResult.insertId;

    // 4. Create the meeting linked to the concept
    const [meetingResult] = await connection.query(
      `INSERT INTO meetings (reason, meeting_date, minutes, notes, meeting_type, fine_config_id, concept_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reason,
        meeting_date ?? null,
        minutes ?? null,
        notes ?? null,
        meeting_type ?? 'session',
        fine_config_id ?? null,
        conceptId
      ]
    );
    const meetingId = meetingResult.insertId;

    await connection.commit();
    return meetingId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const updateMeeting = async (id, meeting) => {
  const { reason, meeting_date, minutes, notes, meeting_type, fine_config_id, fine_amount } = meeting;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    await assertMonthOpen(connection,meeting.application_month);

    // 1. Get current meeting to check its concept_id
    const [current] = await connection.query(
      `SELECT m.*, ac.application_month, ac.amount as old_fine_amount
       FROM meetings m 
       LEFT JOIN additional_concepts ac ON m.concept_id = ac.concept_id 
       WHERE m.meeting_id = ?`,
      [id]
    );
    
    if (current.length === 0) {
      throw new Error('Reunión no encontrada');
    }

    const { concept_id, old_fine_amount } = current[0];
    const [usage] = await connection.query(`SELECT
      (SELECT COUNT(*) FROM attendance WHERE meeting_id=?) +
      (SELECT COUNT(*) FROM invoice_concept WHERE concept_id=?) AS count`,[id,concept_id]);
    if (Number(usage[0].count)===0) await assertSelectableMonth(connection,meeting.application_month);
    const previousDate = current[0].meeting_date instanceof Date
      ? `${current[0].meeting_date.getFullYear()}-${String(current[0].meeting_date.getMonth()+1).padStart(2,'0')}-${String(current[0].meeting_date.getDate()).padStart(2,'0')}`
      : String(current[0].meeting_date).slice(0,10);
    if (Number(usage[0].count)>0 && (current[0].application_month!==meeting.application_month ||
        money(old_fine_amount)!==money(fine_amount) || previousDate!==String(meeting_date).slice(0,10) ||
        current[0].meeting_type!==meeting_type || Number(current[0].fine_config_id)!==Number(fine_config_id))) {
      throw fail('Esta reunión ya tiene asistencia o multas. No se puede cambiar fecha, mes de cobro o tarifa; corrija la asistencia con motivo o registre un nuevo evento.');
    }
    if (money(fine_amount)<0) throw fail('La multa no puede ser negativa',400);

    // Mantener separado el mes de facturación de la fecha del evento.
    const appMonth = meeting.application_month;

    // 3. Update concept if it exists
    if (concept_id) {
      const typeLabel = meeting_type === 'minga' ? 'Minga' : 'Sesión';
      const dateFormatted = formatDateES(meeting_date);
      const monthFormatted = formatMonthES(meeting_date);
      const conceptDescription = `Multa Inasistencia a ${typeLabel} - ${monthFormatted}, Fecha: ${dateFormatted}`;

      await connection.query(
        `UPDATE additional_concepts 
         SET description = ?, amount = ?, application_month = ?
         WHERE concept_id = ?`,
        [conceptDescription, fine_amount, appMonth, concept_id]
      );

      // Recalculate impact if amount changed
      if (old_fine_amount !== undefined && parseFloat(old_fine_amount) !== parseFloat(fine_amount)) {
        await connection.query('CALL sp_recalculate_concept_impact(?)', [concept_id]);
      }
    }

    // 4. Update meeting details
    const [result] = await connection.query(
      `UPDATE meetings 
       SET reason = ?, meeting_date = ?, minutes = ?, notes = ?, meeting_type = ?, fine_config_id = ?
       WHERE meeting_id = ?`,
      [
        reason,
        meeting_date,
        minutes ?? null,
        notes ?? null,
        meeting_type ?? 'session',
        fine_config_id ?? null,
        id
      ]
    );

    await connection.commit();
    return result.affectedRows;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const deleteMeeting = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);

    // 1. Get concept_id
    const [current] = await connection.query('SELECT concept_id FROM meetings WHERE meeting_id = ?', [id]);
    if (current.length === 0) {
      await connection.commit();
      return 0;
    }

    const { concept_id } = current[0];
    const [usage] = await connection.query(`SELECT
      (SELECT COUNT(*) FROM attendance WHERE meeting_id=?) +
      (SELECT COUNT(*) FROM invoice_concept WHERE concept_id=?) AS count`,[id,concept_id]);
    if (Number(usage[0].count)>0) throw fail('No se puede eliminar una reunión con asistencia o multas registradas. Conserve el historial y corrija la asistencia.');

    // 2. Shield: if concept is linked to paid invoices, prevent deletion
    if (concept_id) {
      const [paidLinks] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM invoice_concept ic
        JOIN invoices i ON ic.invoice_id = i.invoice_id
        WHERE ic.concept_id = ? AND i.status = 'paid'
      `, [concept_id]);

      if (paidLinks[0].count > 0) {
        throw new Error('No se puede eliminar la reunión porque las multas asociadas ya han sido cobradas en facturas pagadas.');
      }
    }

    // 3. Delete meeting first
    const [meetingResult] = await connection.query('DELETE FROM meetings WHERE meeting_id = ?', [id]);

    // 4. If concept exists, delete it and its associations
    if (concept_id) {
      const [affectedInvoices] = await connection.query(
        'SELECT invoice_id FROM invoice_concept WHERE concept_id = ?',
        [concept_id]
      );

      await connection.query('DELETE FROM invoice_concept WHERE concept_id = ?', [concept_id]);
      await connection.query('DELETE FROM additional_concepts WHERE concept_id = ?', [concept_id]);

      if (affectedInvoices.length > 0) {
        for (const inv of affectedInvoices) {
          await connection.query('CALL sp_update_invoice_total(?)', [inv.invoice_id]);
        }
      }
    }

    await connection.commit();
    return meetingResult.affectedRows;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
};
