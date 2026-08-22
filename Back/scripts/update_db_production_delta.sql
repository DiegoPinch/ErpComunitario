-- =====================================================================
-- SCRIPT DE MIGRACIÓN Y ACTUALIZACIÓN DELTA PARA PRODUCCIÓN
-- Ejecuta este script sobre tu base de datos existente para agregar 
-- las nuevas funcionalidades sin borrar tus datos actuales.
-- =====================================================================

USE water_system;

-- =========================================================
-- 1. TABLAS NUEVAS DE ADMINISTRACIÓN E INVENTARIO
-- =========================================================

-- 1.1 Tabla de Directivas / Administraciones
CREATE TABLE IF NOT EXISTS administrations (
    administration_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL, -- Ej: "Directiva Periodo 2024-2026"
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    status ENUM('active', 'completed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.2 Tabla de Cuentas Bancarias
CREATE TABLE IF NOT EXISTS bank_accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_type ENUM('savings', 'checking') NOT NULL DEFAULT 'savings',
    initial_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.3 Tabla de Categorías de Ingreso
CREATE TABLE IF NOT EXISTS income_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.4 Tabla de Ingresos Extraordinarios
CREATE TABLE IF NOT EXISTS other_incomes (
    income_id INT AUTO_INCREMENT PRIMARY KEY,
    system_user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    income_date DATE NOT NULL,
    description TEXT DEFAULT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_number VARCHAR(100) DEFAULT NULL,
    account_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_other_incomes_sysuser FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id),
    CONSTRAINT fk_other_incomes_account FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.5 Tabla de Convenios de Pago (Cuentas por Cobrar)
CREATE TABLE IF NOT EXISTS payment_agreements (
    agreement_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    number_of_installments INT DEFAULT NULL,
    installment_amount DECIMAL(10,2) DEFAULT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    start_month VARCHAR(7) DEFAULT NULL,
    status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.6 Tabla de Abonos a Convenios
CREATE TABLE IF NOT EXISTS debt_payments (
    debt_payment_id INT AUTO_INCREMENT PRIMARY KEY,
    agreement_id INT NOT NULL,
    system_user_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'transfer', 'deposit') NOT NULL DEFAULT 'cash',
    account_id INT DEFAULT NULL,
    reference_number VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (agreement_id) REFERENCES payment_agreements(agreement_id),
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id),
    FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.7 Tabla de Cortes Contables
CREATE TABLE IF NOT EXISTS accounting_periods (
    period_id INT AUTO_INCREMENT PRIMARY KEY,
    administration_id INT NOT NULL,
    system_user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_incomes DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    system_balance DECIMAL(10,2) NOT NULL,
    physical_balance DECIMAL(10,2) NOT NULL,
    difference DECIMAL(10,2) NOT NULL,
    observations TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (administration_id) REFERENCES administrations(administration_id),
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.8 Tabla de Catálogo e Inventario de Bienes
CREATE TABLE IF NOT EXISTS inventory_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    category ENUM('consumable', 'fixed_asset') NOT NULL,
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL,
    value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    condition_status ENUM('new', 'good', 'needs_repair', 'discarded') DEFAULT 'new'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.9 Tabla de Movimientos de Inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    movement_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    system_user_id INT NOT NULL,
    movement_type ENUM('in', 'out') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reference_description VARCHAR(255) NOT NULL,
    movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id),
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.10 Tabla de Configuraciones de Multas (Nueva)
CREATE TABLE IF NOT EXISTS fine_configurations (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    default_amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- =========================================================
-- 2. ALTERACIONES A TABLAS EXISTENTES (MODIFICACIONES DELTA)
-- =========================================================

-- 2.1 Agregar 'status' a system_users y modificar roles
ALTER TABLE system_users 
ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT TRUE AFTER role,
MODIFY COLUMN role ENUM('admin', 'board', 'user', 'treasurer') NOT NULL;

-- 2.2 Agregar directiva a los miembros de la mesa
ALTER TABLE board_members
ADD COLUMN IF NOT EXISTS administration_id INT DEFAULT NULL AFTER board_id,
ADD CONSTRAINT fk_board_admin FOREIGN KEY IF NOT EXISTS (administration_id) REFERENCES administrations(administration_id);

-- 2.3 Mejorar invoices para admitir tipos y descripciones
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_type ENUM('water', 'legacy_debt', 'installation', 'other') NOT NULL DEFAULT 'water' AFTER user_id,
ADD COLUMN IF NOT EXISTS description VARCHAR(255) DEFAULT NULL AFTER billing_month,
MODIFY COLUMN billing_month VARCHAR(100) NULL,
MODIFY COLUMN status ENUM('pending', 'partial', 'paid', 'cancelled') NOT NULL DEFAULT 'pending';

-- 2.4 Agregar tipo a additional_concepts
ALTER TABLE additional_concepts 
ADD COLUMN IF NOT EXISTS concept_type ENUM('standard', 'fine', 'installment', 'discount') NOT NULL DEFAULT 'standard' AFTER concept_id;

-- 2.5 Modificar applies_to en additional_concepts para admitir 'user' (necesario para multas de asistencia)
ALTER TABLE additional_concepts 
MODIFY COLUMN applies_to ENUM('all', 'user') NOT NULL;

-- 2.6 Enlazar egresos a tesorero y cuenta bancaria
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS system_user_id INT DEFAULT NULL AFTER category_id,
ADD COLUMN IF NOT EXISTS account_id INT DEFAULT NULL AFTER reference_number,
ADD CONSTRAINT fk_expenses_sysuser FOREIGN KEY IF NOT EXISTS (system_user_id) REFERENCES system_users(system_user_id),
ADD CONSTRAINT fk_expenses_account FOREIGN KEY IF NOT EXISTS (account_id) REFERENCES bank_accounts(account_id);

-- 2.7 Enlazar cobros ordinarios a tesorero y cuenta bancaria
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS system_user_id INT DEFAULT NULL AFTER invoice_id,
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100) DEFAULT NULL AFTER payment_method,
ADD COLUMN IF NOT EXISTS account_id INT DEFAULT NULL AFTER reference_number,
ADD CONSTRAINT fk_payments_sysuser FOREIGN KEY IF NOT EXISTS (system_user_id) REFERENCES system_users(system_user_id),
ADD CONSTRAINT fk_payments_account FOREIGN KEY IF NOT EXISTS (account_id) REFERENCES bank_accounts(account_id);

-- 2.8 Actualizar la estructura de meetings para soportar multas y tipos
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_type ENUM('session', 'minga') NOT NULL DEFAULT 'session' AFTER notes,
ADD COLUMN IF NOT EXISTS fine_config_id INT DEFAULT NULL AFTER meeting_type,
ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10,2) NOT NULL DEFAULT 5.00 AFTER fine_config_id,
ADD COLUMN IF NOT EXISTS concept_id INT DEFAULT NULL AFTER fine_amount,
ADD CONSTRAINT fk_meetings_fine_config FOREIGN KEY IF NOT EXISTS (fine_config_id) REFERENCES fine_configurations(config_id),
ADD CONSTRAINT fk_meetings_concept FOREIGN KEY IF NOT EXISTS (concept_id) REFERENCES additional_concepts(concept_id);


-- =========================================================
-- 3. ACTUALIZACIÓN / RE-CREACIÓN DE PROCEDIMIENTOS ALMACENADOS
-- =========================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_update_invoice_total //
CREATE PROCEDURE sp_update_invoice_total(IN p_invoice_id INT)
BEGIN
    DECLARE v_reading_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_concepts_amount DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(amount), 0)
    INTO v_reading_amount
    FROM readings
    WHERE invoice_id = p_invoice_id;
    
    SELECT COALESCE(SUM(ac.amount), 0)
    INTO v_concepts_amount
    FROM invoice_concept ic
    JOIN additional_concepts ac
        ON ic.concept_id = ac.concept_id
    WHERE ic.invoice_id = p_invoice_id;
    
    UPDATE invoices
    SET total_amount = v_reading_amount + v_concepts_amount
    WHERE invoice_id = p_invoice_id;
