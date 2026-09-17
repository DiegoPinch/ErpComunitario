require('dotenv').config();

const pool = require('../src/config/db');

const month = process.argv[2] || '2026-08';
const start = `${month}-01 00:00:00`;

async function main() {
  const [rows] = await pool.query(`
    SELECT p.payment_id, p.payment_date, p.payment_method,
           p.invoice_amount, p.amount_paid, p.change_amount,
           i.invoice_id, i.billing_month, i.invoice_type, i.total_amount,
           CONCAT_WS(' ', u.first_name, u.last_name) AS client,
           COALESCE((SELECT SUM(r.amount) FROM readings r WHERE r.invoice_id=i.invoice_id),0) AS water,
           COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount))
                     FROM invoice_concept ic JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
                     WHERE ic.invoice_id=i.invoice_id AND COALESCE(ic.concept_type_snapshot,ac.concept_type)='fine'),0) AS fines,
           COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount))
                     FROM invoice_concept ic JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
                     WHERE ic.invoice_id=i.invoice_id AND COALESCE(ic.concept_type_snapshot,ac.concept_type)<>'fine'),0) AS additional
    FROM payments p
    JOIN invoices i ON i.invoice_id=p.invoice_id
    JOIN users u ON u.user_id=i.user_id
    WHERE p.status='posted'
      AND p.payment_date >= ?
      AND p.payment_date < DATE_ADD(?, INTERVAL 1 MONTH)
    ORDER BY p.payment_date, p.payment_id
  `, [start, start]);

  const normalized = rows.map(row => {
    const paid = Number(row.invoice_amount || 0);
    const invoice = Number(row.total_amount || 0);
    const components = Number(row.water || 0) + Number(row.fines || 0) + Number(row.additional || 0);
    const ratio = invoice ? paid / invoice : 1;
    return {
      pago: row.payment_id,
      factura: row.invoice_id,
      cliente: row.client,
      fecha_pago: row.payment_date,
      mes_factura: row.billing_month,
      cobrado: paid.toFixed(2),
      total_factura: invoice.toFixed(2),
      componentes_brutos: components.toFixed(2),
      componentes_prorrateados: (components * ratio).toFixed(2),
      diferencia_factura_pago: (invoice - paid).toFixed(2),
      diferencia_componentes_pago: (components * ratio - paid).toFixed(2)
    };
  });

  console.table(normalized);
  console.table([{
    mes: month,
    pagos_por_fecha: normalized.reduce((sum, row) => sum + Number(row.cobrado), 0).toFixed(2),
    facturas_de_esos_pagos: normalized.reduce((sum, row) => sum + Number(row.total_factura), 0).toFixed(2),
    desglose_prorrateado: normalized.reduce((sum, row) => sum + Number(row.componentes_prorrateados), 0).toFixed(2)
  }]);

  const [emission] = await pool.query(`
    SELECT COALESCE(SUM(i.total_amount),0) AS report_total,
           COALESCE(SUM(p.invoice_amount),0) AS actually_collected,
           COUNT(*) AS payments
    FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
    WHERE p.status='posted' AND i.billing_month=?
  `, [month]);
  console.log('Reporte por mes de emisión:', emission[0]);

  const [byPaymentDay] = await pool.query(`
    SELECT DATE(p.payment_date) AS payment_day, COUNT(*) AS payments,
           SUM(p.invoice_amount) AS collected,
           SUM(CASE WHEN i.billing_month=? THEN p.invoice_amount ELSE 0 END) AS from_selected_billing_month
    FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
    WHERE p.status='posted' AND (i.billing_month=? OR DATE_FORMAT(p.payment_date,'%Y-%m')=?)
    GROUP BY DATE(p.payment_date) ORDER BY payment_day
  `, [month, month, month]);
  console.table(byPaymentDay);

  const [components] = await pool.query(`
    SELECT DATE(p.payment_date) AS payment_day,
      SUM(COALESCE((SELECT SUM(r.amount) FROM readings r WHERE r.invoice_id=i.invoice_id),0)
          * COALESCE(p.invoice_amount/NULLIF(i.total_amount,0),1)) AS water,
      SUM(COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot,ac.amount)) FROM invoice_concept ic
          JOIN additional_concepts ac ON ac.concept_id=ic.concept_id WHERE ic.invoice_id=i.invoice_id
          AND COALESCE(ic.concept_type_snapshot,ac.concept_type)='fine'),0)
          * COALESCE(p.invoice_amount/NULLIF(i.total_amount,0),1)) AS fines,
      SUM(COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot,ac.amount)) FROM invoice_concept ic
          JOIN additional_concepts ac ON ac.concept_id=ic.concept_id WHERE ic.invoice_id=i.invoice_id
          AND COALESCE(ic.concept_type_snapshot,ac.concept_type)<>'fine'),0)
          * COALESCE(p.invoice_amount/NULLIF(i.total_amount,0),1)) AS additional,
      SUM(p.invoice_amount) AS collected
    FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
    WHERE p.status='posted' AND DATE_FORMAT(p.payment_date,'%Y-%m')=?
    GROUP BY DATE(p.payment_date) ORDER BY payment_day
  `, [month]);
  console.table(components);

  const [methods] = await pool.query(`
    SELECT DATE(p.payment_date) AS payment_day, p.payment_method, p.account_id,
           COUNT(*) AS payments, SUM(p.invoice_amount) AS collected
    FROM payments p
    WHERE p.status='posted' AND DATE_FORMAT(p.payment_date,'%Y-%m')=?
    GROUP BY DATE(p.payment_date), p.payment_method, p.account_id
    ORDER BY payment_day, p.payment_method, p.account_id
  `, [month]);
  console.table(methods);

  const [origin] = await pool.query(`
    SELECT DATE(p.payment_date) AS payment_day, i.billing_month,
           COUNT(*) AS payments, SUM(p.invoice_amount) AS collected,
           MIN(p.payment_date) AS first_record, MAX(p.payment_date) AS last_record,
           COUNT(DISTINCT p.collection_id) AS collections
    FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
    WHERE p.status='posted' AND DATE_FORMAT(p.payment_date,'%Y-%m')=?
    GROUP BY DATE(p.payment_date), i.billing_month
    ORDER BY payment_day, i.billing_month
  `, [month]);
  console.table(origin);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());
