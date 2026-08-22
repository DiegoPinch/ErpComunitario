const pool = require('../config/db');

const getAllAttendance = async () => {
  const [rows] = await pool.query('SELECT * FROM attendance');
  return rows;
};

const getAttendanceById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM attendance WHERE attendance_id = ?', [id]);
  return rows[0];
};

const getAttendanceByMeetingId = async (meetingId) => {
  const query = `
    SELECT 
      u.user_id,
      CONCAT(u.last_name, ' ', u.first_name) as user_name,
      u.national_id,
      a.attendance_id,
      COALESCE(a.attended, 'yes') as attended,
      a.observations,
      (
        SELECT i.status 
        FROM invoices i
        JOIN invoice_concept ic ON i.invoice_id = ic.invoice_id
        JOIN meetings m ON ic.concept_id = m.concept_id
        WHERE m.meeting_id = ? AND i.user_id = u.user_id
        LIMIT 1
      ) as invoice_status
    FROM users u
    LEFT JOIN attendance a ON u.user_id = a.user_id AND a.meeting_id = ?
    WHERE u.status = TRUE AND u.exempt_from_fines = FALSE
    ORDER BY u.last_name ASC, u.first_name ASC
  `;
  const [rows] = await pool.query(query, [meetingId, meetingId]);
  return rows;
};

const createAttendance = async (att) => {
  const { meeting_id, user_id, attended, observations } = att;
  const [result] = await pool.query(
    `INSERT INTO attendance (meeting_id, user_id, attended, observations) VALUES (?, ?, ?, ?)`,
    [meeting_id, user_id, attended, observations ?? null]
  );
  return result.insertId;
};

const updateAttendance = async (id, att) => {
  const { meeting_id, user_id, attended, observations } = att;
  const [result] = await pool.query(
    `UPDATE attendance SET meeting_id=?, user_id=?, attended=?, observations=? WHERE attendance_id=?`,
    [meeting_id, user_id, attended, observations, id]
  );
  return result.affectedRows;
};

const deleteAttendance = async (id) => {
  const [result] = await pool.query('DELETE FROM attendance WHERE attendance_id=?', [id]);
  return result.affectedRows;
};

const updateAttendanceBulk = async (meetingId, attendanceList) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get meeting concept and billing month
    const [meeting] = await connection.query(
      'SELECT concept_id, meeting_date FROM meetings WHERE meeting_id = ?',
      [meetingId]
    );

    if (meeting.length === 0) {
      throw new Error('Reunión no encontrada');
    }

    const { concept_id, meeting_date } = meeting[0];
    if (!concept_id) {
      throw new Error('La reunión no tiene un concepto de multa configurado');
    }

    const dateStr = typeof meeting_date === 'string' ? meeting_date : new Date(meeting_date).toISOString();
    const billingMonth = dateStr.substring(0, 7);

    for (const record of attendanceList) {
      const { user_id, attended, observations } = record;

      // Check if fine is already paid
      const [invoiceCheck] = await connection.query(`
        SELECT i.invoice_id, i.status 
        FROM invoices i
        JOIN invoice_concept ic ON i.invoice_id = ic.invoice_id
        WHERE ic.concept_id = ? AND i.user_id = ?
        LIMIT 1
      `, [concept_id, user_id]);

      if (invoiceCheck.length > 0 && invoiceCheck[0].status === 'paid') {
        // Skip updating attendance if the fine is already paid
        continue;
      }

      // Check if attendance record exists
      const [currentAttendance] = await connection.query(
        'SELECT attendance_id FROM attendance WHERE meeting_id = ? AND user_id = ?',
        [meetingId, user_id]
      );

      let attendanceId;
      if (currentAttendance.length > 0) {
        attendanceId = currentAttendance[0].attendance_id;
        await connection.query(
          'UPDATE attendance SET attended = ?, observations = ? WHERE attendance_id = ?',
          [attended, observations ?? null, attendanceId]
        );
      } else {
        const [insertResult] = await connection.query(
          'INSERT INTO attendance (meeting_id, user_id, attended, observations) VALUES (?, ?, ?, ?)',
          [meetingId, user_id, attended, observations ?? null]
        );
        attendanceId = insertResult.insertId;
      }

      // Manage fine concept mapping
      if (attended === 'no') {
        // Find or create invoice
        const [invoice] = await connection.query(
          'SELECT invoice_id FROM invoices WHERE user_id = ? AND billing_month = ? LIMIT 1',
          [user_id, billingMonth]
        );

        let invoiceId;
        if (invoice.length > 0) {
          invoiceId = invoice[0].invoice_id;
        } else {
          const [invoiceResult] = await connection.query(`
            INSERT INTO invoices (user_id, invoice_type, billing_month, description, total_amount, issue_date, status)
            VALUES (?, 'water', ?, 'Factura Mensual', 0.00, CURRENT_DATE, 'pending')
          `, [user_id, billingMonth]);
          invoiceId = invoiceResult.insertId;
        }

        // Link concept if not already linked
        const [link] = await connection.query(
          'SELECT id FROM invoice_concept WHERE invoice_id = ? AND concept_id = ?',
          [invoiceId, concept_id]
        );

        if (link.length === 0) {
          await connection.query(
            'INSERT INTO invoice_concept (invoice_id, concept_id) VALUES (?, ?)',
            [invoiceId, concept_id]
          );
        }

        // Recalculate invoice total
        await connection.query('CALL sp_update_invoice_total(?)', [invoiceId]);

      } else {
        // If attended = 'yes' or 'justified', unlink the concept if it exists
        const [invoice] = await connection.query(
          'SELECT invoice_id FROM invoices WHERE user_id = ? AND billing_month = ? LIMIT 1',
          [user_id, billingMonth]
        );

        if (invoice.length > 0) {
          const invoiceId = invoice[0].invoice_id;

          // Delete invoice concept link
          await connection.query(
            'DELETE FROM invoice_concept WHERE invoice_id = ? AND concept_id = ?',
            [invoiceId, concept_id]
          );

          // Recalculate invoice total
          await connection.query('CALL sp_update_invoice_total(?)', [invoiceId]);

          // Clean up the invoice if it has no readings and no other concepts
          const [readings] = await connection.query('SELECT COUNT(*) as count FROM readings WHERE invoice_id = ?', [invoiceId]);
          const [concepts] = await connection.query('SELECT COUNT(*) as count FROM invoice_concept WHERE invoice_id = ?', [invoiceId]);

          if (readings[0].count === 0 && concepts[0].count === 0) {
            await connection.query('DELETE FROM invoices WHERE invoice_id = ?', [invoiceId]);
          }
        }
      }
    }

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllAttendance,
  getAttendanceById,
  getAttendanceByMeetingId,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  updateAttendanceBulk,
};