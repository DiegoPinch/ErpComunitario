-- YakuGest / ERPAGUA - Integridad contable
-- Aplicar primero en una copia de producción. Requiere MySQL 8.0+.
-- Este script es aditivo: no elimina datos ni tablas existentes.

CREATE TABLE IF NOT EXISTS accounting_ledger_lock (
    lock_id TINYINT NOT NULL PRIMARY KEY
) ENGINE=InnoDB;
INSERT IGNORE INTO accounting_ledger_lock (lock_id) VALUES (1);

CREATE TABLE IF NOT EXISTS payment_collections (
    collection_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    system_user_id INT NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_due DECIMAL(12,2) NOT NULL,
    amount_tendered DECIMAL(12,2) NOT NULL,
    change_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    net_received DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash','transfer','deposit','card') NOT NULL,
    account_id INT DEFAULT NULL,
    reference_number VARCHAR(100) DEFAULT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    status ENUM('posted','partially_voided','voided') NOT NULL DEFAULT 'posted',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id),
    UNIQUE KEY uq_payment_collections_idempotency (idempotency_key),
    KEY idx_payment_collections_date (payment_date),
    CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_collections_system_user FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id),
    CONSTRAINT fk_collections_account FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id),
    CONSTRAINT chk_collections_values CHECK (
        total_due > 0 AND amount_tendered >= total_due AND
        change_amount = amount_tendered - total_due AND net_received = total_due
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Helpers temporales: permiten reanudar la migración si una ejecución quedó a medias.
DROP PROCEDURE IF EXISTS migration_add_column;
DROP PROCEDURE IF EXISTS migration_add_index;
DROP PROCEDURE IF EXISTS migration_add_constraint;
DELIMITER //
CREATE PROCEDURE migration_add_column(
    IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema=DATABASE() AND table_name=p_table AND column_name=p_column
    ) THEN
        SET @migration_sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE migration_stmt FROM @migration_sql;
        EXECUTE migration_stmt;
        DEALLOCATE PREPARE migration_stmt;
    END IF;
END//
CREATE PROCEDURE migration_add_index(
    IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema=DATABASE() AND table_name=p_table AND index_name=p_index
    ) THEN
        SET @migration_sql = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_definition);
        PREPARE migration_stmt FROM @migration_sql;
        EXECUTE migration_stmt;
        DEALLOCATE PREPARE migration_stmt;
    END IF;
END//
CREATE PROCEDURE migration_add_constraint(
    IN p_table VARCHAR(64), IN p_constraint VARCHAR(64), IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema=DATABASE() AND table_name=p_table AND constraint_name=p_constraint
    ) THEN
        SET @migration_sql = CONCAT('ALTER TABLE `', p_table, '` ADD CONSTRAINT `', p_constraint, '` ', p_definition);
        PREPARE migration_stmt FROM @migration_sql;
        EXECUTE migration_stmt;
        DEALLOCATE PREPARE migration_stmt;
    END IF;
END//
DELIMITER ;

ALTER TABLE payments MODIFY payment_method ENUM('cash','transfer','deposit','card') NOT NULL;
CALL migration_add_column('payments', 'collection_id', 'BIGINT DEFAULT NULL AFTER `payment_id`');
CALL migration_add_column('payments', 'status', 'ENUM(''posted'',''voided'') NOT NULL DEFAULT ''posted'' AFTER `movement_type`');
CALL migration_add_column('payments', 'voided_at', 'DATETIME DEFAULT NULL AFTER `status`');
CALL migration_add_column('payments', 'voided_by', 'INT DEFAULT NULL AFTER `voided_at`');
CALL migration_add_column('payments', 'void_reason', 'VARCHAR(255) DEFAULT NULL AFTER `voided_by`');
CALL migration_add_index('payments', 'idx_payments_status_date', 'KEY `idx_payments_status_date` (`status`,`payment_date`)');
CALL migration_add_index('payments', 'idx_payments_collection', 'KEY `idx_payments_collection` (`collection_id`)');
CALL migration_add_constraint('payments', 'fk_payments_collection', 'FOREIGN KEY (`collection_id`) REFERENCES `payment_collections` (`collection_id`)');
CALL migration_add_constraint('payments', 'fk_payments_voided_by', 'FOREIGN KEY (`voided_by`) REFERENCES `system_users` (`system_user_id`)');

