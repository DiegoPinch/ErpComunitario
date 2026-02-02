const pool = require('../config/db');

const getAllConcepts = async () => {
  const [rows] = await pool.query('SELECT * FROM additional_concepts');
  return rows;
};

const getConceptById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM additional_concepts WHERE concept_id = ?', [id]);
  return rows[0];
};

const createConcept = async (concept) => {
  const { description, amount, applies_to, application_month } = concept;
  const [result] = await pool.query(
    `INSERT INTO additional_concepts (description, amount, applies_to, application_month)
     VALUES (?, ?, ?, ?)`,
    [description, amount ?? 0, applies_to ?? 'all', application_month ?? null]
  );

  const conceptId = result.insertId;

  // If it's a global concept, apply it to all pending invoices of that month
  if (applies_to === 'all' && application_month) {
    await pool.query('CALL sp_apply_global_concept(?)', [conceptId]);
  }

  return conceptId;
};

const updateConcept = async (id, concept) => {
  const { description, amount, applies_to, application_month } = concept;

  // 1. Get current amount to see if it changed
  const [current] = await pool.query('SELECT amount FROM additional_concepts WHERE concept_id = ?', [id]);
  const oldAmount = current[0]?.amount;

  // 2. Update the concept record
  const [result] = await pool.query(
    `UPDATE additional_concepts 
     SET description = ?, amount = ?, applies_to = ?, application_month = ?
     WHERE concept_id = ?`,
    [description, amount, applies_to, application_month, id]
  );

  // 3. If price changed, recalculate all PENDING invoices that use this concept
  if (oldAmount !== undefined && parseFloat(oldAmount) !== parseFloat(amount)) {
    await pool.query('CALL sp_recalculate_concept_impact(?)', [id]);
  }

  return result.affectedRows;
};

const deleteConcept = async (id) => {
  // 1. SHIELD: Check if any linked invoice is already paid
  const [paidLinks] = await pool.query(`
    SELECT COUNT(*) as count 
    FROM invoice_concept ic
    JOIN invoices i ON ic.invoice_id = i.invoice_id
    WHERE ic.concept_id = ? AND i.status = 'paid'
  `, [id]);

  if (paidLinks[0].count > 0) {
    throw new Error('No se puede eliminar: Este rubro ya forma parte de facturas cobradas.');
  }

  // 2. Identify all affected invoices before deleting links
  const [affectedInvoices] = await pool.query(
    'SELECT invoice_id FROM invoice_concept WHERE concept_id = ?',
    [id]
  );

  // 3. Delete links first (child) then concept (parent)
  await pool.query('DELETE FROM invoice_concept WHERE concept_id = ?', [id]);
  const [result] = await pool.query('DELETE FROM additional_concepts WHERE concept_id = ?', [id]);

  // 4. Recalculate each affected invoice
  if (affectedInvoices.length > 0) {
    for (const inv of affectedInvoices) {
      await pool.query('CALL sp_update_invoice_total(?)', [inv.invoice_id]);
    }
  }

  return result.affectedRows;
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