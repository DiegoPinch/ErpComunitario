const pool = require('../config/db');
const { lockFinancialLedger } = require('../utils/periodLock');

const createInvoiceConcept = async (ic) => {
  let { invoice_id, concept_id, user_id, billing_month } = ic;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);

    // 1. Get the concept details
    const [conceptRows] = await connection.query(
      'SELECT applies_to, application_month, description, amount, concept_type FROM additional_concepts WHERE concept_id = ?',
      [concept_id]
    );
    if (conceptRows.length === 0) {
      throw new Error('Concepto no encontrado.');
    }
    if (conceptRows[0].concept_type === 'fine') throw Object.assign(new Error('Registre las multas desde la asistencia'), {status:409});

    // 2. If user_id and billing_month are provided instead of invoice_id (used when assigning directly to user)
    if (!invoice_id && user_id && billing_month) {
      // Shield: Check if user is exempt from contributions and fines
      const [userRows] = await connection.query(
        'SELECT exempt_from_fines FROM users WHERE user_id = ?',
        [user_id]
      );
      
      if (userRows.length > 0 && userRows[0].exempt_from_fines) {
        throw new Error('No se pueden asignar rubros o aportes a un usuario exento (escuelas, iglesias, etc.).');
      }

      // Check if pending invoice already exists for that user and month
      const [invoiceRows] = await connection.query(
        'SELECT invoice_id, status FROM invoices WHERE user_id = ? AND billing_month = ? LIMIT 1',
        [user_id, billing_month]
      );

      if (invoiceRows.length > 0) {
        if (invoiceRows[0].status === 'paid') {
          throw new Error('No se puede asignar rubros a una factura ya cobrada.');
        }
        invoice_id = invoiceRows[0].invoice_id;
      } else {
        // Create pending invoice shell ($0)
        const [invoiceResult] = await connection.query(`
          INSERT INTO invoices (user_id, invoice_type, billing_month, description, total_amount, issue_date, status)
          VALUES (?, 'water', ?, 'Factura Mensual', 0.00, CURRENT_DATE, 'pending')
        `, [user_id, billing_month]);
        
        invoice_id = invoiceResult.insertId;

        // Auto-link any other global concepts for that month (excluding exempt users)
        await connection.query(`
          INSERT IGNORE INTO invoice_concept
            (invoice_id, concept_id, description_snapshot, amount_snapshot, concept_type_snapshot)
          SELECT ?, ac.concept_id, ac.description, ac.amount, ac.concept_type
          FROM additional_concepts ac
          JOIN users u ON u.user_id = ?
          WHERE ac.application_month = ? 
            AND ac.applies_to = 'all'
            AND u.exempt_from_fines = FALSE
            AND ac.concept_id != ?
        `, [invoice_id, user_id, billing_month, concept_id]);
      }
    }

    // 3. Double check the invoice status if we have the ID
    if (invoice_id) {
      const [inv] = await connection.query('SELECT status FROM invoices WHERE invoice_id = ?', [invoice_id]);
      if (inv.length === 0) {
        throw new Error('Factura no encontrada.');
      }
      if (inv[0]?.status === 'paid') {
        throw new Error('No se puede asignar rubros a una factura ya cobrada.');
      }
    } else {
      throw new Error('Factura no identificada.');
    }

    // 4. Link the concept (IGNORE to prevent duplicate links)
    const [result] = await connection.query(
      `INSERT IGNORE INTO invoice_concept
       (invoice_id, concept_id, description_snapshot, amount_snapshot, concept_type_snapshot)
       VALUES (?, ?, ?, ?, ?)`,
      [invoice_id, concept_id, conceptRows[0].description, conceptRows[0].amount, conceptRows[0].concept_type]
    );

    // 5. Update invoice total
    await connection.query('CALL sp_update_invoice_total(?)', [invoice_id]);

    await connection.commit();
    return result.insertId || invoice_id; // Return insert ID or invoice ID
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const deleteInvoiceConcept = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    const [rows] = await connection.query(`
      SELECT ic.invoice_id, ic.concept_id, i.status
      FROM invoice_concept ic JOIN invoices i ON ic.invoice_id=i.invoice_id
      WHERE ic.id=? FOR UPDATE`, [id]);
    if (!rows.length) {
      await connection.commit();
      return 0;
    }
    const [concepts] = await connection.query('SELECT concept_type FROM additional_concepts WHERE concept_id=?',[rows[0].concept_id]);
    if (concepts[0]?.concept_type === 'fine') throw Object.assign(new Error('Corrija la multa desde la asistencia'), {status:409});
    if (rows[0].status === 'paid') throw Object.assign(new Error('No se puede eliminar un rubro de una factura ya cobrada.'), { status: 409 });
    const [result] = await connection.query('DELETE FROM invoice_concept WHERE id=?', [id]);
    await connection.query('CALL sp_update_invoice_total(?)', [rows[0].invoice_id]);
    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createInvoiceConcept,
  deleteInvoiceConcept,
};
