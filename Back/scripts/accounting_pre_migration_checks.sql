-- YakuGest / ERPAGUA - Controles de solo lectura ANTES de migrar.
-- Cada consulta de duplicados/inconsistencias debe revisarse antes de continuar.

SELECT VERSION() AS mysql_version, DATABASE() AS selected_database;

SELECT meter_id, month_year, COUNT(*) AS duplicates
FROM readings
GROUP BY meter_id, month_year
HAVING COUNT(*) > 1;

SELECT user_id, billing_month, COUNT(*) AS duplicates,
       GROUP_CONCAT(invoice_id ORDER BY invoice_id) AS invoice_ids
FROM invoices
WHERE invoice_type='water'
GROUP BY user_id, billing_month
HAVING COUNT(*) > 1;

SELECT invoice_id, COUNT(*) AS payment_rows,
       SUM(invoice_amount) AS allocated_total, MAX(amount_paid) AS tendered_max
FROM payments
GROUP BY invoice_id
HAVING COUNT(*) > 1;

SELECT i.invoice_id, i.status, i.total_amount,
       COALESCE(SUM(p.invoice_amount),0) AS paid_allocations
FROM invoices i
LEFT JOIN payments p ON p.invoice_id=i.invoice_id
GROUP BY i.invoice_id, i.status, i.total_amount
HAVING (i.status='paid' AND COUNT(p.payment_id)=0)
    OR (i.status='pending' AND COUNT(p.payment_id)>0)
    OR (COUNT(p.payment_id)>0 AND ABS(i.total_amount-SUM(p.invoice_amount))>0.009);

SELECT ap1.period_id AS period_a, ap2.period_id AS period_b,
       ap1.start_date AS start_a, ap1.end_date AS end_a,
       ap2.start_date AS start_b, ap2.end_date AS end_b
FROM accounting_periods ap1
JOIN accounting_periods ap2 ON ap1.period_id < ap2.period_id
 AND ap1.start_date <= ap2.end_date
 AND ap1.end_date >= ap2.start_date;

SELECT 'payments_without_invoice' AS check_name, COUNT(*) AS total
FROM payments p LEFT JOIN invoices i ON i.invoice_id=p.invoice_id
WHERE i.invoice_id IS NULL
UNION ALL
SELECT 'debt_payments_without_agreement', COUNT(*)
FROM debt_payments dp LEFT JOIN payment_agreements pa ON pa.agreement_id=dp.agreement_id
WHERE pa.agreement_id IS NULL;