ALTER TABLE debt_payments MODIFY payment_method ENUM('cash','transfer','deposit','card') NOT NULL DEFAULT 'cash';
CALL migration_add_column('debt_payments', 'collection_id', 'BIGINT DEFAULT NULL AFTER `debt_payment_id`');
CALL migration_add_column('debt_payments', 'status', 'ENUM(''posted'',''voided'') NOT NULL DEFAULT ''posted'' AFTER `amount_paid`');
CALL migration_add_column('debt_payments', 'voided_at', 'DATETIME DEFAULT NULL AFTER `status`');
CALL migration_add_column('debt_payments', 'voided_by', 'INT DEFAULT NULL AFTER `voided_at`');
CALL migration_add_column('debt_payments', 'void_reason', 'VARCHAR(255) DEFAULT NULL AFTER `voided_by`');
CALL migration_add_index('debt_payments', 'idx_debt_payments_status_date', 'KEY `idx_debt_payments_status_date` (`status`,`payment_date`)');
CALL migration_add_index('debt_payments', 'idx_debt_payments_collection', 'KEY `idx_debt_payments_collection` (`collection_id`)');
CALL migration_add_constraint('debt_payments', 'fk_debt_payments_collection', 'FOREIGN KEY (`collection_id`) REFERENCES `payment_collections` (`collection_id`)');
CALL migration_add_constraint('debt_payments', 'fk_debt_payments_voided_by', 'FOREIGN KEY (`voided_by`) REFERENCES `system_users` (`system_user_id`)');

CALL migration_add_column('expenses', 'status', 'ENUM(''posted'',''voided'') NOT NULL DEFAULT ''posted''');
CALL migration_add_column('expenses', 'voided_at', 'DATETIME DEFAULT NULL');
CALL migration_add_column('expenses', 'voided_by', 'INT DEFAULT NULL');
CALL migration_add_column('expenses', 'void_reason', 'VARCHAR(255) DEFAULT NULL');
CALL migration_add_index('expenses', 'idx_expenses_status_date', 'KEY `idx_expenses_status_date` (`status`,`expense_date`)');
CALL migration_add_constraint('expenses', 'fk_expenses_voided_by', 'FOREIGN KEY (`voided_by`) REFERENCES `system_users` (`system_user_id`)');

CALL migration_add_column('other_incomes', 'status', 'ENUM(''posted'',''voided'') NOT NULL DEFAULT ''posted''');
CALL migration_add_column('other_incomes', 'voided_at', 'DATETIME DEFAULT NULL');
CALL migration_add_column('other_incomes', 'voided_by', 'INT DEFAULT NULL');
CALL migration_add_column('other_incomes', 'void_reason', 'VARCHAR(255) DEFAULT NULL');
CALL migration_add_index('other_incomes', 'idx_other_incomes_status_date', 'KEY `idx_other_incomes_status_date` (`status`,`income_date`)');
CALL migration_add_constraint('other_incomes', 'fk_other_incomes_voided_by', 'FOREIGN KEY (`voided_by`) REFERENCES `system_users` (`system_user_id`)');

CALL migration_add_column('invoice_concept', 'description_snapshot', 'VARCHAR(2000) DEFAULT NULL');
CALL migration_add_column('invoice_concept', 'amount_snapshot', 'DECIMAL(12,2) DEFAULT NULL');
CALL migration_add_column('invoice_concept', 'concept_type_snapshot', 'ENUM(''standard'',''fine'',''installment'',''discount'') DEFAULT NULL');
CALL migration_add_column('invoice_concept', 'agreement_id', 'INT DEFAULT NULL');
CALL migration_add_index('invoice_concept', 'idx_invoice_concept_agreement', 'KEY `idx_invoice_concept_agreement` (`agreement_id`)');
CALL migration_add_constraint('invoice_concept', 'fk_invoice_concept_agreement', 'FOREIGN KEY (`agreement_id`) REFERENCES `payment_agreements` (`agreement_id`)');

UPDATE invoice_concept ic
JOIN additional_concepts ac ON ac.concept_id = ic.concept_id
SET ic.description_snapshot = COALESCE(ic.description_snapshot, ac.description),
    ic.amount_snapshot = COALESCE(ic.amount_snapshot, ac.amount),
    ic.concept_type_snapshot = COALESCE(ic.concept_type_snapshot, ac.concept_type)
