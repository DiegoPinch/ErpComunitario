const pool = require('../config/db');

const getAllInvoiceConcepts = async () => {
  const [rows] = await pool.query('SELECT * FROM invoice_concept');
  return rows;
};

const getInvoiceConceptById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM invoice_concept WHERE id = ?', [id]);
  return rows[0];
};

const createInvoiceConcept = async (ic) => {
  const { invoice_id, concept_id } = ic;

  // SHIELD: Check if invoice is already paid
  const [inv] = await pool.query('SELECT status FROM invoices WHERE invoice_id = ?', [invoice_id]);
  if (inv[0]?.status === 'paid') {
    throw new Error('No se puede asignar rubros a una factura ya cobrada.');
  }

  const [result] = await pool.query(
    `INSERT INTO invoice_concept (invoice_id, concept_id) VALUES (?, ?)`,
    [invoice_id, concept_id]
  );


  // Update invoice total
  await pool.query('CALL sp_update_invoice_total(?)', [invoice_id]);

  return result.insertId;
};

const updateInvoiceConcept = async (id, ic) => {
  const { invoice_id, concept_id } = ic;
  const [result] = await pool.query(
    `UPDATE invoice_concept SET invoice_id=?, concept_id=? WHERE id=?`,
    [invoice_id, concept_id, id]
  );
  return result.affectedRows;
};

const deleteInvoiceConcept = async (id) => {
  // First get the invoice_id and its status
  const [rows] = await pool.query(`
    SELECT ic.invoice_id, i.status 
    FROM invoice_concept ic
    JOIN invoices i ON ic.invoice_id = i.invoice_id
    WHERE ic.id = ?
  `, [id]);

  if (rows.length === 0) return 0;

  const { invoice_id, status } = rows[0];

  // SHIELD: Prevent unlinking if paid
  if (status === 'paid') {
    throw new Error('No se puede eliminar un rubro de una factura ya cobrada.');
  }

  const [result] = await pool.query('DELETE FROM invoice_concept WHERE id=?', [id]);

  if (result.affectedRows > 0) {
    await pool.query('CALL sp_update_invoice_total(?)', [invoice_id]);
  }

  return result.affectedRows;
};

module.exports = {
  getAllInvoiceConcepts,
  getInvoiceConceptById,
  createInvoiceConcept,
  updateInvoiceConcept,
  deleteInvoiceConcept,
};