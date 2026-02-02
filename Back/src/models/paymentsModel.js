const pool = require('../config/db');

const collectPayments = async (invoiceIds, amountPaid, changeAmount) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let totalInvoicesAmount = 0;
    const invoiceDetails = [];

    for (const id of invoiceIds) {
      const [rows] = await connection.query('SELECT total_amount FROM invoices WHERE invoice_id = ?', [id]);
      if (rows.length > 0) {
        totalInvoicesAmount += parseFloat(rows[0].total_amount);
        invoiceDetails.push({ id, amount: parseFloat(rows[0].total_amount) });
      }
    }

    for (let i = 0; i < invoiceDetails.length; i++) {
      const item = invoiceDetails[i];

      await connection.query('UPDATE invoices SET status = "paid" WHERE invoice_id = ?', [item.id]);

      const isLast = (i === invoiceDetails.length - 1);
      const currentChange = isLast ? changeAmount : 0;

      await connection.query(
        `INSERT INTO payments (invoice_id, payment_date, invoice_amount, amount_paid, change_amount, movement_type, payment_method)
             VALUES (?, NOW(), ?, ?, ?, "payment", "cash")`,
        [item.id, item.amount, isLast ? (amountPaid - (totalInvoicesAmount - item.amount)) : item.amount, currentChange]
      );
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

const getPaymentReceiptData = async (invoiceIds) => {
  const query = `
    SELECT 
      i.invoice_id,
      i.billing_month,
      i.total_amount as invoice_amount,
      p.payment_date,
      p.amount_paid,
      p.change_amount,
      u.first_name,
      u.last_name,
      u.national_id,
      m.code as meter_code,
      m.type as meter_type,
      r.previous_reading,
      r.current_reading,
      r.consumption,
      r.amount as reading_amount,
      ec.extra_concepts
    FROM invoices i
    INNER JOIN payments p ON i.invoice_id = p.invoice_id
    INNER JOIN users u ON i.user_id = u.user_id
    LEFT JOIN (
        SELECT invoice_id, GROUP_CONCAT(CONCAT(ac.description, ': $', ac.amount) SEPARATOR ' | ') as extra_concepts
        FROM invoice_concept ic
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        GROUP BY invoice_id
    ) ec ON i.invoice_id = ec.invoice_id
    LEFT JOIN readings r ON i.invoice_id = r.invoice_id
    LEFT JOIN meters m ON r.meter_id = m.meter_id
    WHERE i.invoice_id IN (?)
    ORDER BY i.billing_month ASC;
  `;
  const [rows] = await pool.query(query, [invoiceIds]);
  return rows;
};

const voidPayment = async (invoiceId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update invoice status to pending
    await connection.query('UPDATE invoices SET status = "pending" WHERE invoice_id = ?', [invoiceId]);

    // 2. Delete payment record
    await connection.query('DELETE FROM payments WHERE invoice_id = ?', [invoiceId]);

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
  collectPayments,
  getPaymentReceiptData,
  voidPayment
};