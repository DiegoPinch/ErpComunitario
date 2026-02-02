-- =========================================
-- TABLE: ADDITIONAL_CONCEPTS
-- =========================================
CREATE TABLE IF NOT EXISTS additional_concepts (
    concept_id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(2000) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    applies_to ENUM('all', 'user') NOT NULL,
    application_month VARCHAR(100) NOT NULL
);

-- =========================================
-- TABLE: INVOICE_CONCEPT
-- =========================================
CREATE TABLE IF NOT EXISTS invoice_concept (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    concept_id INT NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (concept_id) REFERENCES additional_concepts(concept_id),
    UNIQUE (invoice_id, concept_id)
);

DELIMITER //

-- =========================================
-- PROCEDURE: sp_update_invoice_total
-- Re-calculates and updates the total amount of an invoice
-- =========================================
CREATE PROCEDURE sp_update_invoice_total(IN p_invoice_id INT)
BEGIN
    DECLARE v_reading_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_concepts_amount DECIMAL(10,2) DEFAULT 0;
    
    -- 1. Get total from readings
    SELECT COALESCE(SUM(amount), 0) INTO v_reading_amount 
    FROM readings 
    WHERE invoice_id = p_invoice_id;
    
    -- 2. Get total from additional concepts
    SELECT COALESCE(SUM(ac.amount), 0) INTO v_concepts_amount
    FROM invoice_concept ic
    JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
    WHERE ic.invoice_id = p_invoice_id;
    
    -- 3. Update the invoice
    UPDATE invoices 
    SET total_amount = v_reading_amount + v_concepts_amount
    WHERE invoice_id = p_invoice_id;
END //

-- =========================================
-- PROCEDURE: sp_apply_global_concept
-- Applies a concept ONLY to pending invoices of its month
-- =========================================
CREATE PROCEDURE sp_apply_global_concept(IN p_concept_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_inv_id INT;
    
    DECLARE cur CURSOR FOR 
        SELECT i.invoice_id 
        FROM invoices i
        JOIN additional_concepts ac ON i.billing_month = ac.application_month
        WHERE ac.concept_id = p_concept_id 
          AND i.status = 'pending'; -- EXTRA SHIELD: ONLY PENDING
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_inv_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Insert link
        INSERT IGNORE INTO invoice_concept (invoice_id, concept_id)
        VALUES (v_inv_id, p_concept_id);
        
        -- Update total
        CALL sp_update_invoice_total(v_inv_id);
    END LOOP;
    CLOSE cur;
END //

-- =========================================
-- PROCEDURE: sp_recalculate_concept_impact
-- Recalculates all PENDING invoices when a concept's amount changes
-- =========================================
CREATE PROCEDURE sp_recalculate_concept_impact(IN p_concept_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_inv_id INT;
    
    DECLARE cur CURSOR FOR 
        SELECT ic.invoice_id 
        FROM invoice_concept ic
        JOIN invoices i ON ic.invoice_id = i.invoice_id
        WHERE ic.concept_id = p_concept_id 
          AND i.status = 'pending'; -- PROTECTION: ONLY PENDING
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_inv_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Recalculate this specific invoice
        CALL sp_update_invoice_total(v_inv_id);
    END LOOP;
    CLOSE cur;
END //

DELIMITER ;
