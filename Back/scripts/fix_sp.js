const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });
  
  try {
    await pool.query('DROP PROCEDURE IF EXISTS sp_apply_global_concept');
    
    // En MySQL, el orden MUST ser: DECLARE vars -> DECLARE CURSOR -> DECLARE CONTINUE HANDLER
    await pool.query(`
      CREATE PROCEDURE sp_apply_global_concept(IN p_concept_id INT)
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE v_user_id INT;
        DECLARE v_inv_id INT;
        DECLARE v_app_month VARCHAR(7);
        
        SELECT application_month INTO v_app_month
        FROM additional_concepts WHERE concept_id = p_concept_id;
        
        BEGIN
          DECLARE cur CURSOR FOR
            SELECT DISTINCT i.user_id
            FROM invoices i
            JOIN users u ON i.user_id = u.user_id
            WHERE i.billing_month = v_app_month
              AND i.invoice_type = 'water'
              AND u.exempt_from_fines = FALSE;
              
          DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

          OPEN cur;
          read_loop: LOOP
            FETCH cur INTO v_user_id;
            IF done THEN
              LEAVE read_loop;
            END IF;
            
            SET v_inv_id = NULL;
            
            SELECT invoice_id INTO v_inv_id
            FROM invoices
            WHERE user_id = v_user_id
              AND billing_month = v_app_month
              AND invoice_type = 'water'
            LIMIT 1;
            
            IF v_inv_id IS NOT NULL THEN
              INSERT IGNORE INTO invoice_concept (invoice_id, concept_id)
              VALUES (v_inv_id, p_concept_id);
              
              CALL sp_update_invoice_total(v_inv_id);
            END IF;
            
          END LOOP;
          CLOSE cur;
        END;
      END
    `);
    
    console.log('SP arreglado exitosamente. La multa ahora solo se aplica al mes exacto de la minga.');
    
    // También aplicar el mismo fix al DEV water_system
    const pool2 = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system' });
    await pool2.query('DROP PROCEDURE IF EXISTS sp_apply_global_concept');
    await pool2.query(`
      CREATE PROCEDURE sp_apply_global_concept(IN p_concept_id INT)
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE v_user_id INT;
        DECLARE v_inv_id INT;
        DECLARE v_app_month VARCHAR(7);
        
        SELECT application_month INTO v_app_month
        FROM additional_concepts WHERE concept_id = p_concept_id;
        
        BEGIN
          DECLARE cur CURSOR FOR
            SELECT DISTINCT i.user_id
            FROM invoices i
            JOIN users u ON i.user_id = u.user_id
            WHERE i.billing_month = v_app_month
              AND i.invoice_type = 'water'
              AND u.exempt_from_fines = FALSE;
              
          DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

          OPEN cur;
          read_loop: LOOP
            FETCH cur INTO v_user_id;
            IF done THEN
              LEAVE read_loop;
            END IF;
            
            SET v_inv_id = NULL;
            
            SELECT invoice_id INTO v_inv_id
            FROM invoices
            WHERE user_id = v_user_id
              AND billing_month = v_app_month
              AND invoice_type = 'water'
            LIMIT 1;
            
            IF v_inv_id IS NOT NULL THEN
              INSERT IGNORE INTO invoice_concept (invoice_id, concept_id)
              VALUES (v_inv_id, p_concept_id);
              
              CALL sp_update_invoice_total(v_inv_id);
            END IF;
            
          END LOOP;
          CLOSE cur;
        END;
      END
    `);
    console.log('SP actualizado tambien en water_system (dev).');
    
  } catch(e) {
    console.error('ERROR:', e.message);
  }
  process.exit();
})();
