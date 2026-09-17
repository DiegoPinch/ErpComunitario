-- Aplicar después de routines_only.sql. No modifica importes existentes.
DROP PROCEDURE IF EXISTS sp_update_invoice_total;
DELIMITER $$
CREATE PROCEDURE sp_update_invoice_total(IN p_invoice_id INT)
BEGIN
    DECLARE v_total DECIMAL(12,2) DEFAULT 0;
    DECLARE v_previous DECIMAL(12,2);
    DECLARE v_status VARCHAR(30);
    DECLARE v_month VARCHAR(7);
    DECLARE v_date DATE;
    SELECT total_amount,status,billing_month,issue_date
      INTO v_previous,v_status,v_month,v_date FROM invoices WHERE invoice_id=p_invoice_id FOR UPDATE;
    IF v_status IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Factura inexistente';
    END IF;
    SELECT COALESCE((SELECT SUM(amount) FROM readings WHERE invoice_id=p_invoice_id),0)
      + COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot,ac.amount)) FROM invoice_concept ic
        JOIN additional_concepts ac ON ac.concept_id=ic.concept_id WHERE ic.invoice_id=p_invoice_id),0)
      INTO v_total;
    IF v_total <> v_previous THEN
      IF v_status <> 'pending' OR EXISTS(SELECT 1 FROM payments WHERE invoice_id=p_invoice_id AND status='posted') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Factura protegida: anule todos los cobros antes de modificar su total';
      END IF;
      IF EXISTS(SELECT 1 FROM accounting_periods WHERE
          v_date BETWEEN DATE(start_date) AND DATE(end_date) OR
          (DATE(start_date)<=LAST_DAY(CONCAT(v_month,'-01')) AND DATE(end_date)>=CONCAT(v_month,'-01'))) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='No se puede recalcular una factura de un periodo cerrado';
      END IF;
      UPDATE invoices SET total_amount=v_total WHERE invoice_id=p_invoice_id;
    END IF;
END$$
DELIMITER ;
