const pool = require('../config/db');

// Each installment belongs either to its invoice or to the unbilled agreement.
async function getReceivables(cutoff, db = pool) {
    const [rows] = await db.query(`
      SELECT u.user_id, CONCAT_WS(' ',u.last_name,u.first_name) AS user_name,
        u.national_id, 'Factura' AS concept_type,
        CONCAT('Factura ',i.invoice_id,' / ',COALESCE(i.billing_month,'sin mes')) AS description,
        i.billing_month, i.invoice_id, NULL AS agreement_id,
        GREATEST(i.total_amount-COALESCE((SELECT SUM(p.invoice_amount) FROM payments p
          WHERE p.invoice_id=i.invoice_id AND p.status='posted' AND p.payment_date<=?),0),0) AS total_debt
      FROM invoices i JOIN users u ON u.user_id=i.user_id
      WHERE i.status<>'cancelled' AND i.issue_date<=?
      HAVING total_debt>0
      UNION ALL
      SELECT u.user_id,CONCAT_WS(' ',u.last_name,u.first_name),u.national_id,
        'Convenio sin facturar',pa.description,pa.start_month,NULL,pa.agreement_id,
        GREATEST(pa.total_amount
          -COALESCE((SELECT SUM(dp.amount_paid) FROM debt_payments dp
            WHERE dp.agreement_id=pa.agreement_id AND dp.status='posted' AND dp.payment_date<=?),0)
          -COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot,ac.amount))
            FROM invoice_concept ic JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
            JOIN invoices i ON i.invoice_id=ic.invoice_id
            WHERE ic.agreement_id=pa.agreement_id AND i.status<>'cancelled' AND i.issue_date<=?),0),0) AS total_debt
      FROM payment_agreements pa JOIN users u ON u.user_id=pa.user_id
      WHERE pa.status<>'cancelled' AND pa.created_at<=?
      HAVING total_debt>0
      ORDER BY user_name,user_id,billing_month,invoice_id`, [cutoff,cutoff,cutoff,cutoff,cutoff]);
    return rows;
}

module.exports = { getReceivables };