WHERE ic.description_snapshot IS NULL
   OR ic.amount_snapshot IS NULL
   OR ic.concept_type_snapshot IS NULL;

CALL migration_add_column('accounting_periods', 'previous_balance', 'DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `end_date`');
CALL migration_add_column('accounting_periods', 'snapshot_json', 'LONGTEXT NULL');
CALL migration_add_column('accounting_periods', 'integrity_hash', 'CHAR(64) DEFAULT NULL');
CALL migration_add_column('accounting_periods', 'closed_at', 'DATETIME DEFAULT NULL');

CREATE TABLE IF NOT EXISTS financial_audit_log (
    audit_id BIGINT NOT NULL AUTO_INCREMENT,
    system_user_id INT NOT NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id BIGINT DEFAULT NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255) DEFAULT NULL,
    before_json JSON DEFAULT NULL,
    after_json JSON DEFAULT NULL,
    PRIMARY KEY (audit_id),
    KEY idx_financial_audit_entity (entity_type, entity_id),
    KEY idx_financial_audit_date (occurred_at),
    CONSTRAINT fk_financial_audit_user FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP PROCEDURE migration_add_column;
DROP PROCEDURE migration_add_index;
DROP PROCEDURE migration_add_constraint;

DROP TRIGGER IF EXISTS trg_invoice_concept_snapshot;
DELIMITER //
CREATE TRIGGER trg_invoice_concept_snapshot
BEFORE INSERT ON invoice_concept
FOR EACH ROW
BEGIN
    SET NEW.description_snapshot = COALESCE(
        NEW.description_snapshot,
        (SELECT description FROM additional_concepts WHERE concept_id=NEW.concept_id)
    );
    SET NEW.amount_snapshot = COALESCE(
        NEW.amount_snapshot,
        (SELECT amount FROM additional_concepts WHERE concept_id=NEW.concept_id)
    );
    SET NEW.concept_type_snapshot = COALESCE(
        NEW.concept_type_snapshot,
        (SELECT concept_type FROM additional_concepts WHERE concept_id=NEW.concept_id)
    );
END//

DROP PROCEDURE IF EXISTS sp_update_invoice_total//
CREATE PROCEDURE sp_update_invoice_total(IN p_invoice_id INT)
BEGIN
    DECLARE v_reading_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_concepts_amount DECIMAL(12,2) DEFAULT 0;
    SELECT COALESCE(SUM(amount),0) INTO v_reading_amount
      FROM readings WHERE invoice_id=p_invoice_id;
    SELECT COALESCE(SUM(COALESCE(ic.amount_snapshot, ac.amount)),0) INTO v_concepts_amount
      FROM invoice_concept ic JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
      WHERE ic.invoice_id=p_invoice_id;
    UPDATE invoices SET total_amount=v_reading_amount+v_concepts_amount
      WHERE invoice_id=p_invoice_id AND status='pending';
END//
DELIMITER ;

-- Validaciones que deben devolver cero filas antes de crear las restricciones únicas.
SELECT meter_id, month_year, COUNT(*) AS duplicates
FROM readings GROUP BY meter_id, month_year HAVING COUNT(*) > 1;

SELECT user_id, billing_month, COUNT(*) AS duplicates
FROM invoices WHERE invoice_type = 'water'
GROUP BY user_id, billing_month HAVING COUNT(*) > 1;

SELECT start_date, end_date, COUNT(*) AS duplicates
FROM accounting_periods GROUP BY start_date, end_date HAVING COUNT(*) > 1;

-- Ejecutar únicamente después de resolver cualquier fila devuelta arriba:
-- ALTER TABLE readings ADD UNIQUE KEY uq_readings_meter_month (meter_id, month_year);
-- ALTER TABLE invoices ADD COLUMN water_period_key VARCHAR(130)
--   GENERATED ALWAYS AS (CASE WHEN invoice_type='water' THEN CONCAT(user_id, '|', billing_month) ELSE NULL END) STORED,
--   ADD UNIQUE KEY uq_invoices_water_period (water_period_key);
-- ALTER TABLE accounting_periods
--   ADD UNIQUE KEY uq_accounting_period_range (start_date, end_date);
