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
-- Table structure for table `accounting_periods`
--

DROP TABLE IF EXISTS `accounting_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_periods` (
  `period_id` int NOT NULL AUTO_INCREMENT,
  `administration_id` int NOT NULL,
  `system_user_id` int NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `previous_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_incomes` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_expenses` decimal(10,2) NOT NULL DEFAULT '0.00',
  `system_balance` decimal(10,2) NOT NULL,
  `physical_balance` decimal(10,2) NOT NULL,
  `difference` decimal(10,2) NOT NULL,
  `observations` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`period_id`),
  KEY `administration_id` (`administration_id`),
  KEY `system_user_id` (`system_user_id`),
  CONSTRAINT `accounting_periods_ibfk_1` FOREIGN KEY (`administration_id`) REFERENCES `administrations` (`administration_id`),
  CONSTRAINT `accounting_periods_ibfk_2` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_periods`
--

LOCK TABLES `accounting_periods` WRITE;
/*!40000 ALTER TABLE `accounting_periods` DISABLE KEYS */;
INSERT INTO `accounting_periods` VALUES (2,1,1,'ENE-AGOS 2026','2026-01-01 00:00:00','2026-08-21 00:00:00',0.00,26700.47,24289.00,2411.47,2400.00,-11.47,'CORTE URGENTE','2026-08-21 16:52:07');
/*!40000 ALTER TABLE `accounting_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `additional_concepts`
--

DROP TABLE IF EXISTS `additional_concepts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `additional_concepts` (
  `concept_id` int NOT NULL AUTO_INCREMENT,
  `concept_type` enum('standard','fine','installment','discount') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'standard',
  `description` varchar(2000) COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `applies_to` enum('all','user') COLLATE utf8mb4_general_ci NOT NULL,
  `application_month` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`concept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `additional_concepts`
--

LOCK TABLES `additional_concepts` WRITE;
/*!40000 ALTER TABLE `additional_concepts` DISABLE KEYS */;
INSERT INTO `additional_concepts` VALUES (2,'fine','Multa Inasistencia a Sesión - Agosto 2026, Fecha: 20/08/2026',5.00,'user','2026-08'),(3,'fine','Multa Inasistencia a Minga - Agosto 2026, Fecha: 15/08/2026',20.00,'user','2026-08'),(5,'standard','colaboración para la parroquializacion cochapamba',1.00,'all','2026-08'),(6,'standard','colaboración para el gad cochapamba',2.00,'all','2026-09'),(7,'standard','reparación de agua',13.00,'user','2026-08');
/*!40000 ALTER TABLE `additional_concepts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administrations`
--

DROP TABLE IF EXISTS `administrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrations` (
  `administration_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','completed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`administration_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrations`
--

LOCK TABLES `administrations` WRITE;
/*!40000 ALTER TABLE `administrations` DISABLE KEYS */;
INSERT INTO `administrations` VALUES (1,'2026-2028','2026-08-17','2028-08-17','active','2026-08-17 15:07:33');
/*!40000 ALTER TABLE `administrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `user_id` int NOT NULL,
  `attended` enum('yes','no','justified') COLLATE utf8mb4_general_ci NOT NULL,
  `observations` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`attendance_id`),
  KEY `meeting_id` (`meeting_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`meeting_id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (2,2,5,'no',NULL),(3,2,7,'no',NULL),(4,2,1,'no',NULL),(5,2,6,'justified',NULL),(6,3,5,'yes',NULL),(7,3,7,'yes',NULL),(8,3,1,'yes',NULL),(9,3,6,'no',NULL);
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_accounts` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `bank_name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `account_number` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `account_type` enum('savings','checking') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'savings',
  `initial_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_accounts`
--

LOCK TABLES `bank_accounts` WRITE;
/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
INSERT INTO `bank_accounts` VALUES (1,'Banco de Guayaquil','22056789','savings',0.00,'active','2026-08-18 15:55:41');
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `board_members`
--

DROP TABLE IF EXISTS `board_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board_members` (
  `board_id` int NOT NULL AUTO_INCREMENT,
  `administration_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`board_id`),
  KEY `user_id` (`user_id`),
  KEY `fk_board_admin` (`administration_id`),
  CONSTRAINT `board_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_board_admin` FOREIGN KEY (`administration_id`) REFERENCES `administrations` (`administration_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_members`
--

LOCK TABLES `board_members` WRITE;
/*!40000 ALTER TABLE `board_members` DISABLE KEYS */;
INSERT INTO `board_members` VALUES (1,1,5,'PRESIDENTE','2026-08-21',NULL,1),(2,1,1,'TESORERO','2026-08-21',NULL,1),(3,1,6,'SECRETARIA','2026-08-21',NULL,1);
/*!40000 ALTER TABLE `board_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debt_payments`
--

DROP TABLE IF EXISTS `debt_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `debt_payments` (
  `debt_payment_id` int NOT NULL AUTO_INCREMENT,
  `agreement_id` int NOT NULL,
  `system_user_id` int NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','transfer','deposit') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'cash',
  `account_id` int DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`debt_payment_id`),
  KEY `agreement_id` (`agreement_id`),
  KEY `system_user_id` (`system_user_id`),
  KEY `fk_debt_payments_account` (`account_id`),
  CONSTRAINT `debt_payments_ibfk_1` FOREIGN KEY (`agreement_id`) REFERENCES `payment_agreements` (`agreement_id`),
  CONSTRAINT `debt_payments_ibfk_2` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`),
  CONSTRAINT `fk_debt_payments_account` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debt_payments`
--

LOCK TABLES `debt_payments` WRITE;
/*!40000 ALTER TABLE `debt_payments` DISABLE KEYS */;
INSERT INTO `debt_payments` VALUES (1,1,1,200.00,'2026-08-17 11:09:40','cash',NULL,NULL),(2,1,1,100.00,'2026-08-18 11:12:34','transfer',1,'12398765'),(3,2,1,100.00,'2026-08-21 00:07:30','transfer',1,'456789'),(4,3,1,100.00,'2026-08-21 20:32:00','cash',NULL,''),(5,1,1,500.00,'2026-08-21 20:32:21','transfer',1,'123456');
/*!40000 ALTER TABLE `debt_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES (1,'sueldo aguatero','ninguno','2026-03-05 16:35:25'),(2,'ENERGIA ELECTRICA',NULL,'2026-03-05 16:44:16'),(3,'OTROS',NULL,'2026-03-05 16:44:25');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `expense_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int DEFAULT NULL,
  `system_user_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` date NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'cash',
  `reference_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `account_id` int DEFAULT NULL,
  PRIMARY KEY (`expense_id`),
  KEY `category_id` (`category_id`),
  KEY `fk_expenses_sysuser` (`system_user_id`),
  KEY `fk_expenses_account` (`account_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`category_id`),
  CONSTRAINT `fk_expenses_account` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`account_id`),
  CONSTRAINT `fk_expenses_sysuser` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,1,NULL,150.00,'2026-02-02','SUELDO AGUATERO','CASH','','2026-03-06 15:38:19',NULL),(2,2,NULL,89.00,'2026-02-28','NINGUNO','CASH','10835','2026-03-06 15:43:16',NULL),(3,3,1,24000.00,'2026-08-17','CORRECCIÓN CONTABLE POR ERROR DE TIPEO EN EL INGRESO EXTRAORDINARIO DEL DÍA X. SE DEVUELVEN $24.000 AL BALANCE','CASH',NULL,'2026-08-18 03:14:25',NULL),(4,2,1,50.00,'2026-08-18','PAGO DE COMPRA DE TUBOS','transfer','123456','2026-08-18 16:03:40',1),(5,3,1,1000.00,'2026-08-21','VENTA DE RAMAL POR EL USAURIO LEMA LUZMILA','cash','1234568','2026-08-21 16:08:31',1),(6,3,1,33.47,'2026-08-21','PAGO DE VENTA DE RAMAL','cash','45687','2026-08-21 16:14:39',1),(7,3,1,2.00,'2026-08-21','PAGO PARA LA PARROQUIALIZACION COCHAPAMBA','cash','','2026-08-22 02:02:27',NULL),(8,3,1,350.00,'2026-08-21','PAGO AL ING. JUAN PEREZ PARA LA REPARACION DE LA BOMBA SUMERGIBLE','deposit','45678','2026-08-22 02:03:29',1);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fine_configurations`
--

DROP TABLE IF EXISTS `fine_configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fine_configurations` (
  `config_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `fine_type` enum('session','minga') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'session',
  `default_amount` decimal(10,2) NOT NULL DEFAULT '5.00',
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_configurations`
--

LOCK TABLES `fine_configurations` WRITE;
/*!40000 ALTER TABLE `fine_configurations` DISABLE KEYS */;
INSERT INTO `fine_configurations` VALUES (2,'minga parciales','minga',20.00,NULL,'2026-08-20 03:35:41'),(3,'sesiones mensuales','session',5.00,NULL,'2026-08-20 03:37:00');
/*!40000 ALTER TABLE `fine_configurations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `income_categories`
--

DROP TABLE IF EXISTS `income_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `income_categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `income_categories`
--

LOCK TABLES `income_categories` WRITE;
/*!40000 ALTER TABLE `income_categories` DISABLE KEYS */;
INSERT INTO `income_categories` VALUES (1,'VENTA DE RAMAL','Ingresos por instalación o venta de ramales de agua','2026-05-30 15:33:26'),(2,'MULTA','Multas aplicadas a socios por incumplimiento','2026-05-30 15:33:26'),(3,'DONACIÓN','Donaciones recibidas de socios u organizaciones','2026-05-30 15:33:26'),(4,'CUOTA EXTRAORDINARIA','Cobros extraordinarios aprobados en reunión','2026-05-30 15:33:26'),(5,'OTROS','Otros ingresos no clasificados','2026-05-30 15:33:26'),(6,'VENTA DE RAMAL','Ingresos por instalación o venta de ramales de agua','2026-05-30 15:35:43'),(7,'MULTA','Multas aplicadas a socios por incumplimiento','2026-05-30 15:35:43'),(8,'DONACIÓN','Donaciones recibidas de socios u organizaciones','2026-05-30 15:35:43'),(9,'CUOTA EXTRAORDINARIA','Cobros extraordinarios aprobados en reunión','2026-05-30 15:35:43'),(10,'OTROS','Otros ingresos no clasificados','2026-05-30 15:35:43');
/*!40000 ALTER TABLE `income_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `unit_measure` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `current_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `minimum_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `condition_status` enum('new','good','needs_repair','discarded') COLLATE utf8mb4_general_ci DEFAULT 'new',
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (1,'LAPT-001','LAPTOP','PARA MANEJO DE CAJA','tools','unit',1.00,0.00,0.00,'new');
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_movements`
--

DROP TABLE IF EXISTS `inventory_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_movements` (
  `movement_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `system_user_id` int NOT NULL,
  `movement_type` enum('in','out') COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reference` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reference_description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `movement_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`movement_id`),
  KEY `item_id` (`item_id`),
  KEY `system_user_id` (`system_user_id`),
  CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`item_id`),
  CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_movements`
--

LOCK TABLES `inventory_movements` WRITE;
/*!40000 ALTER TABLE `inventory_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_concept`
--

DROP TABLE IF EXISTS `invoice_concept`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_concept` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `concept_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_id` (`invoice_id`,`concept_id`),
  KEY `concept_id` (`concept_id`),
  CONSTRAINT `invoice_concept_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`),
  CONSTRAINT `invoice_concept_ibfk_2` FOREIGN KEY (`concept_id`) REFERENCES `additional_concepts` (`concept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_concept`
--

LOCK TABLES `invoice_concept` WRITE;
/*!40000 ALTER TABLE `invoice_concept` DISABLE KEYS */;
INSERT INTO `invoice_concept` VALUES (5,17,2),(16,17,5),(4,20,2),(14,20,5),(21,20,7),(7,22,2),(13,22,5),(8,23,3),(15,23,5),(18,24,6),(20,25,6),(17,26,6),(19,27,6);
/*!40000 ALTER TABLE `invoice_concept` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `invoice_type` enum('water','legacy_debt','installation','other') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'water',
  `billing_month` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `issue_date` date NOT NULL DEFAULT (curdate()),
  `status` enum('pending','partial','paid','cancelled') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`invoice_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,2,'water','2026-01',NULL,6.85,'2026-01-31','paid'),(2,1,'water','2026-01',NULL,32.92,'2026-01-31','paid'),(3,3,'water','2026-01',NULL,2.04,'2026-01-31','paid'),(4,4,'water','2026-01',NULL,15.00,'2026-01-31','paid'),(5,3,'water','2026-02',NULL,25.09,'2026-02-01','paid'),(6,2,'water','2026-02',NULL,5.50,'2026-02-01','paid'),(7,1,'water','2026-02',NULL,22.93,'2026-02-01','paid'),(8,4,'water','2026-02',NULL,20.40,'2026-02-01','paid'),(9,5,'water','2026-01',NULL,34.00,'2026-01-31','paid'),(10,6,'water','2026-01',NULL,20.23,'2026-01-31','paid'),(11,7,'water','2026-02',NULL,29.41,'2026-02-01','paid'),(12,5,'water','2026-02',NULL,48.31,'2026-03-06','paid'),(13,6,'water','2026-02',NULL,17.80,'2026-03-06','paid'),(14,5,'water','2026-04',NULL,47.23,'2026-05-30','paid'),(15,7,'water','2026-04',NULL,7.00,'2026-05-30','paid'),(16,1,'water','2026-04',NULL,100.96,'2026-05-30','paid'),(17,7,'water','2026-08',NULL,23.26,'2026-08-17','paid'),(20,5,'water','2026-08','Factura Mensual',36.80,'2026-08-19','paid'),(22,1,'water','2026-08',NULL,13.00,'2026-08-19','paid'),(23,6,'water','2026-08','Factura Mensual',28.00,'2026-08-19','paid'),(24,5,'water','2026-09','Factura Mensual',2.00,'2026-08-20','pending'),(25,7,'water','2026-09','Factura Mensual',2.00,'2026-08-20','pending'),(26,1,'water','2026-09','Factura Mensual',2.00,'2026-08-20','pending'),(27,6,'water','2026-09','Factura Mensual',2.00,'2026-08-20','pending'),(28,2,'water','2026-08',NULL,30.76,'2026-08-20','paid'),(29,3,'water','2026-08',NULL,19.69,'2026-08-20','paid');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `meeting_id` int NOT NULL AUTO_INCREMENT,
  `reason` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `meeting_date` date NOT NULL,
  `minutes` text COLLATE utf8mb4_general_ci,
  `notes` text COLLATE utf8mb4_general_ci,
  `meeting_type` enum('session','minga') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'session',
  `fine_config_id` int DEFAULT NULL,
  `concept_id` int DEFAULT NULL,
  PRIMARY KEY (`meeting_id`),
  KEY `fk_meetings_fine_config` (`fine_config_id`),
  KEY `fk_meetings_concept` (`concept_id`),
  CONSTRAINT `fk_meetings_concept` FOREIGN KEY (`concept_id`) REFERENCES `additional_concepts` (`concept_id`),
  CONSTRAINT `fk_meetings_fine_config` FOREIGN KEY (`fine_config_id`) REFERENCES `fine_configurations` (`config_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
INSERT INTO `meetings` VALUES (2,'Sesión ordinaria','2026-08-20','','','session',3,2),(3,'minga de limpieza en cochapamba','2026-08-15','','','minga',2,3);
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meter_history`
--

DROP TABLE IF EXISTS `meter_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meter_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `meter_id` int NOT NULL,
  `user_id` int NOT NULL,
  `assignment_date` date NOT NULL,
  `removal_date` date DEFAULT NULL,
  `assigned` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`history_id`),
  KEY `meter_id` (`meter_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `meter_history_ibfk_1` FOREIGN KEY (`meter_id`) REFERENCES `meters` (`meter_id`),
  CONSTRAINT `meter_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meter_history`
--

LOCK TABLES `meter_history` WRITE;
/*!40000 ALTER TABLE `meter_history` DISABLE KEYS */;
INSERT INTO `meter_history` VALUES (1,1,1,'2026-01-31',NULL,1),(2,2,1,'2026-01-31',NULL,1),(3,3,2,'2026-01-31',NULL,1),(4,4,3,'2026-01-31',NULL,1),(5,5,4,'2026-01-31','2026-01-31',0),(6,6,3,'2026-01-31',NULL,1),(7,7,5,'2026-01-31',NULL,1),(8,8,5,'2026-01-31',NULL,1),(9,9,2,'2026-01-31',NULL,1),(10,10,6,'2026-01-31',NULL,1),(11,11,6,'2026-01-31',NULL,1),(12,5,4,'2026-01-31','2026-01-31',0),(13,5,4,'2026-01-31',NULL,1),(14,12,7,'2026-02-01',NULL,1),(15,13,7,'2026-02-01',NULL,1);
/*!40000 ALTER TABLE `meter_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meters`
--

DROP TABLE IF EXISTS `meters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meters` (
  `meter_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('consumo','riego') COLLATE utf8mb4_general_ci NOT NULL,
  `initial_reading` int NOT NULL,
  `installation_date` date NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`meter_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meters`
--

LOCK TABLES `meters` WRITE;
/*!40000 ALTER TABLE `meters` DISABLE KEYS */;
INSERT INTO `meters` VALUES (1,'MC-26-M8ZL','consumo',1569,'2026-01-31',1),(2,'MR-26-BP56','riego',7895,'2026-01-31',1),(3,'MR-26-O0FQ','riego',756,'2026-01-31',1),(4,'MC-26-ONCR','consumo',789,'2026-01-31',1),(5,'MC-26-XVZ4','consumo',500,'2026-01-31',1),(6,'MR-26-PVPP','riego',56,'2026-01-31',1),(7,'MC-26-E1EG','consumo',456,'2026-01-31',1),(8,'MR-26-F2SZ','riego',789,'2026-01-31',1),(9,'MC-26-HQ0Y','consumo',500,'2026-01-31',1),(10,'MC-26-1TYZ','consumo',2345,'2026-01-31',1),(11,'MR-26-KR17','riego',8956,'2026-01-31',1),(12,'MC-26-WZ9L','consumo',189,'2026-02-01',1),(13,'MR-26-KUWJ','riego',1987,'2026-02-01',1);
/*!40000 ALTER TABLE `meters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `other_incomes`
--

DROP TABLE IF EXISTS `other_incomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `other_incomes` (
  `income_id` int NOT NULL AUTO_INCREMENT,
  `system_user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `income_date` date NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `payment_method` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'cash',
  `reference_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `account_id` int DEFAULT NULL,
  PRIMARY KEY (`income_id`),
  KEY `system_user_id` (`system_user_id`),
  KEY `fk_other_incomes_account` (`account_id`),
  CONSTRAINT `fk_other_incomes_account` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`account_id`),
  CONSTRAINT `other_incomes_ibfk_1` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `other_incomes`
--

LOCK TABLES `other_incomes` WRITE;
/*!40000 ALTER TABLE `other_incomes` DISABLE KEYS */;
INSERT INTO `other_incomes` VALUES (1,1,25000.00,'2026-08-18','saldo anterior inicial','cash',NULL,'2026-08-18 01:56:12',NULL),(2,1,200.00,'2026-08-18','donación de dinero por el Alcalde Juan Perez','deposit','456899','2026-08-18 16:00:24',1),(3,1,600.00,'2026-08-21','colaboracion de los hijos d elos mimebros de que estan en eeuu','cash',NULL,'2026-08-21 15:39:12',NULL);
/*!40000 ALTER TABLE `other_incomes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_agreements`
--

DROP TABLE IF EXISTS `payment_agreements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_agreements` (
  `agreement_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `number_of_installments` int DEFAULT NULL,
  `installment_amount` decimal(10,2) DEFAULT NULL,
  `remaining_amount` decimal(10,2) NOT NULL,
  `start_month` varchar(7) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','completed','cancelled') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`agreement_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payment_agreements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_agreements`
--

LOCK TABLES `payment_agreements` WRITE;
/*!40000 ALTER TABLE `payment_agreements` DISABLE KEYS */;
INSERT INTO `payment_agreements` VALUES (1,7,'venta de ramal',1200.00,8,150.00,400.00,'2026-08','active','2026-08-17 15:12:27'),(2,6,'Deuda Histórica',500.00,NULL,NULL,400.00,NULL,'active','2026-08-21 05:06:34'),(3,7,'Deuda Histórica',120.00,NULL,NULL,20.00,NULL,'active','2026-08-21 05:15:27');
/*!40000 ALTER TABLE `payment_agreements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `system_user_id` int DEFAULT NULL,
  `payment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `invoice_amount` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `change_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `movement_type` enum('payment','partial') COLLATE utf8mb4_general_ci NOT NULL,
  `payment_method` enum('cash','transfer','card') COLLATE utf8mb4_general_ci NOT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `fk_payments_sysuser` (`system_user_id`),
  KEY `fk_payments_account` (`account_id`),
  CONSTRAINT `fk_payments_account` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`account_id`),
  CONSTRAINT `fk_payments_sysuser` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,2,NULL,'2026-01-31 17:36:12',32.92,40.00,7.08,'payment','cash',NULL,NULL),(2,1,NULL,'2026-01-31 17:38:43',6.85,10.00,3.15,'payment','cash',NULL,NULL),(3,3,NULL,'2026-01-31 17:44:33',2.04,2.50,0.46,'payment','cash',NULL,NULL),(4,8,NULL,'2026-02-01 17:52:16',20.40,20.40,0.00,'payment','cash',NULL,NULL),(5,4,NULL,'2026-02-01 17:52:16',15.00,19.60,4.60,'payment','cash',NULL,NULL),(6,7,NULL,'2026-02-01 17:54:44',22.93,25.00,2.07,'payment','cash',NULL,NULL),(7,5,NULL,'2026-02-01 17:57:18',25.09,25.09,0.00,'payment','cash',NULL,NULL),(8,6,NULL,'2026-02-01 17:57:32',5.50,6.00,0.50,'payment','cash',NULL,NULL),(9,9,NULL,'2026-01-31 21:35:00',34.00,40.00,6.00,'payment','cash',NULL,NULL),(10,10,NULL,'2026-01-31 23:38:19',20.23,21.00,0.77,'payment','cash',NULL,NULL),(11,11,NULL,'2026-02-01 00:11:18',29.41,30.00,0.59,'payment','cash',NULL,NULL),(12,12,NULL,'2026-03-06 11:14:36',48.31,50.00,1.69,'payment','cash',NULL,NULL),(13,13,NULL,'2026-03-06 11:15:28',17.80,20.00,2.20,'payment','cash',NULL,NULL),(14,14,NULL,'2026-05-30 10:46:19',47.23,50.00,2.77,'payment','cash',NULL,NULL),(15,15,NULL,'2026-05-30 10:51:39',7.00,10.00,3.00,'payment','cash',NULL,NULL),(16,16,NULL,'2026-05-30 10:52:01',100.96,110.00,9.04,'payment','cash',NULL,NULL),(24,20,1,'2026-08-20 11:20:25',36.80,40.00,3.20,'payment','cash','',NULL),(25,23,1,'2026-08-20 11:33:48',28.00,28.00,0.00,'payment','transfer','456789',1),(26,17,1,'2026-08-21 20:30:35',23.26,25.00,1.74,'payment','cash','',NULL),(27,22,1,'2026-08-21 20:30:56',13.00,20.00,7.00,'payment','cash','',NULL),(28,28,1,'2026-08-21 20:31:21',30.76,31.00,0.24,'payment','cash','',NULL),(29,29,1,'2026-08-21 20:31:40',19.69,20.00,0.31,'payment','cash','',NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rates`
--

DROP TABLE IF EXISTS `rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rates` (
  `rate_id` int NOT NULL AUTO_INCREMENT,
  `meter_type` enum('consumo','riego') COLLATE utf8mb4_general_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `base_limit` int NOT NULL,
  `excess_price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`rate_id`),
  CONSTRAINT `rates_chk_1` CHECK ((`base_limit` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rates`
--

LOCK TABLES `rates` WRITE;
/*!40000 ALTER TABLE `rates` DISABLE KEYS */;
INSERT INTO `rates` VALUES (1,'consumo',1.50,10,0.27,1,'2026-01-31','2026-01-31'),(2,'riego',5.50,20,0.27,1,'2026-01-31','9999-12-31');
/*!40000 ALTER TABLE `rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `readings`
--

DROP TABLE IF EXISTS `readings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `readings` (
  `reading_id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `meter_id` int NOT NULL,
  `rate_id` int NOT NULL,
  `month_year` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `previous_reading` int NOT NULL,
  `current_reading` int NOT NULL,
  `consumption` int NOT NULL,
  `excess` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`reading_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `meter_id` (`meter_id`),
  KEY `rate_id` (`rate_id`),
  CONSTRAINT `readings_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`),
  CONSTRAINT `readings_ibfk_2` FOREIGN KEY (`meter_id`) REFERENCES `meters` (`meter_id`),
  CONSTRAINT `readings_ibfk_3` FOREIGN KEY (`rate_id`) REFERENCES `rates` (`rate_id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `readings`
--

LOCK TABLES `readings` WRITE;
/*!40000 ALTER TABLE `readings` DISABLE KEYS */;
INSERT INTO `readings` VALUES (1,1,3,2,'2026-01',756,781,25,5,6.85),(2,2,1,1,'2026-01',1569,1629,60,50,15.00),(3,2,2,2,'2026-01',7895,7961,66,46,17.92),(4,3,4,1,'2026-01',789,801,12,2,2.04),(5,4,5,1,'2026-01',500,560,60,50,15.00),(6,5,4,1,'2026-01',801,856,55,45,13.65),(7,5,6,2,'2026-01',56,98,42,22,11.44),(8,6,3,2,'2026-01',781,801,20,0,5.50),(9,7,1,1,'2026-01',1629,1698,69,59,17.43),(10,7,2,2,'2026-01',7961,7980,19,0,5.50),(11,8,5,1,'2026-01',560,640,80,70,20.40),(12,9,7,1,'2026-01',456,500,44,34,10.68),(13,9,8,2,'2026-01',789,875,86,66,23.32),(14,10,10,1,'2026-01',2345,2400,55,45,13.65),(15,10,11,2,'2026-01',8956,8980,24,4,6.58),(16,11,12,1,'2026-01',189,200,11,1,1.77),(17,11,13,2,'2026-01',1987,2089,102,82,27.64),(18,12,7,1,'2026-02',500,650,150,140,39.30),(19,12,8,2,'2026-02',875,908,33,13,9.01),(20,13,10,1,'2026-02',2400,2450,50,40,12.30),(21,13,11,2,'2026-02',8980,8980,0,0,5.50),(22,14,7,1,'2026-04',650,750,100,90,25.80),(23,14,8,2,'2026-04',908,987,79,59,21.43),(24,15,12,1,'2026-04',200,201,1,0,1.50),(25,15,13,2,'2026-04',2089,2098,9,0,5.50),(26,16,1,1,'2026-04',1629,1987,358,348,95.46),(27,16,2,2,'2026-04',7961,7965,4,0,5.50),(28,17,12,1,'2026-08',201,206,5,0,1.50),(29,17,13,2,'2026-08',2098,2156,58,38,15.76),(30,22,1,1,'2026-08',1987,1990,3,0,1.50),(31,22,2,2,'2026-08',7965,7965,0,0,5.50),(32,23,10,1,'2026-08',2450,2459,9,0,1.50),(33,23,11,2,'2026-08',8980,8999,19,0,5.50),(34,20,7,1,'2026-08',750,800,50,40,12.30),(35,20,8,2,'2026-08',987,1000,13,0,5.50),(36,28,3,2,'2026-08',781,790,9,0,5.50),(37,28,9,1,'2026-08',500,598,98,88,25.26),(38,29,4,1,'2026-08',801,805,4,0,1.50),(39,29,6,2,'2026-08',98,165,67,47,18.19);
/*!40000 ALTER TABLE `readings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_users`
--

DROP TABLE IF EXISTS `system_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_users` (
  `system_user_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(655) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('admin','board','user','treasurer') COLLATE utf8mb4_general_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`system_user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `system_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_users`
--

LOCK TABLES `system_users` WRITE;
/*!40000 ALTER TABLE `system_users` DISABLE KEYS */;
INSERT INTO `system_users` VALUES (1,1,'0504686411','$2b$10$DP3/9T.L2kB2b1RMBlb3nuxjB62jKFFA2xjCCA.czuFTCDNKfIesa','user',1),(2,5,'1711328144','$2b$10$1t.BCPTyCPvnzFKK4jDHV.oDvLqrnaE5sQ6RT2/yuwRhGACPHnYE6','user',1),(3,6,'0502991821','$2b$10$660w7pYDdzbauSxbXZDQcuki50wUvdWPE7UJ2b1XDUn9uYvSoWgy2','user',1),(4,7,'0502949522','$2b$10$O3.dIM22/PWmt9RbvuC/JOsmAuWJGbIRX5yrbGFMRElJC4tt5BHmu','user',1),(5,8,'admin','$2b$10$O95DFL3KAX8CWS9BYh9bh.qYfl7buYEfOgLerM4siTIokvHPpyzH2','admin',1);
/*!40000 ALTER TABLE `system_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `national_id` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `registration_date` date NOT NULL DEFAULT (curdate()),
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `exempt_from_fines` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `national_id` (`national_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'0504686411','Diego Fernando','Pincha Lema','AV. Los Shyris y Quinga Lumba 1788 a 50m. De C.N.T','0991586128','pinchadiego8@gmail.com','2026-01-31',1,0),(2,'ESC-000001','MANUEL IGNACIO CONDULLE','ESCUELA',NULL,NULL,NULL,'2026-01-31',1,1),(3,'IGL-000001','DE DIOS MANANTIAL DE VIDA','IGLESIA',NULL,NULL,NULL,'2026-01-31',1,1),(4,'IGL-000002','REY DE LOS APOSTOLES','IGLESIA',NULL,NULL,NULL,'2026-01-31',1,1),(5,'1711328144','Jose Miguel','Guanoluisa Guanoquiza',NULL,NULL,NULL,'2026-01-31',1,0),(6,'0502991821','Jose Abelardo','Pincha Vargas',NULL,NULL,NULL,'2026-01-31',1,0),(7,'0502949522','MARIA LUZMILA','LEMA CHICAIZA',NULL,NULL,NULL,'2026-01-31',1,0),(8,'0000000000','ADMINISTRADOR','SISTEMA','Oficina Central','0999999999','admin@erpagua.com','2026-08-21',1,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'water_system'
--

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

-- Dump completed on 2026-08-29 18:27:58
