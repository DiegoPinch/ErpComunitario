-- YakuGest / ERPAGUA - Reconciliación de solo lectura DESPUÉS de migrar.
-- Las consultas marcadas como inconsistencias deben devolver cero filas.

-- 1. Factura pagada sin pago activo, o pendiente con pago activo.
SELECT i.invoice_id, i.user_id, i.billing_month, i.status,
       COUNT(p.payment_id) AS active_payments
FROM invoices i
LEFT JOIN payments p ON p.invoice_id=i.invoice_id AND p.status='posted'
GROUP BY i.invoice_id, i.user_id, i.billing_month, i.status
HAVING (i.status='paid' AND COUNT(p.payment_id)=0)
    OR (i.status='pending' AND COUNT(p.payment_id)>0);

-- 2. Asignación cobrada distinta del total inmutable de la factura.
SELECT p.payment_id, p.invoice_id, p.invoice_amount, i.total_amount,
       ROUND(p.invoice_amount-i.total_amount,2) AS difference
FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
WHERE p.status='posted' AND ABS(p.invoice_amount-i.total_amount)>0.009;

-- 3. Cabecera de cobranza que no cuadra con sus asignaciones originales.
SELECT pc.collection_id, pc.total_due,
       COALESCE((SELECT SUM(p.invoice_amount) FROM payments p
                 WHERE p.collection_id=pc.collection_id),0) +
       COALESCE((SELECT SUM(dp.amount_paid) FROM debt_payments dp
                 WHERE dp.collection_id=pc.collection_id),0) AS allocated,
       pc.net_received, pc.amount_tendered, pc.change_amount
FROM payment_collections pc
HAVING ABS(total_due-allocated)>0.009
    OR ABS(net_received-total_due)>0.009
    OR ABS(amount_tendered-total_due-change_amount)>0.009;

-- 4. Total de factura distinto de lectura + conceptos congelados.
SELECT i.invoice_id, i.total_amount,
       COALESCE((SELECT SUM(r.amount) FROM readings r WHERE r.invoice_id=i.invoice_id),0) +
       COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot,ac.amount))
                 FROM invoice_concept ic JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
                 WHERE ic.invoice_id=i.invoice_id),0) AS calculated_total
FROM invoices i
HAVING ABS(total_amount-calculated_total)>0.009;

-- 5. Saldos de cuentas bancarias, calculados desde el libro de movimientos.
SELECT b.account_id, b.bank_name, b.account_number, b.initial_balance,
       ROUND(b.initial_balance
         + COALESCE((SELECT SUM(p.invoice_amount) FROM payments p
                     WHERE p.account_id=b.account_id AND p.status='posted'),0)
         + COALESCE((SELECT SUM(dp.amount_paid) FROM debt_payments dp
                     WHERE dp.account_id=b.account_id AND dp.status='posted'),0)
         + COALESCE((SELECT SUM(oi.amount) FROM other_incomes oi
                     WHERE oi.account_id=b.account_id AND oi.status='posted'),0)
         - COALESCE((SELECT SUM(e.amount) FROM expenses e
                     WHERE e.account_id=b.account_id AND e.payment_method!='cash' AND e.status='posted'),0)
         + COALESCE((SELECT SUM(e.amount) FROM expenses e
                     WHERE e.account_id=b.account_id AND e.payment_method='cash' AND e.status='posted'),0),2)
         AS calculated_balance
FROM bank_accounts b;

-- 6. Períodos solapados (debe devolver cero filas).
SELECT ap1.period_id AS period_a, ap2.period_id AS period_b,
       ap1.start_date AS start_a, ap1.end_date AS end_a,
       ap2.start_date AS start_b, ap2.end_date AS end_b
FROM accounting_periods ap1
JOIN accounting_periods ap2 ON ap1.period_id < ap2.period_id
 AND ap1.start_date <= ap2.end_date
 AND ap1.end_date >= ap2.start_date;

-- 7. Verificación de snapshots de cierres creados por la versión nueva.
SELECT period_id, title, integrity_hash, SHA2(snapshot_json,256) AS calculated_hash,
       integrity_hash=SHA2(snapshot_json,256) AS hash_ok
FROM accounting_periods
WHERE snapshot_json IS NOT NULL;

-- 8. Resumen general que debe coincidir con Estado de Caja.
SELECT
  ROUND(
    (SELECT COALESCE(SUM(initial_balance),0) FROM bank_accounts) +
    (SELECT COALESCE(SUM(invoice_amount),0) FROM payments WHERE status='posted') +
    (SELECT COALESCE(SUM(amount_paid),0) FROM debt_payments WHERE status='posted') +
    (SELECT COALESCE(SUM(amount),0) FROM other_incomes WHERE status='posted') -
    (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE status='posted'
       AND (account_id IS NULL OR LOWER(payment_method)!='cash')), 2
  ) AS global_balance;
