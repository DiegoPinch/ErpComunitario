-- =====================================================================
-- WATER SYSTEM DATABASE SCHEMA - FULL CONSOLIDATED SCHEMA (PROD/DEV)
-- Includes: Base V1/V2 Tables, Bank Accounts, Directiva, Accounting,
--           Inventory, and new Meeting/Minga Fines Configurations.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS water_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE water_system;

-- ==========================================
-- 1. BASE CONFIGURATION & USERS
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    national_id VARCHAR(10) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(150) UNIQUE,
    registration_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS system_users (
    system_user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'board', 'user', 'treasurer') NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS meters (
    meter_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('consumo', 'riego') NOT NULL,
    initial_reading INT NOT NULL,
    installation_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS meter_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    meter_id INT NOT NULL,
    user_id INT NOT NULL,
    assignment_date DATE NOT NULL,
    removal_date DATE,
    assigned BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (meter_id) REFERENCES meters(meter_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS rates (
    rate_id INT AUTO_INCREMENT PRIMARY KEY,
    meter_type ENUM('consumo', 'riego') NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    base_limit INT NOT NULL CHECK (base_limit >= 0),
    excess_price DECIMAL(10,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==========================================
-- 2. BANK ACCOUNTS & GENERAL FINANCES
-- ==========================================

CREATE TABLE IF NOT EXISTS bank_accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_type ENUM('savings', 'checking') NOT NULL DEFAULT 'savings',
    initial_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS income_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS other_incomes (
    income_id INT AUTO_INCREMENT PRIMARY KEY,
    system_user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    income_date DATE NOT NULL,
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_number VARCHAR(100) DEFAULT NULL,
    account_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id),
    FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS expense_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT DEFAULT NULL,
    system_user_id INT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_number VARCHAR(100) DEFAULT NULL,
    account_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(category_id),
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id),
    FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==========================================
-- 3. INVOICING & MAIN PAYMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    invoice_type ENUM('water', 'legacy_debt', 'installation', 'other') NOT NULL DEFAULT 'water',
    billing_month VARCHAR(100) DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    issue_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status ENUM('pending', 'partial', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS readings (
    reading_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    meter_id INT NOT NULL,
    rate_id INT NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    previous_reading INT NOT NULL,
    current_reading INT NOT NULL,
    consumption INT NOT NULL,
    excess INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (meter_id) REFERENCES meters(meter_id),
    FOREIGN KEY (rate_id) REFERENCES rates(rate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS additional_concepts (
    concept_id INT AUTO_INCREMENT PRIMARY KEY,
    concept_type ENUM('standard', 'fine', 'installment', 'discount') NOT NULL DEFAULT 'standard',
    description VARCHAR(2000) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    applies_to ENUM('all', 'user') NOT NULL,
    application_month VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS invoice_concept (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    concept_id INT NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (concept_id) REFERENCES additional_concepts(concept_id),
    UNIQUE (invoice_id, concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    system_user_id INT DEFAULT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invoice_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    movement_type ENUM('payment', 'partial') NOT NULL,
    payment_method ENUM('cash', 'transfer', 'card') NOT NULL,
    reference_number VARCHAR(100) DEFAULT NULL,
    account_id INT DEFAULT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id),
    FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==========================================
-- 4. PAYMENT AGREEMENTS (DEBTS IN INSTALLMENTS)
-- ==========================================

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

-- ==========================================
-- 5. ADMINISTRATIONS, BOARD MEMBERS, AUDITS
-- ==========================================

CREATE TABLE IF NOT EXISTS administrations (
    administration_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'completed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS board_members (
    board_id INT AUTO_INCREMENT PRIMARY KEY,
    administration_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    role VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (administration_id) REFERENCES administrations(administration_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (administration_id) REFERENCES administrations(administration_id),
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==========================================
-- 6. INVENTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS inventory_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE DEFAULT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    category VARCHAR(50) NOT NULL,
    unit_measure VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    condition_status ENUM('new', 'good', 'needs_repair', 'discarded') DEFAULT 'new'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS inventory_movements (
    movement_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    system_user_id INT NOT NULL,
    movement_type ENUM('in', 'out') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    reference VARCHAR(100) DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    reference_description VARCHAR(255) DEFAULT NULL,
    movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id),
    FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==========================================
-- 7. MEETINGS, ATTENDANCE & FINES CONFIG
-- ==========================================

CREATE TABLE IF NOT EXISTS fine_configurations (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    default_amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS meetings (
    meeting_id INT AUTO_INCREMENT PRIMARY KEY,
    reason VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    minutes TEXT,
    notes TEXT,
    meeting_type ENUM('session', 'minga') NOT NULL DEFAULT 'session',
    fine_config_id INT DEFAULT NULL,
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    concept_id INT DEFAULT NULL,
    FOREIGN KEY (fine_config_id) REFERENCES fine_configurations(config_id),
    FOREIGN KEY (concept_id) REFERENCES additional_concepts(concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    user_id INT NOT NULL,
    attended ENUM('yes', 'no', 'justified') NOT NULL,
    observations TEXT,
    FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================================
-- STORED PROCEDURES
-- =====================================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_update_invoice_total //
CREATE PROCEDURE sp_update_invoice_total(IN p_invoice_id INT)
BEGIN
    DECLARE v_reading_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_concepts_amount DECIMAL(10,2) DEFAULT 0;
    
    -- Total from readings
    SELECT COALESCE(SUM(amount), 0)
    INTO v_reading_amount
    FROM readings
    WHERE invoice_id = p_invoice_id;
    
    -- Total from additional concepts
    SELECT COALESCE(SUM(ac.amount), 0)
    INTO v_concepts_amount
    FROM invoice_concept ic
    JOIN additional_concepts ac
        ON ic.concept_id = ac.concept_id
    WHERE ic.invoice_id = p_invoice_id;
    
    -- Update invoice
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

    -- 1. Verificar si ya existe lectura
    SELECT reading_id, amount
    INTO v_existing_reading_id, v_old_amount
    FROM readings
    WHERE meter_id = p_meter_id
      AND month_year = p_billing_month
    LIMIT 1;

    -- 2. Buscar factura
    SELECT invoice_id, status
    INTO v_invoice_id, v_invoice_status
    FROM invoices
    WHERE user_id = p_user_id
      AND billing_month = p_billing_month
    LIMIT 1;

    -- 3. Seguridad: factura pagada
    IF v_invoice_id IS NOT NULL AND v_invoice_status = 'paid' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se puede modificar una lectura con factura pagada';
    END IF;

    -- 4. Tipo de medidor
    SELECT type INTO v_meter_type
    FROM meters
    WHERE meter_id = p_meter_id;

    -- 5. Lectura anterior
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

    -- 6. Tarifa activa
    SELECT rate_id, unit_price, base_limit, excess_price
    INTO v_rate_id, v_unit_price, v_base_limit, v_excess_price
    FROM rates
    WHERE meter_type = v_meter_type
      AND active = TRUE
    LIMIT 1;

    -- 7. Cálculos
    SET v_consumption = p_current_reading - v_prev_reading;

    IF v_consumption < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La lectura actual no puede ser menor a la anterior';
    END IF;

    SET v_excess = GREATEST(0, v_consumption - v_base_limit);
    SET v_amount = v_unit_price + (v_excess * v_excess_price);

    -- 8. Crear factura si no existe
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

    -- 9. Insertar o actualizar lectura
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

    -- 10. Recalcular factura
    CALL sp_update_invoice_total(v_invoice_id);

    -- Resultado
    SELECT
        v_amount AS reading_amount,
        total_amount AS invoice_total
    FROM invoices
    WHERE invoice_id = v_invoice_id;
END //

DELIMITER ;
