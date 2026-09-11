const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // 1. Obtener las facturas de julio vinculadas al concepto 8 (Minga Agosto)
    const [wrongInvoices] = await conn.query(`
      SELECT ic.id as link_id, ic.invoice_id
      FROM invoice_concept ic
      JOIN invoices i ON ic.invoice_id = i.invoice_id
      WHERE ic.concept_id = 8 AND i.billing_month != '2026-08'
    `);
    
    console.log(`Facturas a limpiar: ${wrongInvoices.length}`);
    
    // 2. Eliminar los vínculos incorrectos
    for (const row of wrongInvoices) {
      await conn.query('DELETE FROM invoice_concept WHERE id = ?', [row.link_id]);
      // Recalcular el total de la factura sin la multa
      await conn.query('CALL sp_update_invoice_total(?)', [row.invoice_id]);
      console.log(`  Limpiada factura ${row.invoice_id}`);
    }
    
    await conn.commit();
    console.log('\nLimpieza completada. Ahora arreglando el Stored Procedure...');
    
    // 3. Recrear el SP corregido: solo aplica a facturas del mes exacto de la minga
    // Si no existe factura del mes, crea una nueva factura pendiente
    await pool.query(`DROP PROCEDURE IF EXISTS sp_apply_global_concept`);
    
    await pool.query(`
      CREATE PROCEDURE sp_apply_global_concept(IN p_concept_id INT)
      BEGIN
        DECLARE done INT DEFAULT FALSE;
        DECLARE v_user_id INT;
        DECLARE v_inv_id INT;
        DECLARE v_app_month VARCHAR(7);
        
        -- Obtener el mes de aplicación del concepto
        SELECT application_month INTO v_app_month
        FROM additional_concepts WHERE concept_id = p_concept_id;
        
        -- Cursor de usuarios que deben pagar (aplica_to = 'user', no exentos)
        DECLARE cur CURSOR FOR
          SELECT DISTINCT i.user_id
          FROM invoices i
          JOIN additional_concepts ac ON ac.concept_id = p_concept_id
          JOIN users u ON i.user_id = u.user_id
          WHERE i.billing_month = v_app_month
            AND u.exempt_from_fines = FALSE;
            
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        OPEN cur;
        read_loop: LOOP
          FETCH cur INTO v_user_id;
          IF done THEN
            LEAVE read_loop;
          END IF;
          
          -- Buscar factura de agua del mes exacto
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
          
          SET v_inv_id = NULL;
        END LOOP;
        CLOSE cur;
      END
    `);
    
    console.log('SP arreglado exitosamente.');
    
  } catch(e) {
    await conn.rollback();
    console.error('ERROR:', e.message);
  } finally {
    conn.release();
    process.exit();
  }
})();
