const pool = require('../config/db');
const { money } = require('../utils/accountingRules');
const { lockFinancialLedger } = require('../utils/periodLock');

const validateConcept = concept => {
  const amount = money(concept.amount, 'Monto del rubro');
  if (amount <= 0) throw Object.assign(new Error('El monto del rubro debe ser mayor que cero'), { status: 400 });
  if (!String(concept.description || '').trim()) throw Object.assign(new Error('La descripción es obligatoria'), { status: 400 });
  if (!['all', 'user'].includes(concept.applies_to)) throw Object.assign(new Error('Ámbito de aplicación inválido'), { status: 400 });
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(concept.application_month || ''))) {
    throw Object.assign(new Error('El mes de aplicación debe tener formato YYYY-MM'), { status: 400 });
  }
  return amount;
};

const getAllConcepts = async () => {
  const [rows] = await pool.query("SELECT * FROM additional_concepts WHERE concept_type = 'standard' ORDER BY concept_id DESC");
  return rows;
};

const getConceptById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM additional_concepts WHERE concept_id = ?', [id]);
  return rows[0];
};

const createConcept = async (concept) => {
  const { description, amount, applies_to, application_month } = concept;
  const normalizedAmount = validateConcept(concept);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    const [result] = await connection.query(
      `INSERT INTO additional_concepts (description, amount, applies_to, application_month)
       VALUES (?, ?, ?, ?)`,
      [String(description).trim(), normalizedAmount, applies_to, application_month]
    );
    if (applies_to === 'all') await connection.query('CALL sp_apply_global_concept(?)', [result.insertId]);
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateConcept = async (id, concept) => {
  const { description, amount, applies_to, application_month } = concept;
  const normalizedAmount = validateConcept(concept);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    const [current] = await connection.query('SELECT * FROM additional_concepts WHERE concept_id=? FOR UPDATE', [id]);
    if (!current.length) {
      await connection.commit();
      return 0;
    }
    if (current[0].concept_type === 'installment') {
      throw Object.assign(new Error('Las cuotas se administran desde el convenio y no pueden editarse como rubros'), { status: 409 });
    }
    if (current[0].concept_type === 'fine') throw Object.assign(new Error('Las multas se corrigen desde la asistencia, con historial'), {status:409});
    const scopeChanged = current[0].applies_to !== applies_to || current[0].application_month !== application_month;
    if (scopeChanged) {
      const [links] = await connection.query('SELECT COUNT(*) AS count FROM invoice_concept WHERE concept_id=?', [id]);
      if (Number(links[0].count) > 0) {
        throw Object.assign(new Error('No se puede cambiar mes o alcance porque el rubro ya está asignado'), { status: 409 });
      }
    }
    const [result] = await connection.query(
      `UPDATE additional_concepts SET description=?, amount=?, applies_to=?, application_month=?
       WHERE concept_id=?`,
      [String(description).trim(), normalizedAmount, applies_to, application_month, id]
    );
    if (Number(current[0].amount) !== normalizedAmount || current[0].description !== String(description).trim()) {
      await connection.query(`
        UPDATE invoice_concept ic JOIN invoices i ON i.invoice_id=ic.invoice_id
        SET ic.description_snapshot=?, ic.amount_snapshot=?
        WHERE ic.concept_id=? AND i.status='pending'`,
        [String(description).trim(), normalizedAmount, id]
      );
      await connection.query('CALL sp_recalculate_concept_impact(?)', [id]);
    }
    if (scopeChanged && applies_to === 'all') await connection.query('CALL sp_apply_global_concept(?)', [id]);
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteConcept = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    const [conceptRows] = await connection.query('SELECT concept_id, concept_type FROM additional_concepts WHERE concept_id=? FOR UPDATE', [id]);
    if (!conceptRows.length) {
      await connection.commit();
      return 0;
    }
    if (conceptRows[0].concept_type === 'installment') {
      throw Object.assign(new Error('Las cuotas deben corregirse desde el convenio, no eliminando el rubro'), { status: 409 });
    }
    if (conceptRows[0].concept_type === 'fine') throw Object.assign(new Error('Las multas se corrigen desde la asistencia, con historial'), {status:409});
    const [paidLinks] = await connection.query(`
      SELECT COUNT(*) AS count FROM invoice_concept ic
      JOIN invoices i ON ic.invoice_id=i.invoice_id
      WHERE ic.concept_id=? AND i.status='paid'`, [id]);
    if (Number(paidLinks[0].count) > 0) {
      throw Object.assign(new Error('No se puede eliminar: este rubro forma parte de facturas cobradas.'), { status: 409 });
    }
    const [affectedInvoices] = await connection.query('SELECT invoice_id FROM invoice_concept WHERE concept_id=? FOR UPDATE', [id]);
    await connection.query('DELETE FROM invoice_concept WHERE concept_id=?', [id]);
    const [result] = await connection.query('DELETE FROM additional_concepts WHERE concept_id=?', [id]);
    for (const invoice of affectedInvoices) await connection.query('CALL sp_update_invoice_total(?)', [invoice.invoice_id]);
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAssignedUsers = async (conceptId) => {
  const [rows] = await pool.query(`
    SELECT 
      ic.id as invoice_concept_id,
      i.invoice_id,
      u.user_id,
      CONCAT(u.last_name, ' ', u.first_name) as user_name,
      u.national_id,
      i.billing_month,
      i.status as invoice_status,
      ac.amount
    FROM invoice_concept ic
    JOIN invoices i ON ic.invoice_id = i.invoice_id
    JOIN users u ON i.user_id = u.user_id
    JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
    WHERE ic.concept_id = ?
    ORDER BY u.last_name ASC, u.first_name ASC, i.billing_month DESC
  `, [conceptId]);
  return rows;
};

module.exports = {
  getAllConcepts,
  getConceptById,
  createConcept,
  updateConcept,
  deleteConcept,
  getAssignedUsers,
};
