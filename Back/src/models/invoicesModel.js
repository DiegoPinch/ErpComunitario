const pool = require('../config/db');
const { money } = require('../utils/accountingRules');
const { assertAccountingDateOpen, lockFinancialLedger } = require('../utils/periodLock');

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
      COALESCE(ic.description_snapshot, ac.description) AS description,
      COALESCE(ic.amount_snapshot, ac.amount) AS amount,
      COALESCE(ic.concept_type_snapshot, ac.concept_type) AS concept_type
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

const createInvoice = async (invoiceData) => {
  const { user_id, invoice_type, billing_month, description, total_amount, issue_date } = invoiceData;
  const invoiceType = invoice_type || 'water';
  if (!['water', 'legacy_debt', 'installation', 'other'].includes(invoiceType)) {
    throw Object.assign(new Error('Tipo de factura inválido'), { status: 400 });
  }
  if (billing_month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(String(billing_month))) {
    throw Object.assign(new Error('El período debe tener formato YYYY-MM'), { status: 400 });
  }
  const total = money(total_amount, 'Total de la factura');
  if (total <= 0) throw Object.assign(new Error('El total debe ser mayor que cero'), { status: 400 });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    await assertAccountingDateOpen(connection, issue_date || new Date());
    if (invoiceType === 'water') {
      const [existing] = await connection.query(
        "SELECT invoice_id FROM invoices WHERE user_id=? AND billing_month=? AND invoice_type='water' LIMIT 1 FOR UPDATE",
        [Number(user_id), billing_month]
      );
      if (existing.length) throw Object.assign(new Error('Ya existe una factura de agua para el usuario y período'), { status: 409 });
    }
    const [result] = await connection.query(
      `INSERT INTO invoices (user_id, invoice_type, billing_month, description, total_amount, issue_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [user_id, invoiceType, billing_month || null, description || null, total, issue_date || new Date()]
    );
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getPendingUsersSummary,
  getInvoicesByUserId,
  getInvoiceDetails,
  createInvoice,
};