END //

DROP PROCEDURE IF EXISTS sp_apply_global_concept //
CREATE PROCEDURE sp_apply_global_concept(IN p_concept_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_inv_id INT;
    
    DECLARE cur CURSOR FOR
        SELECT i.invoice_id
        FROM invoices i
        JOIN additional_concepts ac
            ON i.billing_month = ac.application_month
        JOIN users u
            ON i.user_id = u.user_id
        WHERE ac.concept_id = p_concept_id
          AND i.status = 'pending'
          AND u.exempt_from_fines = FALSE;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_inv_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT IGNORE INTO invoice_concept (invoice_id, concept_id)
        VALUES (v_inv_id, p_concept_id);
        
        CALL sp_update_invoice_total(v_inv_id);
    END LOOP;

    CLOSE cur;
END //

DROP PROCEDURE IF EXISTS sp_recalculate_concept_impact //
CREATE PROCEDURE sp_recalculate_concept_impact(IN p_concept_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_inv_id INT;
    
    DECLARE cur CURSOR FOR
        SELECT ic.invoice_id
        FROM invoice_concept ic
        JOIN invoices i
            ON ic.invoice_id = i.invoice_id
        WHERE ic.concept_id = p_concept_id
          AND i.status = 'pending';
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_inv_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        CALL sp_update_invoice_total(v_inv_id);
    END LOOP;

    CLOSE cur;
END //

DROP PROCEDURE IF EXISTS sp_record_reading_and_invoice //
CREATE PROCEDURE sp_record_reading_and_invoice(
    IN p_user_id INT,
    IN p_meter_id INT,
    IN p_billing_month VARCHAR(7),
    IN p_current_reading INT
)
BEGIN
    DECLARE v_prev_reading INT;
    DECLARE v_invoice_id INT;
    DECLARE v_meter_type VARCHAR(20);
    DECLARE v_rate_id INT;
    DECLARE v_unit_price DECIMAL(10,2);
    DECLARE v_base_limit INT;
    DECLARE v_excess_price DECIMAL(10,2);
    DECLARE v_consumption INT;
    DECLARE v_excess INT;
    DECLARE v_amount DECIMAL(10,2);
    DECLARE v_existing_reading_id INT;
    DECLARE v_old_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_invoice_status VARCHAR(20) DEFAULT 'pending';

    SELECT reading_id, amount
    INTO v_existing_reading_id, v_old_amount
    FROM readings
    WHERE meter_id = p_meter_id
      AND month_year = p_billing_month
    LIMIT 1;

    SELECT invoice_id, status
    INTO v_invoice_id, v_invoice_status
    FROM invoices
    WHERE user_id = p_user_id
      AND billing_month = p_billing_month
    LIMIT 1;

    IF v_invoice_id IS NOT NULL AND v_invoice_status = 'paid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede modificar una lectura con factura pagada';
    END IF;

    SELECT type INTO v_meter_type
    FROM meters
    WHERE meter_id = p_meter_id;

    SELECT current_reading
    INTO v_prev_reading
    FROM readings
    WHERE meter_id = p_meter_id
      AND month_year < p_billing_month
    ORDER BY month_year DESC
    LIMIT 1;

    IF v_prev_reading IS NULL THEN
        SELECT initial_reading
        INTO v_prev_reading
        FROM meters
        WHERE meter_id = p_meter_id;
    END IF;

    SELECT rate_id, unit_price, base_limit, excess_price
    INTO v_rate_id, v_unit_price, v_base_limit, v_excess_price
    FROM rates
    WHERE meter_type = v_meter_type
      AND active = TRUE
    LIMIT 1;

    SET v_consumption = p_current_reading - v_prev_reading;

    IF v_consumption < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La lectura actual no puede ser menor a la anterior';
    END IF;

    SET v_excess = GREATEST(0, v_consumption - v_base_limit);
    SET v_amount = v_unit_price + (v_excess * v_excess_price);

    IF v_invoice_id IS NULL THEN
        INSERT INTO invoices (user_id, billing_month, total_amount, issue_date, status)
        VALUES (p_user_id, p_billing_month, v_amount, CURRENT_DATE, 'pending');

        SET v_invoice_id = LAST_INSERT_ID();
        
        -- Auto-vincular rubros globales para este mes (solo si el usuario no es exento)
        IF EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND exempt_from_fines = FALSE) THEN
            INSERT IGNORE INTO invoice_concept (invoice_id, concept_id)
            SELECT v_invoice_id, concept_id
            FROM additional_concepts
            WHERE application_month = p_billing_month
              AND applies_to = 'all';
        END IF;
    END IF;

    IF v_existing_reading_id IS NULL THEN
        INSERT INTO readings (
            invoice_id, meter_id, rate_id, month_year,
            previous_reading, current_reading, consumption, excess, amount
        )
        VALUES (
            v_invoice_id, p_meter_id, v_rate_id, p_billing_month,
            v_prev_reading, p_current_reading, v_consumption, v_excess, v_amount
        );
    ELSE
        UPDATE readings
        SET
            rate_id = v_rate_id,
            previous_reading = v_prev_reading,
            current_reading = p_current_reading,
            consumption = v_consumption,
            excess = v_excess,
            amount = v_amount
        WHERE reading_id = v_existing_reading_id;
    END IF;

    CALL sp_update_invoice_total(v_invoice_id);

    SELECT
        v_amount AS reading_amount,
        total_amount AS invoice_total
    FROM invoices
    WHERE invoice_id = v_invoice_id;
END //

DELIMITER ;
