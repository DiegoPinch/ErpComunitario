const pool = require('../config/db');

const getPendingUsersSummary = async () => {
  const query = `
    SELECT 
      u.user_id, 
      CONCAT(u.last_name, ' ', u.first_name) as user_name, 
      u.national_id,
      COALESCE(inv.pending_count, 0) as pending_count,
      COALESCE(inv.total_debt, 0) as total_debt
    FROM users u
    LEFT JOIN (
      SELECT user_id FROM meter_history WHERE assigned = 1 GROUP BY user_id
    ) mh ON u.user_id = mh.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(invoice_id) as pending_count,
        SUM(total_amount) as total_debt
      FROM invoices 
      WHERE status = 'pending'
      GROUP BY user_id
    ) inv ON u.user_id = inv.user_id
    WHERE mh.user_id IS NOT NULL OR inv.pending_count > 0
    ORDER BY (u.national_id REGEXP "^[A-Za-z]") ASC, u.last_name, u.first_name;
  `;
  const [rows] = await pool.query(query);
  return rows;
};

const getInvoicesByUserId = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM invoices WHERE user_id = ? ORDER BY billing_month DESC',
    [userId]
  );
  return rows;
};

const getInvoiceDetails = async (invoiceId) => {
  // 1. Get readings
  const readingQuery = `
    SELECT 
      m.code as meter_code, 
      m.type as meter_type, 
      r.previous_reading,
      r.current_reading,
      r.consumption, 
      r.amount
    FROM readings r
    INNER JOIN meters m ON r.meter_id = m.meter_id
    WHERE r.invoice_id = ?;
  `;
  const [readings] = await pool.query(readingQuery, [invoiceId]);

  // 2. Get additional concepts
  const conceptQuery = `
    SELECT 
      ac.description,
      ac.amount
    FROM invoice_concept ic
    INNER JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
    WHERE ic.invoice_id = ?;
  `;
  const [concepts] = await pool.query(conceptQuery, [invoiceId]);

  return {
    readings,
    concepts
  };
};

module.exports = {
  getPendingUsersSummary,
  getInvoicesByUserId,
  getInvoiceDetails,
};