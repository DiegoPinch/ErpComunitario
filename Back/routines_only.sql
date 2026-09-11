-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: localhost    Database: water_system
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping routines for database 'water_system'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_apply_global_concept` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_apply_global_concept`(IN p_concept_id INT)
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
      END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_recalculate_concept_impact` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_recalculate_concept_impact`(IN p_concept_id INT)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_record_reading_and_invoice` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_record_reading_and_invoice`(
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
      END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_invoice_total` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_update_invoice_total`(IN p_invoice_id INT)
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
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-30  9:15:53
