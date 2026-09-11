-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: localhost    Database: water_system_prod
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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

-- GTID PURGED LINE REMOVED

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_periods`
--

LOCK TABLES `accounting_periods` WRITE;
/*!40000 ALTER TABLE `accounting_periods` DISABLE KEYS */;
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
  `concept_type` enum('standard','fine','installment','discount') NOT NULL DEFAULT 'standard',
  `description` varchar(2000) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `applies_to` enum('all','user') NOT NULL,
  `application_month` varchar(100) NOT NULL,
  PRIMARY KEY (`concept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `additional_concepts`
--

LOCK TABLES `additional_concepts` WRITE;
/*!40000 ALTER TABLE `additional_concepts` DISABLE KEYS */;
INSERT INTO `additional_concepts` VALUES (1,'standard','Multas sesion',5.00,'user','2026-04'),(2,'standard','MULTA 12 MESES',60.00,'user','2026-04'),(3,'standard','multa minga',15.00,'user','2026-06'),(4,'standard','multa de sesion junio',5.00,'user','2026-06'),(5,'standard','multa junio 10 ',10.00,'user','2026-06');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrations`
--

LOCK TABLES `administrations` WRITE;
/*!40000 ALTER TABLE `administrations` DISABLE KEYS */;
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
  `attended` varchar(50) NOT NULL,
  `observations` text,
  PRIMARY KEY (`attendance_id`),
  KEY `meeting_id` (`meeting_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`meeting_id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_accounts`
--

LOCK TABLES `bank_accounts` WRITE;
/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
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
  `role` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`board_id`),
  KEY `user_id` (`user_id`),
  KEY `fk_board_admin` (`administration_id`),
  CONSTRAINT `board_members_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_board_admin` FOREIGN KEY (`administration_id`) REFERENCES `administrations` (`administration_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `board_members`
--

LOCK TABLES `board_members` WRITE;
/*!40000 ALTER TABLE `board_members` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debt_payments`
--

LOCK TABLES `debt_payments` WRITE;
/*!40000 ALTER TABLE `debt_payments` DISABLE KEYS */;
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
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
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
  `description` text,
  `payment_method` varchar(50) DEFAULT 'cash',
  `reference_number` varchar(100) DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`expense_id`),
  KEY `category_id` (`category_id`),
  KEY `fk_expenses_sysuser` (`system_user_id`),
  KEY `fk_expenses_account` (`account_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`category_id`),
  CONSTRAINT `fk_expenses_account` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`account_id`),
  CONSTRAINT `fk_expenses_sysuser` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
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
  `default_amount` decimal(10,2) NOT NULL DEFAULT '5.00',
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fine_configurations`
--

LOCK TABLES `fine_configurations` WRITE;
/*!40000 ALTER TABLE `fine_configurations` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `income_categories`
--

LOCK TABLES `income_categories` WRITE;
/*!40000 ALTER TABLE `income_categories` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_concept`
--

LOCK TABLES `invoice_concept` WRITE;
/*!40000 ALTER TABLE `invoice_concept` DISABLE KEYS */;
INSERT INTO `invoice_concept` VALUES (2,220,1),(1,222,1),(3,224,1),(6,230,2),(4,232,1),(7,236,2),(10,241,1),(8,242,1),(9,243,1),(11,248,1),(12,251,1),(13,275,1),(14,279,1),(27,367,5),(15,370,3),(26,379,5),(18,389,4),(20,401,4),(21,412,4),(23,426,5),(24,431,5);
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
  `invoice_type` enum('water','legacy_debt','installation','other') NOT NULL DEFAULT 'water',
  `billing_month` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `issue_date` date NOT NULL DEFAULT (curdate()),
  `status` enum('pending','partial','paid','cancelled') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`invoice_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=511 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,44,'water','2026-01',NULL,8.68,'2026-02-01','paid'),(2,10,'water','2026-01',NULL,7.28,'2026-02-01','paid'),(3,1,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(4,2,'water','2026-01',NULL,32.20,'2026-02-01','paid'),(5,59,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(6,4,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(7,6,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(8,25,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(9,26,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(10,15,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(11,58,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(12,16,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(13,56,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(14,8,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(15,61,'water','2026-01',NULL,5.50,'2026-02-01','paid'),(16,33,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(17,34,'water','2026-01',NULL,8.68,'2026-02-01','paid'),(18,32,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(19,35,'water','2026-01',NULL,10.08,'2026-02-01','paid'),(20,38,'water','2026-01',NULL,8.96,'2026-02-01','paid'),(21,55,'water','2026-01',NULL,20.44,'2026-02-01','paid'),(22,30,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(23,5,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(24,37,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(25,57,'water','2026-01',NULL,18.48,'2026-02-01','pending'),(26,60,'water','2026-01',NULL,8.96,'2026-02-01','paid'),(27,36,'water','2026-01',NULL,15.96,'2026-02-01','paid'),(28,22,'water','2026-01',NULL,8.40,'2026-02-01','paid'),(29,52,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(30,17,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(31,54,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(32,43,'water','2026-01',NULL,16.80,'2026-02-01','paid'),(33,27,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(34,3,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(35,28,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(36,14,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(37,23,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(38,7,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(39,19,'water','2026-01',NULL,10.08,'2026-02-01','paid'),(40,20,'water','2026-01',NULL,16.24,'2026-02-01','paid'),(41,53,'water','2026-01',NULL,9.52,'2026-02-01','paid'),(42,29,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(43,12,'water','2026-01',NULL,7.28,'2026-02-01','paid'),(44,13,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(45,39,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(46,31,'water','2026-01',NULL,1.50,'2026-02-01','paid'),(47,40,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(48,21,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(49,24,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(50,42,'water','2026-01',NULL,1.50,'2026-02-01','paid'),(51,18,'water','2026-01',NULL,12.04,'2026-02-01','paid'),(52,41,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(53,11,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(54,9,'water','2026-01',NULL,8.96,'2026-02-01','paid'),(55,51,'water','2026-01',NULL,1.50,'2026-02-01','paid'),(56,49,'water','2026-01',NULL,1.50,'2026-02-01','paid'),(57,50,'water','2026-01',NULL,1.50,'2026-02-01','paid'),(58,62,'water','2026-01',NULL,19.88,'2026-02-01','paid'),(59,64,'water','2026-01',NULL,9.52,'2026-02-01','paid'),(60,65,'water','2026-01',NULL,12.88,'2026-02-01','paid'),(61,63,'water','2026-01',NULL,7.28,'2026-02-01','paid'),(62,66,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(63,67,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(64,68,'water','2026-01',NULL,7.00,'2026-02-01','paid'),(65,73,'water','2026-01',NULL,7.00,'2026-03-08','paid'),(66,70,'water','2026-01',NULL,7.00,'2026-03-08','paid'),(67,71,'water','2026-01',NULL,7.00,'2026-03-08','paid'),(68,76,'water','2026-01',NULL,1.50,'2026-03-08','paid'),(69,72,'water','2026-01',NULL,1.50,'2026-03-08','paid'),(70,75,'water','2026-01',NULL,7.00,'2026-03-08','paid'),(71,74,'water','2026-01',NULL,7.00,'2026-03-08','paid'),(72,77,'water','2026-01',NULL,1.50,'2026-03-08','paid'),(73,44,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(74,10,'water','2026-02',NULL,9.52,'2026-03-08','paid'),(75,1,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(76,73,'water','2026-02',NULL,10.64,'2026-03-08','paid'),(77,2,'water','2026-02',NULL,7.56,'2026-03-08','paid'),(78,59,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(79,4,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(80,6,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(81,25,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(82,26,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(83,15,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(84,70,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(85,64,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(86,62,'water','2026-02',NULL,8.12,'2026-03-08','paid'),(87,58,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(88,65,'water','2026-02',NULL,7.56,'2026-03-08','paid'),(89,16,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(90,71,'water','2026-02',NULL,10.08,'2026-03-08','paid'),(91,56,'water','2026-02',NULL,9.52,'2026-03-08','paid'),(92,8,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(93,61,'water','2026-02',NULL,5.50,'2026-03-08','paid'),(94,76,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(95,33,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(96,34,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(97,32,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(98,35,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(99,38,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(100,30,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(101,5,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(102,37,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(103,72,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(104,57,'water','2026-02',NULL,1.50,'2026-03-08','pending'),(105,68,'water','2026-02',NULL,10.36,'2026-03-08','paid'),(106,60,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(107,36,'water','2026-02',NULL,7.28,'2026-03-08','paid'),(108,75,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(109,63,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(110,22,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(111,52,'water','2026-02',NULL,7.00,'2026-03-08','pending'),(112,17,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(113,54,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(114,43,'water','2026-02',NULL,8.12,'2026-03-08','paid'),(115,27,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(116,3,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(117,28,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(118,14,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(119,23,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(120,66,'water','2026-02',NULL,7.28,'2026-03-08','paid'),(121,7,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(122,19,'water','2026-02',NULL,7.56,'2026-03-08','paid'),(123,20,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(124,53,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(125,29,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(126,12,'water','2026-02',NULL,7.84,'2026-03-08','paid'),(127,13,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(128,67,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(129,39,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(130,77,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(131,31,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(132,40,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(133,74,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(134,21,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(135,24,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(136,42,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(137,18,'water','2026-02',NULL,7.28,'2026-03-08','paid'),(138,41,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(139,11,'water','2026-02',NULL,7.00,'2026-03-08','paid'),(140,9,'water','2026-02',NULL,8.68,'2026-03-08','paid'),(141,51,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(142,49,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(143,50,'water','2026-02',NULL,1.50,'2026-03-08','paid'),(144,78,'water','2026-01',NULL,7.00,'2026-03-08','pending'),(145,78,'water','2026-02',NULL,7.00,'2026-03-08','pending'),(146,55,'water','2026-02',NULL,8.68,'2026-03-08','paid'),(147,44,'water','2026-03',NULL,20.16,'2026-03-29','paid'),(148,7,'water','2026-03',NULL,15.96,'2026-03-29','paid'),(149,1,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(150,73,'water','2026-03',NULL,48.72,'2026-03-29','paid'),(151,10,'water','2026-03',NULL,14.56,'2026-03-29','paid'),(152,2,'water','2026-03',NULL,19.04,'2026-03-29','paid'),(153,59,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(154,4,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(155,6,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(156,25,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(157,26,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(158,70,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(159,15,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(160,64,'water','2026-03',NULL,21.00,'2026-03-29','paid'),(161,62,'water','2026-03',NULL,41.44,'2026-03-29','paid'),(162,58,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(163,65,'water','2026-03',NULL,14.84,'2026-03-29','paid'),(164,16,'water','2026-03',NULL,7.28,'2026-03-29','paid'),(165,71,'water','2026-03',NULL,7.28,'2026-03-29','paid'),(166,56,'water','2026-03',NULL,9.24,'2026-03-29','paid'),(167,8,'water','2026-03',NULL,7.28,'2026-03-29','paid'),(168,61,'water','2026-03',NULL,5.50,'2026-03-29','paid'),(169,76,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(170,34,'water','2026-03',NULL,10.36,'2026-03-29','paid'),(171,32,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(172,35,'water','2026-03',NULL,12.88,'2026-03-29','paid'),(173,38,'water','2026-03',NULL,10.08,'2026-03-29','paid'),(174,55,'water','2026-03',NULL,14.56,'2026-03-29','paid'),(175,30,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(176,78,'water','2026-03',NULL,7.00,'2026-03-29','pending'),(177,37,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(178,72,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(179,68,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(180,60,'water','2026-03',NULL,7.56,'2026-03-29','paid'),(181,67,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(182,36,'water','2026-03',NULL,8.40,'2026-03-29','paid'),(183,75,'water','2026-03',NULL,15.96,'2026-03-29','paid'),(184,63,'water','2026-03',NULL,15.68,'2026-03-29','paid'),(185,22,'water','2026-03',NULL,17.92,'2026-03-29','paid'),(186,52,'water','2026-03',NULL,7.00,'2026-03-29','pending'),(187,33,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(188,17,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(189,54,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(190,43,'water','2026-03',NULL,83.16,'2026-03-29','paid'),(191,27,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(192,3,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(193,28,'water','2026-03',NULL,10.64,'2026-03-29','paid'),(194,14,'water','2026-03',NULL,8.12,'2026-03-29','paid'),(195,23,'water','2026-03',NULL,19.60,'2026-03-29','paid'),(196,66,'water','2026-03',NULL,7.84,'2026-03-29','paid'),(197,19,'water','2026-03',NULL,8.68,'2026-03-29','paid'),(198,20,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(199,53,'water','2026-03',NULL,9.80,'2026-03-29','paid'),(200,29,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(201,12,'water','2026-03',NULL,7.28,'2026-03-29','paid'),(202,13,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(203,39,'water','2026-03',NULL,9.52,'2026-03-29','paid'),(204,77,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(205,31,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(206,40,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(207,74,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(208,5,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(209,21,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(210,24,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(211,42,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(212,18,'water','2026-03',NULL,8.12,'2026-03-29','paid'),(213,41,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(214,11,'water','2026-03',NULL,7.00,'2026-03-29','paid'),(215,9,'water','2026-03',NULL,8.40,'2026-03-29','paid'),(216,51,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(217,49,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(218,50,'water','2026-03',NULL,1.50,'2026-03-29','paid'),(219,44,'water','2026-04',NULL,19.32,'2026-05-03','paid'),(220,10,'water','2026-04',NULL,13.96,'2026-05-03','paid'),(221,1,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(222,73,'water','2026-04',NULL,25.72,'2026-05-03','paid'),(223,2,'water','2026-04',NULL,40.88,'2026-05-03','paid'),(224,59,'water','2026-04',NULL,12.00,'2026-05-03','paid'),(225,4,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(226,6,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(227,25,'water','2026-04',NULL,7.56,'2026-05-03','paid'),(228,26,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(229,15,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(230,70,'water','2026-04',NULL,67.00,'2026-05-03','paid'),(231,64,'water','2026-04',NULL,10.08,'2026-05-03','paid'),(232,62,'water','2026-04',NULL,28.52,'2026-05-03','paid'),(233,58,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(234,65,'water','2026-04',NULL,24.92,'2026-05-03','paid'),(235,16,'water','2026-04',NULL,7.28,'2026-05-03','paid'),(236,71,'water','2026-04',NULL,68.96,'2026-05-03','paid'),(237,56,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(238,8,'water','2026-04',NULL,10.64,'2026-05-03','paid'),(239,61,'water','2026-04',NULL,5.50,'2026-05-03','paid'),(240,76,'water','2026-04',NULL,1.50,'2026-05-03','paid'),(241,33,'water','2026-04',NULL,12.00,'2026-05-03','paid'),(242,34,'water','2026-04',NULL,12.84,'2026-05-03','paid'),(243,32,'water','2026-04',NULL,19.00,'2026-05-03','paid'),(244,35,'water','2026-04',NULL,14.00,'2026-05-03','paid'),(245,38,'water','2026-04',NULL,14.84,'2026-05-03','paid'),(246,55,'water','2026-04',NULL,13.44,'2026-05-03','paid'),(247,30,'water','2026-04',NULL,12.88,'2026-05-03','paid'),(248,78,'water','2026-04',NULL,12.00,'2026-05-03','pending'),(249,5,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(250,37,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(251,72,'water','2026-04',NULL,6.50,'2026-05-03','pending'),(252,68,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(253,60,'water','2026-04',NULL,11.20,'2026-05-03','paid'),(254,36,'water','2026-04',NULL,9.24,'2026-05-03','paid'),(255,75,'water','2026-04',NULL,20.72,'2026-05-03','paid'),(256,63,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(257,22,'water','2026-04',NULL,9.80,'2026-05-03','paid'),(258,52,'water','2026-04',NULL,7.00,'2026-05-03','pending'),(259,17,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(260,54,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(261,43,'water','2026-04',NULL,55.72,'2026-05-03','paid'),(262,27,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(263,3,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(264,28,'water','2026-04',NULL,10.08,'2026-05-03','paid'),(265,14,'water','2026-04',NULL,10.64,'2026-05-03','paid'),(266,23,'water','2026-04',NULL,8.40,'2026-05-03','paid'),(267,66,'water','2026-04',NULL,8.40,'2026-05-03','paid'),(268,7,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(269,19,'water','2026-04',NULL,9.52,'2026-05-03','paid'),(270,20,'water','2026-04',NULL,10.64,'2026-05-03','paid'),(271,53,'water','2026-04',NULL,8.40,'2026-05-03','paid'),(272,29,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(273,12,'water','2026-04',NULL,9.24,'2026-05-03','paid'),(274,13,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(275,67,'water','2026-04',NULL,12.84,'2026-05-03','paid'),(276,39,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(277,77,'water','2026-04',NULL,1.50,'2026-05-03','paid'),(278,31,'water','2026-04',NULL,2.06,'2026-05-03','paid'),(279,40,'water','2026-04',NULL,14.52,'2026-05-03','paid'),(280,74,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(281,21,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(282,24,'water','2026-04',NULL,7.28,'2026-05-03','paid'),(283,42,'water','2026-04',NULL,1.50,'2026-05-03','paid'),(284,18,'water','2026-04',NULL,7.84,'2026-05-03','paid'),(285,41,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(286,11,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(287,9,'water','2026-04',NULL,9.80,'2026-05-03','paid'),(288,51,'water','2026-04',NULL,1.50,'2026-05-03','paid'),(289,49,'water','2026-04',NULL,1.50,'2026-05-03','paid'),(290,50,'water','2026-04',NULL,1.50,'2026-05-03','paid'),(291,79,'water','2026-04',NULL,7.00,'2026-05-03','paid'),(292,44,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(293,10,'water','2026-05',NULL,8.40,'2026-05-31','paid'),(294,1,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(295,73,'water','2026-05',NULL,15.12,'2026-05-31','paid'),(296,2,'water','2026-05',NULL,13.16,'2026-05-31','paid'),(297,59,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(298,4,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(299,6,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(300,25,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(301,26,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(302,15,'water','2026-05',NULL,7.84,'2026-05-31','paid'),(303,70,'water','2026-05',NULL,7.28,'2026-05-31','paid'),(304,64,'water','2026-05',NULL,26.88,'2026-05-31','paid'),(305,62,'water','2026-05',NULL,53.20,'2026-05-31','paid'),(306,58,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(307,65,'water','2026-05',NULL,17.92,'2026-05-31','paid'),(308,16,'water','2026-05',NULL,10.08,'2026-05-31','paid'),(309,71,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(310,56,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(311,8,'water','2026-05',NULL,7.56,'2026-05-31','paid'),(312,61,'water','2026-05',NULL,5.50,'2026-05-31','pending'),(313,76,'water','2026-05',NULL,1.50,'2026-05-31','paid'),(314,33,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(315,34,'water','2026-05',NULL,8.96,'2026-05-31','paid'),(316,32,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(317,35,'water','2026-05',NULL,13.16,'2026-05-31','paid'),(318,38,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(319,55,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(320,30,'water','2026-05',NULL,15.96,'2026-05-31','paid'),(321,78,'water','2026-05',NULL,7.00,'2026-05-31','pending'),(322,5,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(323,37,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(324,72,'water','2026-05',NULL,1.50,'2026-05-31','pending'),(325,68,'water','2026-05',NULL,7.84,'2026-05-31','paid'),(326,60,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(327,36,'water','2026-05',NULL,14.84,'2026-05-31','paid'),(328,75,'water','2026-05',NULL,10.36,'2026-05-31','paid'),(329,63,'water','2026-05',NULL,8.40,'2026-05-31','paid'),(330,22,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(331,52,'water','2026-05',NULL,7.00,'2026-05-31','pending'),(332,17,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(333,54,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(334,43,'water','2026-05',NULL,22.68,'2026-05-31','paid'),(335,27,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(336,3,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(337,79,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(338,28,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(339,14,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(340,23,'water','2026-05',NULL,9.24,'2026-05-31','paid'),(341,66,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(342,7,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(343,19,'water','2026-05',NULL,15.12,'2026-05-31','paid'),(344,20,'water','2026-05',NULL,10.92,'2026-05-31','paid'),(345,53,'water','2026-05',NULL,13.44,'2026-05-31','paid'),(346,29,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(347,12,'water','2026-05',NULL,8.68,'2026-05-31','paid'),(348,13,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(349,67,'water','2026-05',NULL,8.12,'2026-05-31','paid'),(350,39,'water','2026-05',NULL,9.80,'2026-05-31','paid'),(351,77,'water','2026-05',NULL,1.50,'2026-05-31','paid'),(352,31,'water','2026-05',NULL,1.50,'2026-05-31','paid'),(353,40,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(354,74,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(355,21,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(356,24,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(357,42,'water','2026-05',NULL,1.50,'2026-05-31','paid'),(358,18,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(359,41,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(360,11,'water','2026-05',NULL,7.00,'2026-05-31','paid'),(361,9,'water','2026-05',NULL,12.04,'2026-05-31','paid'),(362,51,'water','2026-05',NULL,1.50,'2026-05-31','paid'),(363,49,'water','2026-05',NULL,2.62,'2026-05-31','paid'),(364,50,'water','2026-05',NULL,1.50,'2026-05-31','paid'),(365,44,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(366,10,'water','2026-06',NULL,7.84,'2026-07-04','paid'),(367,1,'water','2026-06',NULL,17.00,'2026-07-04','paid'),(368,73,'water','2026-06',NULL,10.64,'2026-07-04','paid'),(369,2,'water','2026-06',NULL,9.52,'2026-07-04','paid'),(370,59,'water','2026-06',NULL,23.68,'2026-07-04','paid'),(371,4,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(372,6,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(373,25,'water','2026-06',NULL,8.12,'2026-07-04','paid'),(374,26,'water','2026-06',NULL,10.64,'2026-07-04','paid'),(375,15,'water','2026-06',NULL,7.56,'2026-07-04','paid'),(376,70,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(377,64,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(378,62,'water','2026-06',NULL,8.96,'2026-07-04','paid'),(379,58,'water','2026-06',NULL,17.00,'2026-07-04','paid'),(380,65,'water','2026-06',NULL,8.68,'2026-07-04','paid'),(381,16,'water','2026-06',NULL,8.96,'2026-07-04','paid'),(382,71,'water','2026-06',NULL,10.64,'2026-07-04','paid'),(383,56,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(384,8,'water','2026-06',NULL,7.84,'2026-07-04','paid'),(385,61,'water','2026-06',NULL,5.50,'2026-07-04','pending'),(386,76,'water','2026-06',NULL,1.50,'2026-07-04','paid'),(387,33,'water','2026-06',NULL,17.92,'2026-07-04','paid'),(388,34,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(389,32,'water','2026-06',NULL,12.00,'2026-07-04','paid'),(390,35,'water','2026-06',NULL,7.56,'2026-07-04','paid'),(391,38,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(392,55,'water','2026-06',NULL,15.68,'2026-07-04','paid'),(393,30,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(394,78,'water','2026-06',NULL,7.00,'2026-07-04','pending'),(395,5,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(396,37,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(397,72,'water','2026-06',NULL,1.50,'2026-07-04','pending'),(398,68,'water','2026-06',NULL,8.40,'2026-07-04','paid'),(399,60,'water','2026-06',NULL,7.84,'2026-07-04','paid'),(400,36,'water','2026-06',NULL,8.96,'2026-07-04','paid'),(401,75,'water','2026-06',NULL,12.28,'2026-07-04','paid'),(402,63,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(403,22,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(404,52,'water','2026-06',NULL,7.00,'2026-07-04','pending'),(405,17,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(406,54,'water','2026-06',NULL,7.56,'2026-07-04','paid'),(407,43,'water','2026-06',NULL,9.80,'2026-07-04','paid'),(408,27,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(409,3,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(410,79,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(411,28,'water','2026-06',NULL,10.08,'2026-07-04','paid'),(412,14,'water','2026-06',NULL,12.28,'2026-07-04','paid'),(413,23,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(414,66,'water','2026-06',NULL,7.56,'2026-07-04','paid'),(415,7,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(416,19,'water','2026-06',NULL,10.36,'2026-07-04','paid'),(417,20,'water','2026-06',NULL,9.24,'2026-07-04','paid'),(418,53,'water','2026-06',NULL,7.84,'2026-07-04','paid'),(419,29,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(420,12,'water','2026-06',NULL,17.92,'2026-07-04','paid'),(421,13,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(422,67,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(423,39,'water','2026-06',NULL,9.80,'2026-07-04','paid'),(424,77,'water','2026-06',NULL,1.50,'2026-07-04','paid'),(425,31,'water','2026-06',NULL,1.50,'2026-07-04','paid'),(426,40,'water','2026-06',NULL,17.00,'2026-07-04','paid'),(427,74,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(428,21,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(429,24,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(430,42,'water','2026-06',NULL,1.50,'2026-07-04','paid'),(431,18,'water','2026-06',NULL,19.24,'2026-07-04','paid'),(432,41,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(433,11,'water','2026-06',NULL,7.00,'2026-07-04','paid'),(434,9,'water','2026-06',NULL,15.96,'2026-07-04','paid'),(435,51,'water','2026-06',NULL,1.50,'2026-07-04','paid'),(436,49,'water','2026-06',NULL,1.50,'2026-07-04','paid'),(437,50,'water','2026-06',NULL,1.50,'2026-07-04','paid'),(438,44,'water','2026-07',NULL,7.00,'2026-08-01','paid'),(439,10,'water','2026-07',NULL,8.68,'2026-08-01','pending'),(440,1,'water','2026-07',NULL,7.00,'2026-08-01','pending'),(441,73,'water','2026-07',NULL,7.00,'2026-08-01','pending'),(442,2,'water','2026-07',NULL,18.48,'2026-08-01','paid'),(443,59,'water','2026-07',NULL,7.00,'2026-08-01','pending'),(444,4,'water','2026-07',NULL,7.00,'2026-08-01','paid'),(445,6,'water','2026-07',NULL,10.92,'2026-08-01','paid'),(446,25,'water','2026-07',NULL,7.84,'2026-08-01','paid'),(447,26,'water','2026-07',NULL,24.92,'2026-08-01','pending'),(448,15,'water','2026-07',NULL,7.00,'2026-08-01','paid'),(449,70,'water','2026-07',NULL,7.00,'2026-08-01','paid'),(450,64,'water','2026-07',NULL,21.56,'2026-08-01','paid'),(451,62,'water','2026-07',NULL,7.56,'2026-08-01','paid'),(452,58,'water','2026-07',NULL,7.00,'2026-08-01','paid'),(453,65,'water','2026-07',NULL,8.12,'2026-08-02','paid'),(454,16,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(455,71,'water','2026-07',NULL,14.00,'2026-08-02','paid'),(456,56,'water','2026-07',NULL,7.00,'2026-08-02','pending'),(457,8,'water','2026-07',NULL,9.24,'2026-08-02','paid'),(458,61,'water','2026-07',NULL,5.50,'2026-08-02','pending'),(459,76,'water','2026-07',NULL,1.50,'2026-08-02','paid'),(460,33,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(461,34,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(462,32,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(463,35,'water','2026-07',NULL,7.56,'2026-08-02','paid'),(464,38,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(465,55,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(466,30,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(467,78,'water','2026-07',NULL,7.00,'2026-08-02','pending'),(468,5,'water','2026-07',NULL,7.00,'2026-08-02','pending'),(469,37,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(470,72,'water','2026-07',NULL,1.50,'2026-08-02','pending'),(471,68,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(472,60,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(473,36,'water','2026-07',NULL,7.56,'2026-08-02','paid'),(474,75,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(475,63,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(476,22,'water','2026-07',NULL,7.84,'2026-08-02','paid'),(477,52,'water','2026-07',NULL,7.00,'2026-08-02','pending'),(478,17,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(479,54,'water','2026-07',NULL,9.52,'2026-08-02','paid'),(480,43,'water','2026-07',NULL,10.64,'2026-08-02','paid'),(481,27,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(482,3,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(483,28,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(484,14,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(485,23,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(486,66,'water','2026-07',NULL,8.12,'2026-08-02','paid'),(487,7,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(488,19,'water','2026-07',NULL,8.96,'2026-08-02','paid'),(489,20,'water','2026-07',NULL,8.68,'2026-08-02','paid'),(490,53,'water','2026-07',NULL,8.68,'2026-08-02','paid'),(491,29,'water','2026-07',NULL,7.00,'2026-08-02','pending'),(492,12,'water','2026-07',NULL,16.52,'2026-08-02','paid'),(493,13,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(494,67,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(495,39,'water','2026-07',NULL,7.28,'2026-08-02','paid'),(496,77,'water','2026-07',NULL,1.50,'2026-08-02','paid'),(497,31,'water','2026-07',NULL,1.50,'2026-08-02','paid'),(498,40,'water','2026-07',NULL,10.36,'2026-08-02','paid'),(499,74,'water','2026-07',NULL,7.00,'2026-08-02','pending'),(500,21,'water','2026-07',NULL,7.00,'2026-08-02','pending'),(501,24,'water','2026-07',NULL,8.68,'2026-08-02','paid'),(502,42,'water','2026-07',NULL,1.50,'2026-08-02','paid'),(503,18,'water','2026-07',NULL,7.56,'2026-08-02','paid'),(504,41,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(505,11,'water','2026-07',NULL,7.00,'2026-08-02','paid'),(506,9,'water','2026-07',NULL,10.08,'2026-08-02','paid'),(507,51,'water','2026-07',NULL,1.50,'2026-08-02','paid'),(508,49,'water','2026-07',NULL,1.50,'2026-08-02','paid'),(509,50,'water','2026-07',NULL,1.50,'2026-08-02','paid'),(510,79,'water','2026-07',NULL,7.00,'2026-08-02','paid');
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
  `reason` varchar(255) NOT NULL,
  `meeting_date` date NOT NULL,
  `minutes` text,
  `notes` text,
  `meeting_type` enum('session','minga') NOT NULL DEFAULT 'session',
  `fine_config_id` int DEFAULT NULL,
  `fine_amount` decimal(10,2) NOT NULL DEFAULT '5.00',
  `concept_id` int DEFAULT NULL,
  PRIMARY KEY (`meeting_id`),
  KEY `fk_meetings_fine_config` (`fine_config_id`),
  KEY `fk_meetings_concept` (`concept_id`),
  CONSTRAINT `fk_meetings_concept` FOREIGN KEY (`concept_id`) REFERENCES `additional_concepts` (`concept_id`),
  CONSTRAINT `fk_meetings_fine_config` FOREIGN KEY (`fine_config_id`) REFERENCES `fine_configurations` (`config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meter_history`
--

LOCK TABLES `meter_history` WRITE;
/*!40000 ALTER TABLE `meter_history` DISABLE KEYS */;
INSERT INTO `meter_history` VALUES (1,1,44,'2026-02-01',NULL,1),(2,2,44,'2026-02-01',NULL,1),(3,3,10,'2026-02-01',NULL,1),(4,4,10,'2026-02-01',NULL,1),(5,5,1,'2026-02-01',NULL,1),(6,6,1,'2026-02-01',NULL,1),(7,7,2,'2026-02-01',NULL,1),(8,8,2,'2026-02-01',NULL,1),(9,9,59,'2026-02-01',NULL,1),(10,10,59,'2026-02-01',NULL,1),(11,11,4,'2026-02-01',NULL,1),(12,12,4,'2026-02-01',NULL,1),(13,13,6,'2026-02-01',NULL,1),(14,14,6,'2026-02-01',NULL,1),(15,15,25,'2026-02-01',NULL,1),(16,16,25,'2026-02-01',NULL,1),(17,17,26,'2026-02-01',NULL,1),(18,18,26,'2026-02-01',NULL,1),(19,19,15,'2026-02-01',NULL,1),(20,20,15,'2026-02-01',NULL,1),(21,21,58,'2026-02-01',NULL,1),(22,22,58,'2026-02-01',NULL,1),(23,23,16,'2026-02-01',NULL,1),(24,24,16,'2026-02-01',NULL,1),(25,25,56,'2026-02-01',NULL,1),(26,26,56,'2026-02-01',NULL,1),(27,27,8,'2026-02-01',NULL,1),(28,28,8,'2026-02-01',NULL,1),(30,30,61,'2026-02-01',NULL,1),(31,31,33,'2026-02-01',NULL,1),(32,32,33,'2026-02-01',NULL,1),(33,33,34,'2026-02-01',NULL,1),(34,34,34,'2026-02-01',NULL,1),(35,35,32,'2026-02-01',NULL,1),(36,36,32,'2026-02-01',NULL,1),(37,37,35,'2026-02-01',NULL,1),(38,38,35,'2026-02-01',NULL,1),(39,39,38,'2026-02-01',NULL,1),(40,40,38,'2026-02-01',NULL,1),(41,41,55,'2026-02-01',NULL,1),(42,42,55,'2026-02-01',NULL,1),(43,43,30,'2026-02-01',NULL,1),(44,44,30,'2026-02-01',NULL,1),(45,45,5,'2026-02-01',NULL,1),(46,46,5,'2026-02-01',NULL,1),(47,47,37,'2026-02-01',NULL,1),(48,48,37,'2026-02-01',NULL,1),(49,49,57,'2026-02-01',NULL,1),(50,50,57,'2026-02-01',NULL,1),(51,51,60,'2026-02-01',NULL,1),(52,52,60,'2026-02-01',NULL,1),(53,53,36,'2026-02-01',NULL,1),(54,54,36,'2026-02-01',NULL,1),(55,55,22,'2026-02-01',NULL,1),(56,56,22,'2026-02-01',NULL,1),(57,57,52,'2026-02-01',NULL,1),(58,58,52,'2026-02-01',NULL,1),(59,59,17,'2026-02-01',NULL,1),(60,60,17,'2026-02-01',NULL,1),(61,61,54,'2026-02-01',NULL,1),(62,62,54,'2026-02-01',NULL,1),(63,63,43,'2026-02-01',NULL,1),(64,64,43,'2026-02-01',NULL,1),(65,65,27,'2026-02-01',NULL,1),(66,66,27,'2026-02-01',NULL,1),(67,67,3,'2026-02-01',NULL,1),(68,68,3,'2026-02-01',NULL,1),(69,69,28,'2026-02-01',NULL,1),(70,70,28,'2026-02-01',NULL,1),(71,71,14,'2026-02-01',NULL,1),(72,72,14,'2026-02-01',NULL,1),(73,73,23,'2026-02-01',NULL,1),(74,74,23,'2026-02-01',NULL,1),(75,75,7,'2026-02-01',NULL,1),(76,76,7,'2026-02-01',NULL,1),(77,77,19,'2026-02-01',NULL,1),(78,78,19,'2026-02-01',NULL,1),(79,79,20,'2026-02-01',NULL,1),(80,80,20,'2026-02-01',NULL,1),(81,81,53,'2026-02-01',NULL,1),(82,82,53,'2026-02-01',NULL,1),(83,83,29,'2026-02-01',NULL,1),(84,84,29,'2026-02-01',NULL,1),(85,85,12,'2026-02-01',NULL,1),(86,86,12,'2026-02-01',NULL,1),(87,87,13,'2026-02-01',NULL,1),(88,88,13,'2026-02-01',NULL,1),(89,89,39,'2026-02-01','2026-07-05',0),(90,90,39,'2026-02-01',NULL,1),(91,91,31,'2026-02-01',NULL,1),(92,92,40,'2026-02-01',NULL,1),(93,93,40,'2026-02-01',NULL,1),(94,94,21,'2026-02-01',NULL,1),(95,95,21,'2026-02-01',NULL,1),(96,96,24,'2026-02-01',NULL,1),(97,97,24,'2026-02-01',NULL,1),(98,98,42,'2026-02-01',NULL,1),(99,99,18,'2026-02-01',NULL,1),(100,100,18,'2026-02-01',NULL,1),(101,101,41,'2026-02-01',NULL,1),(102,102,41,'2026-02-01',NULL,1),(103,103,11,'2026-02-01',NULL,1),(104,104,11,'2026-02-01',NULL,1),(105,105,9,'2026-02-01',NULL,1),(106,106,9,'2026-02-01',NULL,1),(107,107,51,'2026-02-01',NULL,1),(108,108,49,'2026-02-01',NULL,1),(109,109,50,'2026-02-01',NULL,1),(110,110,62,'2026-02-01',NULL,1),(111,111,62,'2026-02-01',NULL,1),(112,112,63,'2026-02-01',NULL,1),(113,113,63,'2026-02-01',NULL,1),(114,114,64,'2026-02-01',NULL,1),(115,115,65,'2026-02-01',NULL,1),(116,116,65,'2026-02-01',NULL,1),(117,117,64,'2026-02-01',NULL,1),(118,118,66,'2026-02-01',NULL,1),(119,119,66,'2026-02-01',NULL,1),(120,120,67,'2026-02-01',NULL,1),(121,121,67,'2026-02-01',NULL,1),(122,122,68,'2026-02-01',NULL,1),(123,123,68,'2026-02-01',NULL,1),(124,124,73,'2026-03-08',NULL,1),(125,125,73,'2026-03-08',NULL,1),(126,126,70,'2026-03-08',NULL,1),(127,127,70,'2026-03-08',NULL,1),(128,128,71,'2026-03-08',NULL,1),(129,129,71,'2026-03-08',NULL,1),(130,130,76,'2026-03-08',NULL,1),(131,131,72,'2026-03-08',NULL,1),(132,132,75,'2026-03-08',NULL,1),(133,133,75,'2026-03-08',NULL,1),(134,134,74,'2026-03-08',NULL,1),(135,135,74,'2026-03-08',NULL,1),(136,136,77,'2026-03-08',NULL,1),(137,137,78,'2026-03-08',NULL,1),(138,138,78,'2026-03-08',NULL,1),(139,139,79,'2026-05-03',NULL,1),(140,140,79,'2026-05-03',NULL,1),(141,141,39,'2026-07-05',NULL,1);
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
  `code` varchar(50) NOT NULL,
  `type` enum('consumo','riego') NOT NULL,
  `initial_reading` int NOT NULL,
  `installation_date` date NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`meter_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meters`
--

LOCK TABLES `meters` WRITE;
/*!40000 ALTER TABLE `meters` DISABLE KEYS */;
INSERT INTO `meters` VALUES (1,'MC-26-VO9O','consumo',541,'2026-02-01',1),(2,'MR-26-U8ZC','riego',2276,'2026-02-01',1),(3,'MC-26-UHH4','consumo',833,'2026-02-01',1),(4,'MR-26-JF8S','riego',1294,'2026-02-01',1),(5,'MC-26-QFWI','consumo',279,'2026-02-01',1),(6,'MR-26-TU8E','riego',1666,'2026-02-01',1),(7,'MC-26-BEYK','consumo',1173,'2026-02-01',1),(8,'MR-26-OFWY','riego',629,'2026-02-01',1),(9,'MC-26-H94S','consumo',133,'2026-02-01',1),(10,'MR-26-HMOC','riego',1,'2026-02-01',1),(11,'MC-26-9VDZ','consumo',21,'2026-02-01',1),(12,'MR-26-SM8H','riego',30,'2026-02-01',1),(13,'MC-26-ZHCW','consumo',180,'2026-02-01',1),(14,'MR-26-X7SY','riego',535,'2026-02-01',1),(15,'MC-26-N0WJ','consumo',975,'2026-02-01',1),(16,'MR-26-SQZY','riego',1628,'2026-02-01',1),(17,'MC-26-CE54','consumo',284,'2026-02-01',1),(18,'MR-26-GYID','riego',1130,'2026-02-01',1),(19,'MC-26-1GU2','consumo',571,'2026-02-01',1),(20,'MR-26-G8QG','riego',986,'2026-02-01',1),(21,'MC-26-JVRF','consumo',1,'2026-02-01',1),(22,'MR-26-OZ4L','riego',1,'2026-02-01',1),(23,'MC-26-55TK','consumo',512,'2026-02-01',1),(24,'MR-26-BKHV','riego',1092,'2026-02-01',1),(25,'MC-26-GRYI','consumo',1,'2026-02-01',1),(26,'MR-26-GDNT','riego',1920,'2026-02-01',1),(27,'MC-26-DCVC','consumo',272,'2026-02-01',1),(28,'MR-26-BS5P','riego',440,'2026-02-01',1),(30,'MR-26-844R','riego',1,'2026-02-01',1),(31,'MC-26-TOPC','consumo',70,'2026-02-01',1),(32,'MR-26-LTB7','riego',1,'2026-02-01',1),(33,'MC-26-O4E4','consumo',15,'2026-02-01',1),(34,'MR-26-W9G1','riego',1136,'2026-02-01',1),(35,'MC-26-5V6K','consumo',245,'2026-02-01',1),(36,'MR-26-K0IL','riego',1263,'2026-02-01',1),(37,'MC-26-6TP7','consumo',623,'2026-02-01',1),(38,'MR-26-XY1V','riego',1223,'2026-02-01',1),(39,'MC-26-EQ3D','consumo',776,'2026-02-01',1),(40,'MR-26-QQR6','riego',2396,'2026-02-01',1),(41,'MC-26-TASM','consumo',172,'2026-02-01',1),(42,'MR-26-XEHZ','riego',3050,'2026-02-01',1),(43,'MC-26-P8B6','consumo',189,'2026-02-01',1),(44,'MR-26-5LTA','riego',586,'2026-02-01',1),(45,'MC-26-HMD8','consumo',1,'2026-02-01',1),(46,'MR-26-8YCK','riego',1,'2026-02-01',1),(47,'MC-26-UZTB','consumo',168,'2026-02-01',1),(48,'MR-26-SJFV','riego',1,'2026-02-01',1),(49,'MC-26-LABY','consumo',25,'2026-02-01',1),(50,'MR-26-8RD2','riego',1473,'2026-02-01',1),(51,'MC-26-EIIU','consumo',30,'2026-02-01',1),(52,'MR-26-Z1V5','riego',1072,'2026-02-01',1),(53,'MC-26-E7SM','consumo',742,'2026-02-01',1),(54,'MR-26-MWTP','riego',2526,'2026-02-01',1),(55,'MC-26-7BSW','consumo',728,'2026-02-01',1),(56,'MR-26-CQNC','riego',3472,'2026-02-01',1),(57,'MC-26-0IB3','consumo',1,'2026-02-01',1),(58,'MR-26-69U1','riego',1,'2026-02-01',1),(59,'MC-26-ORLD','consumo',371,'2026-02-01',1),(60,'MR-26-ULIY','riego',1,'2026-02-01',1),(61,'MC-26-2YU2','consumo',351,'2026-02-01',1),(62,'MR-26-GMX2','riego',962,'2026-02-01',1),(63,'MC-26-VDAR','consumo',961,'2026-02-01',1),(64,'MR-26-V98J','riego',5681,'2026-02-01',1),(65,'MC-26-BHMN','consumo',480,'2026-02-01',1),(66,'MR-26-0YJB','riego',1141,'2026-02-01',1),(67,'MC-26-P8VL','consumo',680,'2026-02-01',1),(68,'MR-26-0VGN','riego',1509,'2026-02-01',1),(69,'MC-26-IGRP','consumo',528,'2026-02-01',1),(70,'MR-26-8600','riego',1955,'2026-02-01',1),(71,'MC-26-F626','consumo',557,'2026-02-01',1),(72,'MR-26-JURP','riego',870,'2026-02-01',1),(73,'MC-26-CRDX','consumo',728,'2026-02-01',1),(74,'MR-26-8WUU','riego',3132,'2026-02-01',1),(75,'MC-26-0UES','consumo',477,'2026-02-01',1),(76,'MR-26-G4MM','riego',2032,'2026-02-01',1),(77,'MC-26-FE6B','consumo',1276,'2026-02-01',1),(78,'MR-26-GV2K','riego',2101,'2026-02-01',1),(79,'MC-26-JSRX','consumo',801,'2026-02-01',1),(80,'MR-26-F0R9','riego',1429,'2026-02-01',1),(81,'MC-26-TJ3B','consumo',1,'2026-02-01',1),(82,'MR-26-SU25','riego',1476,'2026-02-01',1),(83,'MC-26-RZ7L','consumo',228,'2026-02-01',1),(84,'MR-26-E4VC','riego',1212,'2026-02-01',1),(85,'MC-26-3N8B','consumo',1027,'2026-02-01',1),(86,'MR-26-AVDG','riego',51,'2026-02-01',1),(87,'MC-26-OAJJ','consumo',398,'2026-02-01',1),(88,'MR-26-YTEE','riego',1,'2026-02-01',1),(89,'MC-26-LXQI','consumo',500,'2026-02-01',1),(90,'MR-26-YK4I','riego',2333,'2026-02-01',1),(91,'MC-26-NXFP','consumo',559,'2026-02-01',1),(92,'MR-26-1E7H','riego',829,'2026-02-01',1),(93,'MC-26-3SJN','consumo',1,'2026-02-01',1),(94,'MC-26-FTNI','consumo',97,'2026-02-01',1),(95,'MR-26-5QDF','riego',24,'2026-02-01',1),(96,'MC-26-L3OY','consumo',466,'2026-02-01',1),(97,'MR-26-V9MT','riego',1890,'2026-02-01',1),(98,'MC-26-PFPK','consumo',582,'2026-02-01',1),(99,'MC-26-K6MJ','consumo',983,'2026-02-01',1),(100,'MR-26-ANG7','riego',2091,'2026-02-01',1),(101,'MC-26-B1WL','consumo',1,'2026-02-01',1),(102,'MR-26-9GUU','riego',1,'2026-02-01',1),(103,'MC-26-LWLG','consumo',295,'2026-02-01',1),(104,'MR-26-WTWH','riego',1,'2026-02-01',1),(105,'MC-26-T3TK','consumo',1123,'2026-02-01',1),(106,'MR-26-JB7D','riego',2159,'2026-02-01',1),(107,'MC-26-Y4AV','consumo',1655,'2026-02-01',1),(108,'MC-26-IHZ6','consumo',261,'2026-02-01',1),(109,'MC-26-S82C','consumo',25,'2026-02-01',1),(110,'MC-26-K07M','consumo',590,'2026-02-01',1),(111,'MR-26-748C','riego',2728,'2026-02-01',1),(112,'MC-26-748I','consumo',892,'2026-02-01',1),(113,'MR-26-3BY3','riego',2140,'2026-02-01',1),(114,'MR-26-7P2Z','riego',1917,'2026-02-01',1),(115,'MC-26-M8F5','consumo',2005,'2026-02-01',1),(116,'MR-26-ZXAY','riego',1,'2026-02-01',1),(117,'MC-26-8KXW','consumo',1,'2026-02-01',1),(118,'MC-26-8WTS','consumo',831,'2026-02-01',1),(119,'MR-26-AFZJ','riego',1571,'2026-02-01',1),(120,'MC-26-9W8Q','consumo',165,'2026-02-01',1),(121,'MR-26-4X02','riego',267,'2026-02-01',1),(122,'MC-26-VT4P','consumo',523,'2026-02-01',1),(123,'MR-26-ZVMZ','riego',37,'2026-02-01',1),(124,'MC-26-0MD7','consumo',1,'2026-03-08',1),(125,'MR-26-6N8O','riego',1666,'2026-03-08',1),(126,'MC-26-1GVQ','consumo',195,'2026-03-08',1),(127,'MR-26-2YCC','riego',1465,'2026-03-08',1),(128,'MC-26-AUSR','consumo',340,'2026-03-08',1),(129,'MR-26-01UG','riego',778,'2026-03-08',1),(130,'MC-26-2S5B','consumo',544,'2026-03-08',1),(131,'MC-26-875M','consumo',461,'2026-03-08',1),(132,'MC-26-SVLS','consumo',762,'2026-03-08',1),(133,'MR-26-1AQF','riego',3287,'2026-03-08',1),(134,'MC-26-5ZQP','consumo',1,'2026-03-08',1),(135,'MR-26-I0ZL','riego',1,'2026-03-08',1),(136,'MC-26-FDAH','consumo',57,'2026-03-08',1),(137,'MC-26-GO00','consumo',220,'2026-03-08',1),(138,'MR-26-Q5SK','riego',1,'2026-03-08',1),(139,'MC-26-H8JV','consumo',1,'2026-05-03',1),(140,'MR-26-83X7','riego',1,'2026-05-03',1),(141,'MC-26-8XQQ','consumo',1,'2026-07-05',1);
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
  `account_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`income_id`),
  KEY `fk_other_incomes_account` (`account_id`),
  CONSTRAINT `fk_other_incomes_account` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `other_incomes`
--

LOCK TABLES `other_incomes` WRITE;
/*!40000 ALTER TABLE `other_incomes` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_agreements`
--

LOCK TABLES `payment_agreements` WRITE;
/*!40000 ALTER TABLE `payment_agreements` DISABLE KEYS */;
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
  `movement_type` enum('payment','partial') NOT NULL,
  `payment_method` enum('cash','transfer','card') NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `fk_payments_sysuser` (`system_user_id`),
  KEY `fk_payments_account` (`account_id`),
  CONSTRAINT `fk_payments_account` FOREIGN KEY (`account_id`) REFERENCES `bank_accounts` (`account_id`),
  CONSTRAINT `fk_payments_sysuser` FOREIGN KEY (`system_user_id`) REFERENCES `system_users` (`system_user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=487 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (2,52,NULL,'2026-02-01 11:44:37',7.00,10.00,3.00,'payment','cash',NULL,NULL),(3,1,NULL,'2026-02-01 12:15:07',8.68,10.00,1.32,'payment','cash',NULL,NULL),(4,2,NULL,'2026-02-01 12:15:41',7.28,10.00,2.72,'payment','cash',NULL,NULL),(5,3,NULL,'2026-02-01 12:16:15',7.00,20.00,13.00,'payment','cash',NULL,NULL),(6,4,NULL,'2026-02-01 12:17:07',32.20,32.20,0.00,'payment','cash',NULL,NULL),(7,6,NULL,'2026-02-01 12:17:17',7.00,7.00,0.00,'payment','cash',NULL,NULL),(8,7,NULL,'2026-02-01 12:17:29',7.00,7.00,0.00,'payment','cash',NULL,NULL),(9,8,NULL,'2026-02-01 12:17:47',7.00,7.00,0.00,'payment','cash',NULL,NULL),(10,9,NULL,'2026-02-01 12:18:16',7.00,10.00,3.00,'payment','cash',NULL,NULL),(11,10,NULL,'2026-02-01 12:18:50',7.00,20.00,13.00,'payment','cash',NULL,NULL),(12,59,NULL,'2026-02-01 12:19:12',9.52,20.00,10.48,'payment','cash',NULL,NULL),(13,11,NULL,'2026-02-01 12:19:58',7.00,20.00,13.00,'payment','cash',NULL,NULL),(14,60,NULL,'2026-02-01 12:20:53',12.88,20.00,7.12,'payment','cash',NULL,NULL),(15,58,NULL,'2026-02-01 12:21:17',19.88,20.00,0.12,'payment','cash',NULL,NULL),(16,12,NULL,'2026-02-01 12:21:47',7.00,10.00,3.00,'payment','cash',NULL,NULL),(17,13,NULL,'2026-02-01 12:22:20',7.00,7.00,0.00,'payment','cash',NULL,NULL),(18,14,NULL,'2026-02-01 12:22:38',7.00,20.00,13.00,'payment','cash',NULL,NULL),(19,16,NULL,'2026-02-01 12:23:13',7.00,20.00,13.00,'payment','cash',NULL,NULL),(20,17,NULL,'2026-02-01 12:23:31',8.68,10.00,1.32,'payment','cash',NULL,NULL),(21,18,NULL,'2026-02-01 12:23:44',7.00,20.00,13.00,'payment','cash',NULL,NULL),(22,19,NULL,'2026-02-01 12:24:17',10.08,13.00,2.92,'payment','cash',NULL,NULL),(23,20,NULL,'2026-02-01 12:26:33',8.96,20.00,11.04,'payment','cash',NULL,NULL),(24,22,NULL,'2026-02-01 12:28:36',7.00,11.04,4.04,'payment','cash',NULL,NULL),(25,23,NULL,'2026-02-01 12:29:00',7.00,10.00,3.00,'payment','cash',NULL,NULL),(26,24,NULL,'2026-02-01 12:29:15',7.00,7.00,0.00,'payment','cash',NULL,NULL),(27,26,NULL,'2026-02-01 12:29:56',8.96,9.00,0.04,'payment','cash',NULL,NULL),(28,61,NULL,'2026-02-01 12:30:53',7.28,7.28,0.00,'payment','cash',NULL,NULL),(29,28,NULL,'2026-02-01 12:31:12',8.40,20.00,11.60,'payment','cash',NULL,NULL),(30,30,NULL,'2026-02-01 12:31:47',7.00,10.00,3.00,'payment','cash',NULL,NULL),(31,31,NULL,'2026-02-01 12:32:05',7.00,7.00,0.00,'payment','cash',NULL,NULL),(32,33,NULL,'2026-02-01 12:32:34',7.00,7.00,0.00,'payment','cash',NULL,NULL),(33,34,NULL,'2026-02-01 12:32:43',7.00,7.00,0.00,'payment','cash',NULL,NULL),(34,35,NULL,'2026-02-01 12:32:54',7.00,7.00,0.00,'payment','cash',NULL,NULL),(35,36,NULL,'2026-02-01 12:33:12',7.00,7.00,0.00,'payment','cash',NULL,NULL),(36,62,NULL,'2026-02-01 12:33:46',7.00,7.00,0.00,'payment','cash',NULL,NULL),(37,38,NULL,'2026-02-01 12:34:02',7.00,7.00,0.00,'payment','cash',NULL,NULL),(38,39,NULL,'2026-02-01 12:34:27',10.08,20.00,9.92,'payment','cash',NULL,NULL),(39,40,NULL,'2026-02-01 12:35:00',16.24,20.00,3.76,'payment','cash',NULL,NULL),(40,41,NULL,'2026-02-01 12:35:23',9.52,10.00,0.48,'payment','cash',NULL,NULL),(41,42,NULL,'2026-02-01 12:35:45',7.00,10.00,3.00,'payment','cash',NULL,NULL),(42,43,NULL,'2026-02-01 12:36:00',7.28,8.00,0.72,'payment','cash',NULL,NULL),(43,44,NULL,'2026-02-01 12:37:51',7.00,7.00,0.00,'payment','cash',NULL,NULL),(44,46,NULL,'2026-02-01 12:38:24',1.50,1.50,0.00,'payment','cash',NULL,NULL),(45,45,NULL,'2026-02-01 12:38:36',7.00,7.00,0.00,'payment','cash',NULL,NULL),(46,47,NULL,'2026-02-01 12:38:56',7.00,7.00,0.00,'payment','cash',NULL,NULL),(47,48,NULL,'2026-02-01 12:39:10',7.00,7.00,0.00,'payment','cash',NULL,NULL),(48,49,NULL,'2026-02-01 12:39:24',7.00,7.00,0.00,'payment','cash',NULL,NULL),(49,50,NULL,'2026-02-01 12:39:34',1.50,1.50,0.00,'payment','cash',NULL,NULL),(50,53,NULL,'2026-02-01 12:39:55',7.00,7.00,0.00,'payment','cash',NULL,NULL),(51,54,NULL,'2026-02-01 12:40:29',8.96,9.00,0.04,'payment','cash',NULL,NULL),(52,55,NULL,'2026-02-01 12:40:38',1.50,1.50,0.00,'payment','cash',NULL,NULL),(53,57,NULL,'2026-02-01 12:40:54',1.50,1.50,0.00,'payment','cash',NULL,NULL),(54,29,NULL,'2026-02-01 12:42:34',7.00,7.00,0.00,'payment','cash',NULL,NULL),(55,32,NULL,'2026-02-01 12:43:19',16.80,20.00,3.20,'payment','cash',NULL,NULL),(56,64,NULL,'2026-02-01 12:50:53',7.00,7.00,0.00,'payment','cash',NULL,NULL),(57,138,NULL,'2026-03-08 11:44:07',7.00,7.00,0.00,'payment','cash',NULL,NULL),(58,73,NULL,'2026-03-08 11:47:43',7.00,10.00,3.00,'payment','cash',NULL,NULL),(59,76,NULL,'2026-03-08 11:49:54',10.64,10.64,0.00,'payment','cash',NULL,NULL),(60,65,NULL,'2026-03-08 11:49:54',7.00,9.36,2.36,'payment','cash',NULL,NULL),(61,77,NULL,'2026-03-08 11:50:42',7.56,10.00,2.44,'payment','cash',NULL,NULL),(62,79,NULL,'2026-03-08 11:52:14',7.00,20.00,13.00,'payment','cash',NULL,NULL),(63,80,NULL,'2026-03-08 11:52:37',7.00,7.00,0.00,'payment','cash',NULL,NULL),(64,81,NULL,'2026-03-08 11:52:51',7.00,10.00,3.00,'payment','cash',NULL,NULL),(65,82,NULL,'2026-03-08 11:53:23',7.00,7.00,0.00,'payment','cash',NULL,NULL),(66,83,NULL,'2026-03-08 11:53:44',7.00,10.00,3.00,'payment','cash',NULL,NULL),(67,84,NULL,'2026-03-08 11:54:16',7.00,7.00,0.00,'payment','cash',NULL,NULL),(68,66,NULL,'2026-03-08 11:54:16',7.00,8.00,1.00,'payment','cash',NULL,NULL),(69,85,NULL,'2026-03-08 11:54:34',7.00,10.00,3.00,'payment','cash',NULL,NULL),(70,86,NULL,'2026-03-08 11:55:01',8.12,10.00,1.88,'payment','cash',NULL,NULL),(71,87,NULL,'2026-03-08 11:55:47',7.00,20.00,13.00,'payment','cash',NULL,NULL),(72,88,NULL,'2026-03-08 11:57:13',7.56,7.56,0.00,'payment','cash',NULL,NULL),(73,98,NULL,'2026-03-08 11:57:43',7.00,20.00,13.00,'payment','cash',NULL,NULL),(74,110,NULL,'2026-03-08 11:57:55',7.00,7.00,0.00,'payment','cash',NULL,NULL),(75,122,NULL,'2026-03-08 11:58:23',7.56,7.56,0.00,'payment','cash',NULL,NULL),(76,89,NULL,'2026-03-08 11:58:48',7.00,10.00,3.00,'payment','cash',NULL,NULL),(77,90,NULL,'2026-03-08 11:59:16',10.08,10.08,0.00,'payment','cash',NULL,NULL),(78,67,NULL,'2026-03-08 11:59:16',7.00,9.92,2.92,'payment','cash',NULL,NULL),(80,92,NULL,'2026-03-08 12:00:45',7.00,7.00,0.00,'payment','cash',NULL,NULL),(81,94,NULL,'2026-03-08 12:02:06',1.50,1.50,0.00,'payment','cash',NULL,NULL),(82,68,NULL,'2026-03-08 12:02:06',1.50,1.50,0.00,'payment','cash',NULL,NULL),(83,95,NULL,'2026-03-08 12:02:42',7.00,20.00,13.00,'payment','cash',NULL,NULL),(84,96,NULL,'2026-03-08 12:03:02',7.00,7.00,0.00,'payment','cash',NULL,NULL),(85,97,NULL,'2026-03-08 12:03:11',7.00,7.00,0.00,'payment','cash',NULL,NULL),(86,99,NULL,'2026-03-08 12:03:41',7.00,10.00,3.00,'payment','cash',NULL,NULL),(87,100,NULL,'2026-03-08 12:04:39',7.00,7.00,0.00,'payment','cash',NULL,NULL),(88,101,NULL,'2026-03-08 12:05:30',7.00,7.00,0.00,'payment','cash',NULL,NULL),(89,146,NULL,'2026-03-08 12:05:51',8.68,8.68,0.00,'payment','cash',NULL,NULL),(90,21,NULL,'2026-03-08 12:05:51',20.44,20.44,0.00,'payment','cash',NULL,NULL),(91,103,NULL,'2026-03-08 12:06:39',1.50,1.50,0.00,'payment','cash',NULL,NULL),(92,69,NULL,'2026-03-08 12:06:39',1.50,1.50,0.00,'payment','cash',NULL,NULL),(93,102,NULL,'2026-03-08 12:06:51',7.00,7.00,0.00,'payment','cash',NULL,NULL),(94,105,NULL,'2026-03-08 12:07:45',10.36,10.36,0.00,'payment','cash',NULL,NULL),(95,106,NULL,'2026-03-08 12:08:11',7.00,7.00,0.00,'payment','cash',NULL,NULL),(96,107,NULL,'2026-03-08 12:08:39',7.28,7.28,0.00,'payment','cash',NULL,NULL),(97,27,NULL,'2026-03-08 12:08:39',15.96,32.72,16.76,'payment','cash',NULL,NULL),(98,109,NULL,'2026-03-08 12:08:59',7.00,7.00,0.00,'payment','cash',NULL,NULL),(99,108,NULL,'2026-03-08 12:09:11',7.00,7.00,0.00,'payment','cash',NULL,NULL),(100,70,NULL,'2026-03-08 12:09:11',7.00,7.00,0.00,'payment','cash',NULL,NULL),(101,112,NULL,'2026-03-08 12:09:40',7.00,7.00,0.00,'payment','cash',NULL,NULL),(102,113,NULL,'2026-03-08 12:09:47',7.00,7.00,0.00,'payment','cash',NULL,NULL),(103,114,NULL,'2026-03-08 12:10:02',8.12,20.00,11.88,'payment','cash',NULL,NULL),(104,115,NULL,'2026-03-08 12:10:21',7.00,7.00,0.00,'payment','cash',NULL,NULL),(105,116,NULL,'2026-03-08 12:11:01',7.00,7.00,0.00,'payment','cash',NULL,NULL),(106,117,NULL,'2026-03-08 12:11:09',7.00,7.00,0.00,'payment','cash',NULL,NULL),(107,118,NULL,'2026-03-08 12:11:26',7.00,7.00,0.00,'payment','cash',NULL,NULL),(108,119,NULL,'2026-03-08 12:11:45',7.00,7.00,0.00,'payment','cash',NULL,NULL),(109,37,NULL,'2026-03-08 12:11:45',7.00,7.00,0.00,'payment','cash',NULL,NULL),(110,120,NULL,'2026-03-08 12:12:10',7.28,20.00,12.72,'payment','cash',NULL,NULL),(111,124,NULL,'2026-03-08 12:12:37',7.00,7.00,0.00,'payment','cash',NULL,NULL),(112,125,NULL,'2026-03-08 12:13:02',7.00,7.00,0.00,'payment','cash',NULL,NULL),(113,126,NULL,'2026-03-08 12:13:21',7.84,20.00,12.16,'payment','cash',NULL,NULL),(114,127,NULL,'2026-03-08 12:13:32',7.00,7.00,0.00,'payment','cash',NULL,NULL),(117,129,NULL,'2026-03-08 12:14:17',7.00,7.00,0.00,'payment','cash',NULL,NULL),(118,130,NULL,'2026-03-08 12:14:27',1.50,1.50,0.00,'payment','cash',NULL,NULL),(119,72,NULL,'2026-03-08 12:14:27',1.50,1.50,0.00,'payment','cash',NULL,NULL),(120,131,NULL,'2026-03-08 12:14:43',1.50,1.50,0.00,'payment','cash',NULL,NULL),(121,132,NULL,'2026-03-08 12:15:00',7.00,7.00,0.00,'payment','cash',NULL,NULL),(122,133,NULL,'2026-03-08 12:15:11',7.00,7.00,0.00,'payment','cash',NULL,NULL),(123,71,NULL,'2026-03-08 12:15:11',7.00,7.00,0.00,'payment','cash',NULL,NULL),(124,135,NULL,'2026-03-08 12:15:31',7.00,7.00,0.00,'payment','cash',NULL,NULL),(125,136,NULL,'2026-03-08 12:15:50',1.50,1.50,0.00,'payment','cash',NULL,NULL),(126,139,NULL,'2026-03-08 12:16:36',7.00,7.00,0.00,'payment','cash',NULL,NULL),(127,140,NULL,'2026-03-08 12:17:05',8.68,20.00,11.32,'payment','cash',NULL,NULL),(128,142,NULL,'2026-03-08 12:18:09',1.50,1.50,0.00,'payment','cash',NULL,NULL),(129,56,NULL,'2026-03-08 12:18:09',1.50,1.50,0.00,'payment','cash',NULL,NULL),(130,121,NULL,'2026-03-08 12:18:46',7.00,7.00,0.00,'payment','cash',NULL,NULL),(131,141,NULL,'2026-03-08 12:19:34',1.50,1.50,0.00,'payment','cash',NULL,NULL),(132,143,NULL,'2026-03-08 12:19:47',1.50,1.50,0.00,'payment','cash',NULL,NULL),(133,5,NULL,'2026-03-08 12:29:42',7.00,7.00,0.00,'payment','cash',NULL,NULL),(134,15,NULL,'2026-03-18 10:54:44',5.50,5.50,0.00,'payment','cash',NULL,NULL),(135,151,NULL,'2026-03-29 12:38:19',14.56,25.00,0.92,'payment','cash',NULL,NULL),(136,74,NULL,'2026-03-29 12:38:19',9.52,25.00,0.92,'payment','cash',NULL,NULL),(137,149,NULL,'2026-03-29 12:39:19',7.00,20.00,6.00,'payment','cash',NULL,NULL),(138,75,NULL,'2026-03-29 12:39:19',7.00,20.00,6.00,'payment','cash',NULL,NULL),(139,152,NULL,'2026-03-29 12:40:14',19.04,20.00,0.96,'payment','cash',NULL,NULL),(140,154,NULL,'2026-03-29 12:40:48',7.00,10.00,3.00,'payment','cash',NULL,NULL),(141,155,NULL,'2026-03-29 12:41:08',7.00,10.00,3.00,'payment','cash',NULL,NULL),(142,156,NULL,'2026-03-29 12:41:28',7.00,7.00,0.00,'payment','cash',NULL,NULL),(143,157,NULL,'2026-03-29 12:41:46',7.00,7.00,0.00,'payment','cash',NULL,NULL),(144,159,NULL,'2026-03-29 12:42:27',7.00,20.00,13.00,'payment','cash',NULL,NULL),(145,160,NULL,'2026-03-29 12:44:01',21.00,40.00,19.00,'payment','cash',NULL,NULL),(146,161,NULL,'2026-03-29 12:44:43',41.44,42.00,0.56,'payment','cash',NULL,NULL),(147,162,NULL,'2026-03-29 12:45:11',7.00,20.00,13.00,'payment','cash',NULL,NULL),(148,163,NULL,'2026-03-29 12:45:29',14.84,15.00,0.16,'payment','cash',NULL,NULL),(149,165,NULL,'2026-03-29 12:45:53',7.28,20.00,12.72,'payment','cash',NULL,NULL),(150,167,NULL,'2026-03-29 12:46:21',7.28,10.00,2.72,'payment','cash',NULL,NULL),(151,93,NULL,'2026-03-29 12:46:55',5.50,10.00,4.50,'payment','cash',NULL,NULL),(152,169,NULL,'2026-03-29 12:47:15',1.50,1.50,0.00,'payment','cash',NULL,NULL),(153,172,NULL,'2026-03-29 12:47:42',12.88,20.00,7.12,'payment','cash',NULL,NULL),(154,187,NULL,'2026-03-29 12:48:16',7.00,7.00,0.00,'payment','cash',NULL,NULL),(155,171,NULL,'2026-03-29 12:48:23',7.00,7.00,0.00,'payment','cash',NULL,NULL),(156,173,NULL,'2026-03-29 12:49:06',10.08,20.00,9.92,'payment','cash',NULL,NULL),(157,174,NULL,'2026-03-29 12:49:27',14.56,20.00,5.44,'payment','cash',NULL,NULL),(158,175,NULL,'2026-03-29 12:49:56',7.00,20.00,13.00,'payment','cash',NULL,NULL),(159,208,NULL,'2026-03-29 12:50:23',7.00,10.00,3.00,'payment','cash',NULL,NULL),(160,177,NULL,'2026-03-29 12:50:37',7.00,7.00,0.00,'payment','cash',NULL,NULL),(161,178,NULL,'2026-03-29 12:50:54',1.50,1.50,0.00,'payment','cash',NULL,NULL),(162,179,NULL,'2026-03-29 12:51:36',7.00,7.00,0.00,'payment','cash',NULL,NULL),(163,180,NULL,'2026-03-29 12:51:47',7.56,10.00,2.44,'payment','cash',NULL,NULL),(164,182,NULL,'2026-03-29 12:52:04',8.40,10.00,1.60,'payment','cash',NULL,NULL),(165,183,NULL,'2026-03-29 12:52:26',15.96,20.00,4.04,'payment','cash',NULL,NULL),(166,185,NULL,'2026-03-29 12:52:58',17.92,20.00,2.08,'payment','cash',NULL,NULL),(167,184,NULL,'2026-03-29 12:53:25',15.68,20.00,4.32,'payment','cash',NULL,NULL),(168,189,NULL,'2026-03-29 12:53:59',7.00,7.00,0.00,'payment','cash',NULL,NULL),(169,191,NULL,'2026-03-29 12:54:18',7.00,7.00,0.00,'payment','cash',NULL,NULL),(170,192,NULL,'2026-03-29 12:54:41',7.00,20.00,13.00,'payment','cash',NULL,NULL),(171,194,NULL,'2026-03-29 12:54:58',8.12,20.00,11.88,'payment','cash',NULL,NULL),(172,195,NULL,'2026-03-29 12:55:16',19.60,20.00,0.40,'payment','cash',NULL,NULL),(173,148,NULL,'2026-03-29 12:55:46',15.96,20.00,4.04,'payment','cash',NULL,NULL),(174,197,NULL,'2026-03-29 12:56:37',8.68,8.75,0.07,'payment','cash',NULL,NULL),(175,198,NULL,'2026-03-29 12:58:26',7.00,14.00,0.00,'payment','cash',NULL,NULL),(176,123,NULL,'2026-03-29 12:58:26',7.00,14.00,0.00,'payment','cash',NULL,NULL),(177,200,NULL,'2026-03-29 12:58:57',7.00,7.00,0.00,'payment','cash',NULL,NULL),(178,201,NULL,'2026-03-29 12:59:12',7.28,20.00,12.72,'payment','cash',NULL,NULL),(179,202,NULL,'2026-03-29 12:59:26',7.00,10.00,3.00,'payment','cash',NULL,NULL),(181,203,NULL,'2026-03-29 13:00:38',9.52,10.00,0.48,'payment','cash',NULL,NULL),(182,204,NULL,'2026-03-29 13:01:26',1.50,1.50,0.00,'payment','cash',NULL,NULL),(183,205,NULL,'2026-03-29 13:01:52',1.50,2.00,0.50,'payment','cash',NULL,NULL),(184,206,NULL,'2026-03-29 13:02:16',7.00,10.00,3.00,'payment','cash',NULL,NULL),(185,207,NULL,'2026-03-29 13:02:24',7.00,7.00,0.00,'payment','cash',NULL,NULL),(186,209,NULL,'2026-03-29 13:02:52',7.00,20.00,6.00,'payment','cash',NULL,NULL),(187,134,NULL,'2026-03-29 13:02:52',7.00,20.00,6.00,'payment','cash',NULL,NULL),(188,210,NULL,'2026-03-29 13:03:16',7.00,20.00,13.00,'payment','cash',NULL,NULL),(189,211,NULL,'2026-03-29 13:03:31',1.50,10.00,8.50,'payment','cash',NULL,NULL),(190,212,NULL,'2026-03-29 13:03:55',8.12,40.00,12.56,'payment','cash',NULL,NULL),(191,137,NULL,'2026-03-29 13:03:55',7.28,40.00,12.56,'payment','cash',NULL,NULL),(192,51,NULL,'2026-03-29 13:03:55',12.04,40.00,12.56,'payment','cash',NULL,NULL),(193,213,NULL,'2026-03-29 13:04:13',7.00,10.00,3.00,'payment','cash',NULL,NULL),(194,214,NULL,'2026-03-29 13:04:36',7.00,20.00,13.00,'payment','cash',NULL,NULL),(195,215,NULL,'2026-03-29 13:05:12',8.40,20.00,11.60,'payment','cash',NULL,NULL),(196,217,NULL,'2026-03-29 13:05:26',1.50,2.00,0.50,'payment','cash',NULL,NULL),(197,218,NULL,'2026-03-29 13:05:48',1.50,1.50,0.00,'payment','cash',NULL,NULL),(198,216,NULL,'2026-03-29 13:06:12',1.50,1.50,0.00,'payment','cash',NULL,NULL),(199,193,NULL,'2026-03-29 13:08:27',10.64,15.00,4.36,'payment','cash',NULL,NULL),(200,164,NULL,'2026-03-29 13:09:01',7.28,20.00,12.72,'payment','cash',NULL,NULL),(201,158,NULL,'2026-03-29 13:10:20',7.00,10.00,3.00,'payment','cash',NULL,NULL),(202,188,NULL,'2026-03-29 13:11:05',7.00,7.00,0.00,'payment','cash',NULL,NULL),(203,147,NULL,'2026-03-29 13:12:43',20.16,21.00,0.84,'payment','cash',NULL,NULL),(204,153,NULL,'2026-03-29 13:25:21',7.00,7.00,0.00,'payment','cash',NULL,NULL),(205,166,NULL,'2026-03-29 13:28:30',9.24,18.76,0.00,'payment','cash',NULL,NULL),(206,91,NULL,'2026-03-29 13:28:30',9.52,18.76,0.00,'payment','cash',NULL,NULL),(207,196,NULL,'2026-03-29 13:47:40',7.84,20.00,12.16,'payment','cash',NULL,NULL),(208,233,NULL,'2026-05-03 11:56:59',7.00,7.00,0.00,'payment','cash',NULL,NULL),(209,219,NULL,'2026-05-03 12:01:22',19.32,20.00,0.68,'payment','cash',NULL,NULL),(210,220,NULL,'2026-05-03 12:01:59',13.96,14.00,0.04,'payment','cash',NULL,NULL),(211,221,NULL,'2026-05-03 12:02:52',7.00,20.00,13.00,'payment','cash',NULL,NULL),(212,150,NULL,'2026-05-03 12:03:31',48.72,50.00,1.28,'payment','cash',NULL,NULL),(213,223,NULL,'2026-05-03 12:04:18',40.88,41.00,0.12,'payment','cash',NULL,NULL),(214,224,NULL,'2026-05-03 12:04:41',12.00,20.00,1.00,'payment','cash',NULL,NULL),(215,78,NULL,'2026-05-03 12:04:41',7.00,20.00,1.00,'payment','cash',NULL,NULL),(216,225,NULL,'2026-05-03 12:05:14',7.00,20.00,13.00,'payment','cash',NULL,NULL),(217,226,NULL,'2026-05-03 12:05:32',7.00,20.00,13.00,'payment','cash',NULL,NULL),(218,227,NULL,'2026-05-03 12:05:59',7.56,7.56,0.00,'payment','cash',NULL,NULL),(219,228,NULL,'2026-05-03 12:06:24',7.00,7.00,0.00,'payment','cash',NULL,NULL),(220,229,NULL,'2026-05-03 12:06:44',7.00,10.00,3.00,'payment','cash',NULL,NULL),(221,230,NULL,'2026-05-03 12:07:52',67.00,80.00,13.00,'payment','cash',NULL,NULL),(222,231,NULL,'2026-05-03 12:08:41',10.08,10.10,0.02,'payment','cash',NULL,NULL),(223,232,NULL,'2026-05-03 12:09:05',28.52,30.00,1.48,'payment','cash',NULL,NULL),(224,234,NULL,'2026-05-03 12:09:23',24.92,40.00,15.08,'payment','cash',NULL,NULL),(225,235,NULL,'2026-05-03 12:09:43',7.28,10.00,2.72,'payment','cash',NULL,NULL),(226,236,NULL,'2026-05-03 12:10:17',68.96,80.00,11.04,'payment','cash',NULL,NULL),(227,237,NULL,'2026-05-03 12:11:14',7.00,7.00,0.00,'payment','cash',NULL,NULL),(228,238,NULL,'2026-05-03 12:11:50',10.64,11.00,0.36,'payment','cash',NULL,NULL),(229,241,NULL,'2026-05-03 12:12:39',12.00,12.00,0.00,'payment','cash',NULL,NULL),(230,243,NULL,'2026-05-03 12:13:32',19.00,20.00,1.00,'payment','cash',NULL,NULL),(231,244,NULL,'2026-05-03 12:13:42',14.00,20.00,6.00,'payment','cash',NULL,NULL),(232,245,NULL,'2026-05-03 12:14:16',14.84,20.00,5.16,'payment','cash',NULL,NULL),(233,246,NULL,'2026-05-03 12:14:27',13.44,20.00,6.56,'payment','cash',NULL,NULL),(234,249,NULL,'2026-05-03 12:15:11',7.00,10.00,3.00,'payment','cash',NULL,NULL),(235,247,NULL,'2026-05-03 12:15:20',12.88,20.00,7.12,'payment','cash',NULL,NULL),(236,250,NULL,'2026-05-03 12:15:56',7.00,7.00,0.00,'payment','cash',NULL,NULL),(237,252,NULL,'2026-05-03 12:16:26',7.00,20.00,13.00,'payment','cash',NULL,NULL),(238,253,NULL,'2026-05-03 12:16:45',11.20,20.00,8.80,'payment','cash',NULL,NULL),(239,257,NULL,'2026-05-03 12:17:33',9.80,9.80,0.00,'payment','cash',NULL,NULL),(240,256,NULL,'2026-05-03 12:18:00',7.00,7.00,0.00,'payment','cash',NULL,NULL),(241,259,NULL,'2026-05-03 12:18:22',7.00,10.00,3.00,'payment','cash',NULL,NULL),(242,260,NULL,'2026-05-03 12:18:47',7.00,20.00,13.00,'payment','cash',NULL,NULL),(243,261,NULL,'2026-05-03 12:19:52',55.72,140.00,1.12,'payment','cash',NULL,NULL),(244,190,NULL,'2026-05-03 12:19:52',83.16,140.00,1.12,'payment','cash',NULL,NULL),(245,262,NULL,'2026-05-03 12:20:24',7.00,10.00,3.00,'payment','cash',NULL,NULL),(246,263,NULL,'2026-05-03 12:20:34',7.00,20.00,13.00,'payment','cash',NULL,NULL),(247,264,NULL,'2026-05-03 12:20:54',10.08,10.10,0.02,'payment','cash',NULL,NULL),(248,265,NULL,'2026-05-03 12:21:09',10.64,20.00,9.36,'payment','cash',NULL,NULL),(249,266,NULL,'2026-05-03 12:21:23',8.40,10.00,1.60,'payment','cash',NULL,NULL),(250,268,NULL,'2026-05-03 12:21:51',7.00,20.00,13.00,'payment','cash',NULL,NULL),(251,269,NULL,'2026-05-03 12:22:05',9.52,10.00,0.48,'payment','cash',NULL,NULL),(252,270,NULL,'2026-05-03 12:22:42',10.64,20.00,9.36,'payment','cash',NULL,NULL),(253,271,NULL,'2026-05-03 12:23:02',8.40,20.00,1.80,'payment','cash',NULL,NULL),(254,199,NULL,'2026-05-03 12:23:02',9.80,20.00,1.80,'payment','cash',NULL,NULL),(255,273,NULL,'2026-05-03 12:23:31',9.24,20.00,10.76,'payment','cash',NULL,NULL),(256,272,NULL,'2026-05-03 12:23:40',7.00,10.00,3.00,'payment','cash',NULL,NULL),(257,274,NULL,'2026-05-03 12:24:02',7.00,7.00,0.00,'payment','cash',NULL,NULL),(259,276,NULL,'2026-05-03 12:24:59',7.00,20.00,13.00,'payment','cash',NULL,NULL),(260,279,NULL,'2026-05-03 12:25:29',14.52,20.00,5.48,'payment','cash',NULL,NULL),(261,278,NULL,'2026-05-03 12:25:50',2.06,2.10,0.04,'payment','cash',NULL,NULL),(262,280,NULL,'2026-05-03 12:26:09',7.00,10.00,3.00,'payment','cash',NULL,NULL),(263,282,NULL,'2026-05-03 12:26:39',7.28,10.00,2.72,'payment','cash',NULL,NULL),(264,283,NULL,'2026-05-03 12:26:52',1.50,1.50,0.00,'payment','cash',NULL,NULL),(265,285,NULL,'2026-05-03 12:27:14',7.00,7.00,0.00,'payment','cash',NULL,NULL),(266,284,NULL,'2026-05-03 12:27:22',7.84,10.00,2.16,'payment','cash',NULL,NULL),(267,286,NULL,'2026-05-03 12:27:39',7.00,10.00,3.00,'payment','cash',NULL,NULL),(268,289,NULL,'2026-05-03 12:28:35',1.50,1.50,0.00,'payment','cash',NULL,NULL),(269,288,NULL,'2026-05-03 12:28:48',1.50,1.50,0.00,'payment','cash',NULL,NULL),(270,290,NULL,'2026-05-03 12:28:57',1.50,1.50,0.00,'payment','cash',NULL,NULL),(271,170,NULL,'2026-05-03 12:29:37',10.36,20.00,9.64,'payment','cash',NULL,NULL),(272,254,NULL,'2026-05-03 12:30:18',9.24,20.00,10.76,'payment','cash',NULL,NULL),(273,291,NULL,'2026-05-03 12:41:21',7.00,7.00,0.00,'payment','cash',NULL,NULL),(274,292,NULL,'2026-05-31 10:58:38',7.00,10.00,3.00,'payment','cash',NULL,NULL),(275,336,NULL,'2026-05-31 10:58:56',7.00,7.00,0.00,'payment','cash',NULL,NULL),(276,296,NULL,'2026-05-31 10:59:51',13.16,20.00,6.84,'payment','cash',NULL,NULL),(277,298,NULL,'2026-05-31 11:00:31',7.00,20.00,13.00,'payment','cash',NULL,NULL),(278,299,NULL,'2026-05-31 11:01:01',7.00,10.00,3.00,'payment','cash',NULL,NULL),(279,335,NULL,'2026-05-31 11:01:16',7.00,7.00,0.00,'payment','cash',NULL,NULL),(280,300,NULL,'2026-05-31 11:01:38',7.00,7.00,0.00,'payment','cash',NULL,NULL),(281,301,NULL,'2026-05-31 11:01:48',7.00,7.00,0.00,'payment','cash',NULL,NULL),(282,302,NULL,'2026-05-31 11:02:27',7.84,8.00,0.16,'payment','cash',NULL,NULL),(283,303,NULL,'2026-05-31 11:03:05',7.28,7.28,0.00,'payment','cash',NULL,NULL),(284,304,NULL,'2026-05-31 11:03:43',26.88,26.88,0.00,'payment','cash',NULL,NULL),(285,307,NULL,'2026-05-31 11:03:59',17.92,17.92,0.00,'payment','cash',NULL,NULL),(286,308,NULL,'2026-05-31 11:05:20',10.08,10.08,0.00,'payment','cash',NULL,NULL),(287,309,NULL,'2026-05-31 11:05:49',7.00,20.00,13.00,'payment','cash',NULL,NULL),(288,311,NULL,'2026-05-31 11:06:26',7.56,7.56,0.00,'payment','cash',NULL,NULL),(289,310,NULL,'2026-05-31 11:07:29',7.00,7.00,0.00,'payment','cash',NULL,NULL),(290,168,NULL,'2026-05-31 11:08:06',5.50,5.50,0.00,'payment','cash',NULL,NULL),(291,314,NULL,'2026-05-31 11:09:22',7.00,20.00,13.00,'payment','cash',NULL,NULL),(292,313,NULL,'2026-05-31 11:09:48',1.50,3.00,0.00,'payment','cash',NULL,NULL),(293,240,NULL,'2026-05-31 11:09:48',1.50,3.00,0.00,'payment','cash',NULL,NULL),(294,315,NULL,'2026-05-31 11:10:40',8.96,22.00,0.20,'payment','cash',NULL,NULL),(295,242,NULL,'2026-05-31 11:10:40',12.84,22.00,0.20,'payment','cash',NULL,NULL),(296,317,NULL,'2026-05-31 11:11:50',13.16,13.16,0.00,'payment','cash',NULL,NULL),(297,316,NULL,'2026-05-31 11:11:57',7.00,7.00,0.00,'payment','cash',NULL,NULL),(298,318,NULL,'2026-05-31 11:12:37',7.00,10.00,3.00,'payment','cash',NULL,NULL),(299,319,NULL,'2026-05-31 11:12:44',7.00,10.00,3.00,'payment','cash',NULL,NULL),(300,322,NULL,'2026-05-31 11:13:22',7.00,10.00,3.00,'payment','cash',NULL,NULL),(301,320,NULL,'2026-05-31 11:13:35',15.96,16.00,0.04,'payment','cash',NULL,NULL),(302,323,NULL,'2026-05-31 11:14:17',7.00,20.00,13.00,'payment','cash',NULL,NULL),(303,325,NULL,'2026-05-31 11:15:15',7.84,20.00,12.16,'payment','cash',NULL,NULL),(304,326,NULL,'2026-05-31 11:15:39',7.00,7.00,0.00,'payment','cash',NULL,NULL),(305,327,NULL,'2026-05-31 11:16:19',14.84,15.00,0.16,'payment','cash',NULL,NULL),(306,255,NULL,'2026-05-31 11:17:48',20.72,25.00,4.28,'payment','cash',NULL,NULL),(307,329,NULL,'2026-05-31 11:18:13',8.40,10.00,1.60,'payment','cash',NULL,NULL),(308,330,NULL,'2026-05-31 11:18:34',7.00,10.00,3.00,'payment','cash',NULL,NULL),(309,332,NULL,'2026-05-31 11:19:26',7.00,7.00,0.00,'payment','cash',NULL,NULL),(310,333,NULL,'2026-05-31 11:19:53',7.00,7.00,0.00,'payment','cash',NULL,NULL),(311,352,NULL,'2026-05-31 11:20:19',1.50,1.50,0.00,'payment','cash',NULL,NULL),(312,334,NULL,'2026-05-31 11:21:25',22.68,40.00,17.32,'payment','cash',NULL,NULL),(313,337,NULL,'2026-05-31 11:22:15',7.00,7.00,0.00,'payment','cash',NULL,NULL),(314,338,NULL,'2026-05-31 11:22:30',7.00,10.00,3.00,'payment','cash',NULL,NULL),(315,348,NULL,'2026-05-31 11:23:02',7.00,7.00,0.00,'payment','cash',NULL,NULL),(316,339,NULL,'2026-05-31 11:23:24',7.00,7.00,0.00,'payment','cash',NULL,NULL),(317,340,NULL,'2026-05-31 11:24:02',9.24,20.00,10.76,'payment','cash',NULL,NULL),(318,341,NULL,'2026-05-31 11:24:21',7.00,20.00,4.60,'payment','cash',NULL,NULL),(319,267,NULL,'2026-05-31 11:24:21',8.40,20.00,4.60,'payment','cash',NULL,NULL),(320,342,NULL,'2026-05-31 11:24:45',7.00,7.00,0.00,'payment','cash',NULL,NULL),(321,343,NULL,'2026-05-31 11:26:28',15.12,15.12,0.00,'payment','cash',NULL,NULL),(322,344,NULL,'2026-05-31 11:26:37',10.92,10.92,0.00,'payment','cash',NULL,NULL),(323,345,NULL,'2026-05-31 11:27:02',13.44,13.44,0.00,'payment','cash',NULL,NULL),(324,346,NULL,'2026-05-31 11:27:27',7.00,7.00,0.00,'payment','cash',NULL,NULL),(325,347,NULL,'2026-05-31 11:28:09',8.68,8.68,0.00,'payment','cash',NULL,NULL),(327,350,NULL,'2026-05-31 11:29:08',9.80,10.00,0.20,'payment','cash',NULL,NULL),(328,351,NULL,'2026-05-31 11:29:34',1.50,3.00,0.00,'payment','cash',NULL,NULL),(329,277,NULL,'2026-05-31 11:29:34',1.50,3.00,0.00,'payment','cash',NULL,NULL),(330,356,NULL,'2026-05-31 11:29:57',7.00,7.00,0.00,'payment','cash',NULL,NULL),(331,353,NULL,'2026-05-31 11:30:04',7.00,7.00,0.00,'payment','cash',NULL,NULL),(332,355,NULL,'2026-05-31 11:30:49',7.00,14.00,0.00,'payment','cash',NULL,NULL),(333,281,NULL,'2026-05-31 11:30:49',7.00,14.00,0.00,'payment','cash',NULL,NULL),(334,359,NULL,'2026-05-31 11:31:18',7.00,7.00,0.00,'payment','cash',NULL,NULL),(335,357,NULL,'2026-05-31 11:31:28',1.50,1.50,0.00,'payment','cash',NULL,NULL),(336,360,NULL,'2026-05-31 11:31:47',7.00,20.00,13.00,'payment','cash',NULL,NULL),(337,361,NULL,'2026-05-31 11:32:57',12.04,22.00,0.16,'payment','cash',NULL,NULL),(338,287,NULL,'2026-05-31 11:32:57',9.80,22.00,0.16,'payment','cash',NULL,NULL),(339,362,NULL,'2026-05-31 11:33:21',1.50,1.50,0.00,'payment','cash',NULL,NULL),(340,363,NULL,'2026-05-31 11:33:38',2.62,2.62,0.00,'payment','cash',NULL,NULL),(341,364,NULL,'2026-05-31 11:33:55',1.50,1.50,0.00,'payment','cash',NULL,NULL),(342,349,NULL,'2026-07-04 23:52:56',8.12,41.96,0.00,'payment','cash',NULL,NULL),(343,275,NULL,'2026-07-04 23:52:56',12.84,41.96,0.00,'payment','cash',NULL,NULL),(344,181,NULL,'2026-07-04 23:52:56',7.00,41.96,0.00,'payment','cash',NULL,NULL),(345,128,NULL,'2026-07-04 23:52:56',7.00,41.96,0.00,'payment','cash',NULL,NULL),(346,63,NULL,'2026-07-04 23:52:56',7.00,41.96,0.00,'payment','cash',NULL,NULL),(347,365,NULL,'2026-07-05 10:16:47',7.00,10.00,3.00,'payment','cash',NULL,NULL),(348,366,NULL,'2026-07-05 10:17:07',7.84,20.00,3.76,'payment','cash',NULL,NULL),(349,293,NULL,'2026-07-05 10:17:07',8.40,20.00,3.76,'payment','cash',NULL,NULL),(350,368,NULL,'2026-07-05 10:17:43',10.64,60.00,8.52,'payment','cash',NULL,NULL),(351,295,NULL,'2026-07-05 10:17:43',15.12,60.00,8.52,'payment','cash',NULL,NULL),(352,222,NULL,'2026-07-05 10:17:43',25.72,60.00,8.52,'payment','cash',NULL,NULL),(353,369,NULL,'2026-07-05 10:18:30',9.52,20.00,10.48,'payment','cash',NULL,NULL),(355,294,NULL,'2026-07-05 10:26:51',7.00,20.00,1.00,'payment','cash',NULL,NULL),(356,367,NULL,'2026-07-05 10:29:15',17.00,20.00,3.00,'payment','cash',NULL,NULL),(357,371,NULL,'2026-07-05 10:30:46',7.00,20.00,13.00,'payment','cash',NULL,NULL),(358,372,NULL,'2026-07-05 10:30:55',7.00,7.00,0.00,'payment','cash',NULL,NULL),(359,373,NULL,'2026-07-05 10:31:20',8.12,10.00,1.88,'payment','cash',NULL,NULL),(360,370,NULL,'2026-07-05 10:31:49',23.68,30.00,6.32,'payment','cash',NULL,NULL),(361,374,NULL,'2026-07-05 10:32:20',10.64,20.00,9.36,'payment','cash',NULL,NULL),(362,375,NULL,'2026-07-05 10:32:42',7.56,10.00,2.44,'payment','cash',NULL,NULL),(363,376,NULL,'2026-07-05 10:33:05',7.00,20.00,13.00,'payment','cash',NULL,NULL),(364,377,NULL,'2026-07-05 10:33:48',7.00,20.00,13.00,'payment','cash',NULL,NULL),(365,378,NULL,'2026-07-05 10:34:11',8.96,65.00,2.84,'payment','cash',NULL,NULL),(366,305,NULL,'2026-07-05 10:34:11',53.20,65.00,2.84,'payment','cash',NULL,NULL),(367,379,NULL,'2026-07-05 10:34:37',17.00,24.00,0.00,'payment','cash',NULL,NULL),(368,306,NULL,'2026-07-05 10:34:37',7.00,24.00,0.00,'payment','cash',NULL,NULL),(369,380,NULL,'2026-07-05 10:35:37',8.68,10.00,1.32,'payment','cash',NULL,NULL),(370,381,NULL,'2026-07-05 10:35:51',8.96,20.00,11.04,'payment','cash',NULL,NULL),(371,382,NULL,'2026-07-05 10:36:32',10.64,11.00,0.36,'payment','cash',NULL,NULL),(372,384,NULL,'2026-07-05 10:37:09',7.84,10.00,2.16,'payment','cash',NULL,NULL),(373,386,NULL,'2026-07-05 10:37:48',1.50,1.50,0.00,'payment','cash',NULL,NULL),(374,389,NULL,'2026-07-05 10:39:20',12.00,12.00,0.00,'payment','cash',NULL,NULL),(375,390,NULL,'2026-07-05 10:39:45',7.56,20.00,12.44,'payment','cash',NULL,NULL),(376,388,NULL,'2026-07-05 10:41:17',7.00,10.00,3.00,'payment','cash',NULL,NULL),(377,391,NULL,'2026-07-05 10:41:36',7.00,10.00,3.00,'payment','cash',NULL,NULL),(378,393,NULL,'2026-07-05 10:42:44',7.00,7.00,0.00,'payment','cash',NULL,NULL),(379,395,NULL,'2026-07-05 10:43:07',7.00,20.00,13.00,'payment','cash',NULL,NULL),(380,396,NULL,'2026-07-05 10:43:16',7.00,7.00,0.00,'payment','cash',NULL,NULL),(381,398,NULL,'2026-07-05 10:43:57',8.40,10.00,1.60,'payment','cash',NULL,NULL),(382,399,NULL,'2026-07-05 10:44:09',7.84,20.00,12.16,'payment','cash',NULL,NULL),(383,400,NULL,'2026-07-05 10:44:38',8.96,20.00,11.04,'payment','cash',NULL,NULL),(384,401,NULL,'2026-07-05 10:45:39',12.28,20.00,7.72,'payment','cash',NULL,NULL),(385,403,NULL,'2026-07-05 10:45:54',7.00,10.00,3.00,'payment','cash',NULL,NULL),(386,405,NULL,'2026-07-05 10:46:22',7.00,10.00,3.00,'payment','cash',NULL,NULL),(387,406,NULL,'2026-07-05 10:46:50',7.56,20.00,12.44,'payment','cash',NULL,NULL),(388,407,NULL,'2026-07-05 10:47:31',9.80,10.00,0.20,'payment','cash',NULL,NULL),(389,408,NULL,'2026-07-05 10:48:02',7.00,10.00,3.00,'payment','cash',NULL,NULL),(390,409,NULL,'2026-07-05 10:48:14',7.00,7.00,0.00,'payment','cash',NULL,NULL),(391,411,NULL,'2026-07-05 10:48:44',10.08,20.00,9.92,'payment','cash',NULL,NULL),(392,412,NULL,'2026-07-05 10:49:21',12.28,20.00,7.72,'payment','cash',NULL,NULL),(393,413,NULL,'2026-07-05 10:50:01',7.00,7.00,0.00,'payment','cash',NULL,NULL),(394,414,NULL,'2026-07-05 10:50:16',7.56,10.00,2.44,'payment','cash',NULL,NULL),(395,415,NULL,'2026-07-05 10:50:50',7.00,20.00,13.00,'payment','cash',NULL,NULL),(396,416,NULL,'2026-07-05 10:51:15',10.36,20.00,9.64,'payment','cash',NULL,NULL),(397,417,NULL,'2026-07-05 10:51:53',9.24,9.24,0.00,'payment','cash',NULL,NULL),(398,418,NULL,'2026-07-05 10:52:05',7.84,20.00,12.16,'payment','cash',NULL,NULL),(399,419,NULL,'2026-07-05 10:52:46',7.00,10.00,3.00,'payment','cash',NULL,NULL),(400,420,NULL,'2026-07-05 10:52:56',17.92,20.00,2.08,'payment','cash',NULL,NULL),(401,421,NULL,'2026-07-05 10:53:42',7.00,7.00,0.00,'payment','cash',NULL,NULL),(402,424,NULL,'2026-07-05 10:55:08',1.50,1.50,0.00,'payment','cash',NULL,NULL),(403,425,NULL,'2026-07-05 10:55:20',1.50,1.50,0.00,'payment','cash',NULL,NULL),(404,426,NULL,'2026-07-05 10:55:49',17.00,20.00,3.00,'payment','cash',NULL,NULL),(405,354,NULL,'2026-07-05 10:56:08',7.00,10.00,3.00,'payment','cash',NULL,NULL),(406,428,NULL,'2026-07-05 10:56:29',7.00,10.00,3.00,'payment','cash',NULL,NULL),(407,429,NULL,'2026-07-05 10:56:39',7.00,20.00,13.00,'payment','cash',NULL,NULL),(408,430,NULL,'2026-07-05 10:57:05',1.50,5.00,3.50,'payment','cash',NULL,NULL),(409,432,NULL,'2026-07-05 10:57:28',7.00,7.00,0.00,'payment','cash',NULL,NULL),(410,433,NULL,'2026-07-05 10:57:57',7.00,20.00,13.00,'payment','cash',NULL,NULL),(411,434,NULL,'2026-07-05 10:58:14',15.96,20.00,4.04,'payment','cash',NULL,NULL),(412,436,NULL,'2026-07-05 10:59:07',1.50,1.50,0.00,'payment','cash',NULL,NULL),(413,437,NULL,'2026-07-05 10:59:24',1.50,1.50,0.00,'payment','cash',NULL,NULL),(414,435,NULL,'2026-07-05 10:59:35',1.50,1.50,0.00,'payment','cash',NULL,NULL),(415,423,NULL,'2026-07-05 11:01:55',9.80,10.00,0.20,'payment','cash',NULL,NULL),(416,392,NULL,'2026-07-05 11:02:11',15.68,20.00,4.32,'payment','cash',NULL,NULL),(417,422,NULL,'2026-07-05 11:04:21',7.00,7.00,0.00,'payment','cash',NULL,NULL),(418,402,NULL,'2026-07-05 11:10:55',7.00,10.00,3.00,'payment','cash',NULL,NULL),(419,438,NULL,'2026-08-02 09:45:25',7.00,20.00,13.00,'payment','cash',NULL,NULL),(420,442,NULL,'2026-08-02 09:46:27',18.48,20.00,1.52,'payment','cash',NULL,NULL),(421,297,NULL,'2026-08-02 09:47:10',7.00,10.00,3.00,'payment','cash',NULL,NULL),(422,444,NULL,'2026-08-02 09:47:40',7.00,10.00,3.00,'payment','cash',NULL,NULL),(423,445,NULL,'2026-08-02 09:48:24',10.92,11.00,0.08,'payment','cash',NULL,NULL),(424,446,NULL,'2026-08-02 09:48:47',7.84,8.00,0.16,'payment','cash',NULL,NULL),(425,448,NULL,'2026-08-02 09:49:23',7.00,10.00,3.00,'payment','cash',NULL,NULL),(426,449,NULL,'2026-08-02 09:50:04',7.00,10.00,3.00,'payment','cash',NULL,NULL),(427,450,NULL,'2026-08-02 09:50:35',21.56,40.00,18.44,'payment','cash',NULL,NULL),(428,451,NULL,'2026-08-02 09:51:04',7.56,20.00,12.44,'payment','cash',NULL,NULL),(429,452,NULL,'2026-08-02 09:51:45',7.00,20.00,13.00,'payment','cash',NULL,NULL),(430,453,NULL,'2026-08-02 09:52:19',8.12,18.44,10.32,'payment','cash',NULL,NULL),(431,454,NULL,'2026-08-02 09:52:46',7.00,20.00,13.00,'payment','cash',NULL,NULL),(432,455,NULL,'2026-08-02 09:53:08',14.00,20.00,6.00,'payment','cash',NULL,NULL),(433,383,NULL,'2026-08-02 09:53:32',7.00,13.00,6.00,'payment','cash',NULL,NULL),(434,457,NULL,'2026-08-02 09:54:04',9.24,10.00,0.76,'payment','cash',NULL,NULL),(435,239,NULL,'2026-08-02 09:54:39',5.50,5.50,0.00,'payment','cash',NULL,NULL),(436,459,NULL,'2026-08-02 09:55:09',1.50,1.50,0.00,'payment','cash',NULL,NULL),(437,460,NULL,'2026-08-02 09:55:29',7.00,25.00,0.08,'payment','cash',NULL,NULL),(438,387,NULL,'2026-08-02 09:55:29',17.92,25.00,0.08,'payment','cash',NULL,NULL),(439,461,NULL,'2026-08-02 09:55:56',7.00,7.00,0.00,'payment','cash',NULL,NULL),(440,462,NULL,'2026-08-02 09:56:08',7.00,20.00,13.00,'payment','cash',NULL,NULL),(441,463,NULL,'2026-08-02 09:56:33',7.56,20.00,12.44,'payment','cash',NULL,NULL),(442,464,NULL,'2026-08-02 09:57:12',7.00,7.00,0.00,'payment','cash',NULL,NULL),(443,465,NULL,'2026-08-02 09:57:41',7.00,7.00,0.00,'payment','cash',NULL,NULL),(444,466,NULL,'2026-08-02 09:58:05',7.00,7.00,0.00,'payment','cash',NULL,NULL),(445,469,NULL,'2026-08-02 09:58:49',7.00,7.00,0.00,'payment','cash',NULL,NULL),(446,471,NULL,'2026-08-02 09:59:28',7.00,20.00,13.00,'payment','cash',NULL,NULL),(447,472,NULL,'2026-08-02 09:59:42',7.00,10.00,3.00,'payment','cash',NULL,NULL),(448,473,NULL,'2026-08-02 09:59:59',7.56,10.00,2.44,'payment','cash',NULL,NULL),(449,474,NULL,'2026-08-02 10:00:30',7.00,20.00,2.64,'payment','cash',NULL,NULL),(450,328,NULL,'2026-08-02 10:00:30',10.36,20.00,2.64,'payment','cash',NULL,NULL),(451,475,NULL,'2026-08-02 10:00:58',7.00,7.00,0.00,'payment','cash',NULL,NULL),(452,478,NULL,'2026-08-02 10:03:09',7.00,7.00,0.00,'payment','cash',NULL,NULL),(453,479,NULL,'2026-08-02 10:03:54',9.52,20.00,10.48,'payment','cash',NULL,NULL),(454,480,NULL,'2026-08-02 10:04:42',10.64,20.00,9.36,'payment','cash',NULL,NULL),(455,481,NULL,'2026-08-02 10:05:17',7.00,10.00,3.00,'payment','cash',NULL,NULL),(456,482,NULL,'2026-08-02 10:05:54',7.00,13.00,6.00,'payment','cash',NULL,NULL),(457,510,NULL,'2026-08-02 10:06:18',7.00,20.00,6.00,'payment','cash',NULL,NULL),(458,410,NULL,'2026-08-02 10:06:18',7.00,20.00,6.00,'payment','cash',NULL,NULL),(459,483,NULL,'2026-08-02 10:06:43',7.00,20.00,13.00,'payment','cash',NULL,NULL),(460,484,NULL,'2026-08-02 10:07:29',7.00,20.00,13.00,'payment','cash',NULL,NULL),(461,485,NULL,'2026-08-02 10:07:48',7.00,10.00,3.00,'payment','cash',NULL,NULL),(462,486,NULL,'2026-08-02 10:08:30',8.12,20.00,11.88,'payment','cash',NULL,NULL),(463,487,NULL,'2026-08-02 10:09:00',7.00,10.00,3.00,'payment','cash',NULL,NULL),(464,488,NULL,'2026-08-02 10:09:26',8.96,20.00,11.04,'payment','cash',NULL,NULL),(465,489,NULL,'2026-08-02 10:09:45',8.68,11.04,2.36,'payment','cash',NULL,NULL),(466,490,NULL,'2026-08-02 10:10:17',8.68,20.00,11.32,'payment','cash',NULL,NULL),(467,492,NULL,'2026-08-02 10:11:04',16.52,20.00,3.48,'payment','cash',NULL,NULL),(468,493,NULL,'2026-08-02 10:11:27',7.00,13.00,6.00,'payment','cash',NULL,NULL),(469,494,NULL,'2026-08-02 10:11:56',7.00,20.00,13.00,'payment','cash',NULL,NULL),(470,495,NULL,'2026-08-02 10:13:16',7.28,7.28,0.00,'payment','cash',NULL,NULL),(471,496,NULL,'2026-08-02 10:13:23',1.50,1.50,0.00,'payment','cash',NULL,NULL),(472,497,NULL,'2026-08-02 10:13:42',1.50,1.50,0.00,'payment','cash',NULL,NULL),(473,498,NULL,'2026-08-02 10:14:06',10.36,20.00,9.64,'payment','cash',NULL,NULL),(474,501,NULL,'2026-08-02 10:14:22',8.68,9.64,0.96,'payment','cash',NULL,NULL),(475,427,NULL,'2026-08-02 10:14:46',7.00,7.00,0.00,'payment','cash',NULL,NULL),(476,502,NULL,'2026-08-02 10:15:12',1.50,10.00,8.50,'payment','cash',NULL,NULL),(477,504,NULL,'2026-08-02 10:15:24',7.00,8.50,1.50,'payment','cash',NULL,NULL),(478,503,NULL,'2026-08-02 10:16:13',7.56,40.00,6.20,'payment','cash',NULL,NULL),(479,431,NULL,'2026-08-02 10:16:13',19.24,40.00,6.20,'payment','cash',NULL,NULL),(480,358,NULL,'2026-08-02 10:16:13',7.00,40.00,6.20,'payment','cash',NULL,NULL),(481,505,NULL,'2026-08-02 10:16:33',7.00,7.00,0.00,'payment','cash',NULL,NULL),(482,506,NULL,'2026-08-02 10:16:53',10.08,20.00,9.92,'payment','cash',NULL,NULL),(483,507,NULL,'2026-08-02 10:17:26',1.50,1.50,0.00,'payment','cash',NULL,NULL),(484,508,NULL,'2026-08-02 10:17:42',1.50,1.50,0.00,'payment','cash',NULL,NULL),(485,509,NULL,'2026-08-02 10:17:54',1.50,1.50,0.00,'payment','cash',NULL,NULL),(486,476,NULL,'2026-08-02 10:19:06',7.84,10.00,2.16,'payment','cash',NULL,NULL);
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
  `meter_type` enum('consumo','riego') NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `base_limit` int NOT NULL,
  `excess_price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`rate_id`),
  CONSTRAINT `rates_chk_1` CHECK ((`base_limit` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rates`
--

LOCK TABLES `rates` WRITE;
/*!40000 ALTER TABLE `rates` DISABLE KEYS */;
INSERT INTO `rates` VALUES (1,'consumo',1.50,10,0.28,1,'2026-02-01','9999-12-31'),(2,'riego',5.50,20,0.28,1,'2026-02-01','9999-12-31');
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
  `month_year` varchar(100) NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=959 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `readings`
--

LOCK TABLES `readings` WRITE;
/*!40000 ALTER TABLE `readings` DISABLE KEYS */;
INSERT INTO `readings` VALUES (1,1,1,1,'2026-01',541,547,6,0,1.50),(2,1,2,2,'2026-01',2276,2302,26,6,7.18),(3,2,3,1,'2026-01',833,844,11,1,1.78),(4,2,4,2,'2026-01',1294,1303,9,0,5.50),(5,3,5,1,'2026-01',279,279,0,0,1.50),(6,3,6,2,'2026-01',1666,1667,1,0,5.50),(7,4,7,1,'2026-01',1173,1184,11,1,1.78),(8,4,8,2,'2026-01',629,738,109,89,30.42),(9,5,9,1,'2026-01',133,134,1,0,1.50),(10,5,10,2,'2026-01',1,1,0,0,5.50),(11,6,11,1,'2026-01',21,27,6,0,1.50),(12,6,12,2,'2026-01',30,40,10,0,5.50),(13,7,13,1,'2026-01',180,181,1,0,1.50),(14,7,14,2,'2026-01',535,540,5,0,5.50),(15,8,15,1,'2026-01',975,982,7,0,1.50),(16,8,16,2,'2026-01',1628,1636,8,0,5.50),(17,9,17,1,'2026-01',284,285,1,0,1.50),(18,9,18,2,'2026-01',1130,1136,6,0,5.50),(19,10,19,1,'2026-01',571,578,7,0,1.50),(20,10,20,2,'2026-01',986,991,5,0,5.50),(21,11,21,1,'2026-01',1,1,0,0,1.50),(22,11,22,2,'2026-01',1,1,0,0,5.50),(23,12,23,1,'2026-01',512,522,10,0,1.50),(24,12,24,2,'2026-01',1092,1092,0,0,5.50),(25,13,25,1,'2026-01',1,1,0,0,1.50),(26,13,26,2,'2026-01',1920,1938,18,0,5.50),(27,14,27,1,'2026-01',272,278,6,0,1.50),(28,14,28,2,'2026-01',440,453,13,0,5.50),(30,15,30,2,'2026-01',1,1,0,0,5.50),(31,16,31,1,'2026-01',70,71,1,0,1.50),(32,16,32,2,'2026-01',1,1,0,0,5.50),(33,17,33,1,'2026-01',15,17,2,0,1.50),(34,17,34,2,'2026-01',1136,1162,26,6,7.18),(35,18,35,1,'2026-01',245,247,2,0,1.50),(36,18,36,2,'2026-01',1263,1264,1,0,5.50),(37,19,37,1,'2026-01',623,632,9,0,1.50),(38,19,38,2,'2026-01',1223,1254,31,11,8.58),(39,20,39,1,'2026-01',776,784,8,0,1.50),(40,20,40,2,'2026-01',2396,2423,27,7,7.46),(41,21,41,1,'2026-01',172,176,4,0,1.50),(42,21,42,2,'2026-01',3050,3118,68,48,18.94),(43,22,43,1,'2026-01',189,192,3,0,1.50),(44,22,44,2,'2026-01',586,586,0,0,5.50),(45,23,45,1,'2026-01',1,1,0,0,1.50),(46,23,46,2,'2026-01',1,1,0,0,5.50),(47,24,47,1,'2026-01',168,170,2,0,1.50),(48,24,48,2,'2026-01',1,1,0,0,5.50),(49,25,49,1,'2026-01',25,26,1,0,1.50),(50,25,50,2,'2026-01',1473,1534,61,41,16.98),(51,26,51,1,'2026-01',30,35,5,0,1.50),(52,26,52,2,'2026-01',1072,1099,27,7,7.46),(53,27,53,1,'2026-01',742,754,12,2,2.06),(54,27,54,2,'2026-01',2526,2576,50,30,13.90),(55,28,55,1,'2026-01',728,736,8,0,1.50),(56,28,56,2,'2026-01',3472,3497,25,5,6.90),(57,29,57,1,'2026-01',1,1,0,0,1.50),(58,29,58,2,'2026-01',1,1,0,0,5.50),(59,30,59,1,'2026-01',371,371,0,0,1.50),(60,30,60,2,'2026-01',1,1,0,0,5.50),(61,31,61,1,'2026-01',351,356,5,0,1.50),(62,31,62,2,'2026-01',962,967,5,0,5.50),(63,32,63,1,'2026-01',961,971,10,0,1.50),(64,32,64,2,'2026-01',5681,5736,55,35,15.30),(65,33,65,1,'2026-01',480,480,0,0,1.50),(66,33,66,2,'2026-01',1141,1141,0,0,5.50),(67,34,67,1,'2026-01',680,687,7,0,1.50),(68,34,68,2,'2026-01',1509,1514,5,0,5.50),(69,35,69,1,'2026-01',528,529,1,0,1.50),(70,35,70,2,'2026-01',1955,1959,4,0,5.50),(71,36,71,1,'2026-01',557,562,5,0,1.50),(72,36,72,2,'2026-01',870,870,0,0,5.50),(73,37,73,1,'2026-01',728,735,7,0,1.50),(74,37,74,2,'2026-01',3132,3142,10,0,5.50),(75,38,75,1,'2026-01',477,481,4,0,1.50),(76,38,76,2,'2026-01',2032,2052,20,0,5.50),(77,39,77,1,'2026-01',1276,1289,13,3,2.34),(78,39,78,2,'2026-01',2101,2129,28,8,7.74),(79,40,79,1,'2026-01',801,801,0,0,1.50),(80,40,80,2,'2026-01',1429,1482,53,33,14.74),(81,41,81,1,'2026-01',1,7,6,0,1.50),(82,41,82,2,'2026-01',1476,1505,29,9,8.02),(83,42,83,1,'2026-01',228,228,0,0,1.50),(84,42,84,2,'2026-01',1212,1212,0,0,5.50),(85,43,85,1,'2026-01',1027,1038,11,1,1.78),(86,43,86,2,'2026-01',51,51,0,0,5.50),(87,44,87,1,'2026-01',398,402,4,0,1.50),(88,44,88,2,'2026-01',1,1,0,0,5.50),(89,45,89,1,'2026-01',500,502,2,0,1.50),(90,45,90,2,'2026-01',2333,2340,7,0,5.50),(91,46,91,1,'2026-01',559,562,3,0,1.50),(92,47,92,2,'2026-01',829,838,9,0,5.50),(93,47,93,1,'2026-01',1,1,0,0,1.50),(94,48,94,1,'2026-01',97,97,0,0,1.50),(95,48,95,2,'2026-01',24,24,0,0,5.50),(96,49,96,1,'2026-01',466,469,3,0,1.50),(97,49,97,2,'2026-01',1890,1898,8,0,5.50),(98,50,98,1,'2026-01',582,586,4,0,1.50),(99,51,99,1,'2026-01',983,992,9,0,1.50),(100,51,100,2,'2026-01',2091,2129,38,18,10.54),(101,52,101,1,'2026-01',1,1,0,0,1.50),(102,52,102,2,'2026-01',1,1,0,0,5.50),(103,53,103,1,'2026-01',295,295,0,0,1.50),(104,53,104,2,'2026-01',1,1,0,0,5.50),(105,54,105,1,'2026-01',1123,1140,17,7,3.46),(106,54,106,2,'2026-01',2159,2159,0,0,5.50),(107,55,107,1,'2026-01',1655,1657,2,0,1.50),(108,56,108,1,'2026-01',261,263,2,0,1.50),(109,57,109,1,'2026-01',25,25,0,0,1.50),(110,58,110,1,'2026-01',590,601,11,1,1.78),(111,58,111,2,'2026-01',2728,2793,65,45,18.10),(112,59,114,2,'2026-01',1917,1946,29,9,8.02),(113,59,117,1,'2026-01',1,1,0,0,1.50),(114,60,116,2,'2026-01',1,1,0,0,5.50),(115,60,115,1,'2026-01',2005,2036,31,21,7.38),(116,61,112,1,'2026-01',892,903,11,1,1.78),(117,61,113,2,'2026-01',2140,2149,9,0,5.50),(118,62,119,2,'2026-01',1571,1579,8,0,5.50),(119,62,118,1,'2026-01',831,840,9,0,1.50),(120,63,120,1,'2026-01',165,167,2,0,1.50),(121,63,121,2,'2026-01',267,267,0,0,5.50),(122,64,122,1,'2026-01',523,526,3,0,1.50),(123,64,123,2,'2026-01',37,42,5,0,5.50),(124,65,125,2,'2026-01',1666,1667,1,0,5.50),(125,65,124,1,'2026-01',1,1,0,0,1.50),(126,66,126,1,'2026-01',195,197,2,0,1.50),(127,66,127,2,'2026-01',1465,1484,19,0,5.50),(128,67,128,1,'2026-01',340,341,1,0,1.50),(129,67,129,2,'2026-01',778,779,1,0,5.50),(130,68,130,1,'2026-01',544,549,5,0,1.50),(131,69,131,1,'2026-01',461,462,1,0,1.50),(132,70,133,2,'2026-01',3287,3300,13,0,5.50),(133,70,132,1,'2026-01',762,766,4,0,1.50),(134,71,135,2,'2026-01',1,1,0,0,5.50),(135,71,134,1,'2026-01',1,1,0,0,1.50),(136,72,136,1,'2026-01',57,58,1,0,1.50),(137,73,1,1,'2026-02',547,548,1,0,1.50),(138,73,2,2,'2026-02',2302,2302,0,0,5.50),(139,74,3,1,'2026-02',844,863,19,9,4.02),(140,74,4,2,'2026-02',1303,1303,0,0,5.50),(141,75,5,1,'2026-02',279,280,1,0,1.50),(142,75,6,2,'2026-02',1667,1669,2,0,5.50),(143,76,124,1,'2026-02',1,1,0,0,1.50),(144,76,125,2,'2026-02',1667,1700,33,13,9.14),(145,77,7,1,'2026-02',1184,1196,12,2,2.06),(146,77,8,2,'2026-02',738,738,0,0,5.50),(147,78,9,1,'2026-02',134,135,1,0,1.50),(148,78,10,2,'2026-02',1,1,0,0,5.50),(149,79,11,1,'2026-02',27,27,0,0,1.50),(150,79,12,2,'2026-02',40,40,0,0,5.50),(151,80,13,1,'2026-02',181,182,1,0,1.50),(152,80,14,2,'2026-02',540,545,5,0,5.50),(153,81,15,1,'2026-02',982,992,10,0,1.50),(154,81,16,2,'2026-02',1636,1640,4,0,5.50),(155,82,17,1,'2026-02',285,286,1,0,1.50),(156,82,18,2,'2026-02',1136,1136,0,0,5.50),(157,83,19,1,'2026-02',578,588,10,0,1.50),(158,83,20,2,'2026-02',991,993,2,0,5.50),(159,84,126,1,'2026-02',197,198,1,0,1.50),(160,84,127,2,'2026-02',1484,1486,2,0,5.50),(161,85,117,1,'2026-02',1,1,0,0,1.50),(162,85,114,2,'2026-02',1946,1951,5,0,5.50),(163,86,110,1,'2026-02',601,615,14,4,2.62),(164,86,111,2,'2026-02',2793,2800,7,0,5.50),(165,87,21,1,'2026-02',1,1,0,0,1.50),(166,87,22,2,'2026-02',1,1,0,0,5.50),(167,88,115,1,'2026-02',2036,2048,12,2,2.06),(168,88,116,2,'2026-02',1,1,0,0,5.50),(169,89,23,1,'2026-02',522,530,8,0,1.50),(170,89,24,2,'2026-02',1092,1092,0,0,5.50),(171,90,128,1,'2026-02',341,344,3,0,1.50),(172,90,129,2,'2026-02',779,810,31,11,8.58),(173,91,25,1,'2026-02',1,1,0,0,1.50),(174,91,26,2,'2026-02',1938,1967,29,9,8.02),(175,92,27,1,'2026-02',278,285,7,0,1.50),(176,92,28,2,'2026-02',453,453,0,0,5.50),(178,93,30,2,'2026-02',1,1,0,0,5.50),(179,94,130,1,'2026-02',549,550,1,0,1.50),(180,95,31,1,'2026-02',71,71,0,0,1.50),(181,95,32,2,'2026-02',1,1,0,0,5.50),(182,96,33,1,'2026-02',17,20,3,0,1.50),(183,96,34,2,'2026-02',1162,1162,0,0,5.50),(184,97,35,1,'2026-02',247,251,4,0,1.50),(185,97,36,2,'2026-02',1264,1264,0,0,5.50),(186,98,37,1,'2026-02',632,638,6,0,1.50),(187,98,38,2,'2026-02',1254,1254,0,0,5.50),(188,99,39,1,'2026-02',784,793,9,0,1.50),(189,99,40,2,'2026-02',2423,2423,0,0,5.50),(190,100,43,1,'2026-02',192,196,4,0,1.50),(191,100,44,2,'2026-02',586,586,0,0,5.50),(192,101,45,1,'2026-02',1,1,0,0,1.50),(193,101,46,2,'2026-02',1,1,0,0,5.50),(194,102,47,1,'2026-02',170,172,2,0,1.50),(195,102,48,2,'2026-02',1,1,0,0,5.50),(196,103,131,1,'2026-02',462,463,1,0,1.50),(197,104,49,1,'2026-02',26,26,0,0,1.50),(198,105,122,1,'2026-02',526,531,5,0,1.50),(199,105,123,2,'2026-02',42,74,32,12,8.86),(200,106,51,1,'2026-02',35,42,7,0,1.50),(201,106,52,2,'2026-02',1099,1103,4,0,5.50),(202,107,53,1,'2026-02',754,765,11,1,1.78),(203,107,54,2,'2026-02',2576,2576,0,0,5.50),(204,108,132,1,'2026-02',766,776,10,0,1.50),(205,108,133,2,'2026-02',3300,3306,6,0,5.50),(206,109,112,1,'2026-02',903,913,10,0,1.50),(207,109,113,2,'2026-02',2149,2169,20,0,5.50),(208,110,55,1,'2026-02',736,740,4,0,1.50),(209,110,56,2,'2026-02',3497,3497,0,0,5.50),(210,111,57,1,'2026-02',1,1,0,0,1.50),(211,111,58,2,'2026-02',1,1,0,0,5.50),(212,112,59,1,'2026-02',371,371,0,0,1.50),(213,112,60,2,'2026-02',1,1,0,0,5.50),(214,113,61,1,'2026-02',356,361,5,0,1.50),(215,113,62,2,'2026-02',967,968,1,0,5.50),(216,114,63,1,'2026-02',971,985,14,4,2.62),(217,114,64,2,'2026-02',5736,5746,10,0,5.50),(218,115,65,1,'2026-02',480,480,0,0,1.50),(219,115,66,2,'2026-02',1141,1141,0,0,5.50),(220,116,67,1,'2026-02',687,697,10,0,1.50),(221,116,68,2,'2026-02',1514,1526,12,0,5.50),(222,117,69,1,'2026-02',529,532,3,0,1.50),(223,117,70,2,'2026-02',1959,1962,3,0,5.50),(224,118,71,1,'2026-02',562,571,9,0,1.50),(225,118,72,2,'2026-02',870,870,0,0,5.50),(226,119,73,1,'2026-02',735,740,5,0,1.50),(227,119,74,2,'2026-02',3142,3142,0,0,5.50),(228,120,118,1,'2026-02',840,851,11,1,1.78),(229,120,119,2,'2026-02',1579,1579,0,0,5.50),(230,121,75,1,'2026-02',481,486,5,0,1.50),(231,121,76,2,'2026-02',2052,2062,10,0,5.50),(232,122,77,1,'2026-02',1289,1301,12,2,2.06),(233,122,78,2,'2026-02',2129,2129,0,0,5.50),(234,123,79,1,'2026-02',801,801,0,0,1.50),(235,123,80,2,'2026-02',1482,1482,0,0,5.50),(236,124,81,1,'2026-02',7,17,10,0,1.50),(237,124,82,2,'2026-02',1505,1505,0,0,5.50),(238,125,83,1,'2026-02',228,228,0,0,1.50),(239,125,84,2,'2026-02',1212,1212,0,0,5.50),(240,126,85,1,'2026-02',1038,1051,13,3,2.34),(241,126,86,2,'2026-02',51,51,0,0,5.50),(242,127,87,1,'2026-02',402,405,3,0,1.50),(243,127,88,2,'2026-02',1,1,0,0,5.50),(244,128,120,1,'2026-02',167,168,1,0,1.50),(245,128,121,2,'2026-02',267,267,0,0,5.50),(246,129,89,1,'2026-02',502,504,2,0,1.50),(247,129,90,2,'2026-02',2340,2340,0,0,5.50),(248,130,136,1,'2026-02',58,58,0,0,1.50),(249,131,91,1,'2026-02',562,565,3,0,1.50),(250,132,93,1,'2026-02',1,1,0,0,1.50),(251,132,92,2,'2026-02',838,838,0,0,5.50),(252,133,134,1,'2026-02',1,1,0,0,1.50),(253,133,135,2,'2026-02',1,1,0,0,5.50),(254,134,94,1,'2026-02',97,97,0,0,1.50),(255,134,95,2,'2026-02',24,24,0,0,5.50),(256,135,96,1,'2026-02',469,476,7,0,1.50),(257,135,97,2,'2026-02',1898,1900,2,0,5.50),(258,136,98,1,'2026-02',586,593,7,0,1.50),(259,137,99,1,'2026-02',992,1003,11,1,1.78),(260,137,100,2,'2026-02',2129,2129,0,0,5.50),(261,138,101,1,'2026-02',1,1,0,0,1.50),(262,138,102,2,'2026-02',1,1,0,0,5.50),(263,139,103,1,'2026-02',295,296,1,0,1.50),(264,139,104,2,'2026-02',1,1,0,0,5.50),(265,140,105,1,'2026-02',1140,1156,16,6,3.18),(266,140,106,2,'2026-02',2159,2159,0,0,5.50),(267,141,107,1,'2026-02',1657,1658,1,0,1.50),(268,142,108,1,'2026-02',263,266,3,0,1.50),(269,143,109,1,'2026-02',25,25,0,0,1.50),(270,144,138,2,'2026-01',1,1,0,0,5.50),(271,144,137,1,'2026-01',220,220,0,0,1.50),(272,145,138,2,'2026-02',1,1,0,0,5.50),(273,145,137,1,'2026-02',220,220,0,0,1.50),(274,146,42,2,'2026-02',3118,3144,26,6,7.18),(275,146,41,1,'2026-02',176,179,3,0,1.50),(276,147,1,1,'2026-03',548,559,11,1,1.78),(277,147,2,2,'2026-03',2302,2368,66,46,18.38),(278,148,75,1,'2026-03',486,490,4,0,1.50),(279,148,76,2,'2026-03',2062,2114,52,32,14.46),(280,149,5,1,'2026-03',280,280,0,0,1.50),(281,149,6,2,'2026-03',1669,1669,0,0,5.50),(282,150,124,1,'2026-03',1,1,0,0,1.50),(283,150,125,2,'2026-03',1700,1869,169,149,47.22),(284,151,3,1,'2026-03',863,900,37,27,9.06),(285,151,4,2,'2026-03',1303,1311,8,0,5.50),(286,152,7,1,'2026-03',1196,1197,1,0,1.50),(287,152,8,2,'2026-03',738,801,63,43,17.54),(288,153,9,1,'2026-03',135,136,1,0,1.50),(289,153,10,2,'2026-03',1,1,0,0,5.50),(290,154,11,1,'2026-03',27,27,0,0,1.50),(291,154,12,2,'2026-03',40,40,0,0,5.50),(292,155,13,1,'2026-03',182,182,0,0,1.50),(293,155,14,2,'2026-03',545,545,0,0,5.50),(294,156,15,1,'2026-03',992,998,6,0,1.50),(295,156,16,2,'2026-03',1640,1647,7,0,5.50),(296,157,17,1,'2026-03',286,290,4,0,1.50),(297,157,18,2,'2026-03',1136,1136,0,0,5.50),(298,158,126,1,'2026-03',198,199,1,0,1.50),(299,158,127,2,'2026-03',1486,1505,19,0,5.50),(300,159,19,1,'2026-03',588,596,8,0,1.50),(301,159,20,2,'2026-03',993,997,4,0,5.50),(302,160,117,1,'2026-03',1,1,0,0,1.50),(303,160,114,2,'2026-03',1951,2021,70,50,19.50),(304,161,110,1,'2026-03',615,626,11,1,1.78),(305,161,111,2,'2026-03',2800,2942,142,122,39.66),(306,162,21,1,'2026-03',1,1,0,0,1.50),(307,162,22,2,'2026-03',1,1,0,0,5.50),(308,163,115,1,'2026-03',2048,2086,38,28,9.34),(309,163,116,2,'2026-03',1,1,0,0,5.50),(310,164,23,1,'2026-03',530,541,11,1,1.78),(311,164,24,2,'2026-03',1092,1092,0,0,5.50),(312,165,128,1,'2026-03',344,346,2,0,1.50),(313,165,129,2,'2026-03',810,831,21,1,5.78),(314,166,25,1,'2026-03',1,1,0,0,1.50),(315,166,26,2,'2026-03',1967,1995,28,8,7.74),(316,167,27,1,'2026-03',285,292,7,0,1.50),(317,167,28,2,'2026-03',453,474,21,1,5.78),(318,168,30,2,'2026-03',1,1,0,0,5.50),(319,169,130,1,'2026-03',550,552,2,0,1.50),(320,170,33,1,'2026-03',20,24,4,0,1.50),(321,170,34,2,'2026-03',1162,1194,32,12,8.86),(322,171,35,1,'2026-03',251,253,2,0,1.50),(323,171,36,2,'2026-03',1264,1274,10,0,5.50),(324,172,37,1,'2026-03',638,646,8,0,1.50),(325,172,38,2,'2026-03',1254,1295,41,21,11.38),(326,173,39,1,'2026-03',793,801,8,0,1.50),(327,173,40,2,'2026-03',2423,2454,31,11,8.58),(328,174,41,1,'2026-03',179,188,9,0,1.50),(329,174,42,2,'2026-03',3144,3191,47,27,13.06),(330,175,43,1,'2026-03',196,202,6,0,1.50),(331,175,44,2,'2026-03',586,586,0,0,5.50),(332,176,137,1,'2026-03',220,220,0,0,1.50),(333,176,138,2,'2026-03',1,1,0,0,5.50),(334,177,47,1,'2026-03',172,173,1,0,1.50),(335,177,48,2,'2026-03',1,1,0,0,5.50),(336,178,131,1,'2026-03',463,463,0,0,1.50),(337,179,122,1,'2026-03',531,538,7,0,1.50),(338,179,123,2,'2026-03',74,76,2,0,5.50),(339,180,51,1,'2026-03',42,51,9,0,1.50),(340,180,52,2,'2026-03',1103,1125,22,2,6.06),(341,181,120,1,'2026-03',168,174,6,0,1.50),(342,181,121,2,'2026-03',267,267,0,0,5.50),(343,182,53,1,'2026-03',765,779,14,4,2.62),(344,182,54,2,'2026-03',2576,2597,21,1,5.78),(345,183,132,1,'2026-03',776,779,3,0,1.50),(346,183,133,2,'2026-03',3306,3358,52,32,14.46),(347,184,112,1,'2026-03',913,920,7,0,1.50),(348,184,113,2,'2026-03',2169,2220,51,31,14.18),(349,185,55,1,'2026-03',740,746,6,0,1.50),(350,185,56,2,'2026-03',3497,3556,59,39,16.42),(351,186,57,1,'2026-03',1,1,0,0,1.50),(352,186,58,2,'2026-03',1,1,0,0,5.50),(353,187,32,2,'2026-03',1,1,0,0,5.50),(354,187,31,1,'2026-03',71,71,0,0,1.50),(355,188,59,1,'2026-03',371,371,0,0,1.50),(356,188,60,2,'2026-03',1,1,0,0,5.50),(357,189,61,1,'2026-03',361,366,5,0,1.50),(358,189,62,2,'2026-03',968,977,9,0,5.50),(359,190,63,1,'2026-03',985,996,11,1,1.78),(360,190,64,2,'2026-03',5746,6037,291,271,81.38),(361,191,65,1,'2026-03',480,485,5,0,1.50),(362,191,66,2,'2026-03',1141,1141,0,0,5.50),(363,192,67,1,'2026-03',697,700,3,0,1.50),(364,192,68,2,'2026-03',1526,1526,0,0,5.50),(365,193,69,1,'2026-03',532,534,2,0,1.50),(366,193,70,2,'2026-03',1962,1995,33,13,9.14),(367,194,71,1,'2026-03',571,585,14,4,2.62),(368,194,72,2,'2026-03',870,870,0,0,5.50),(369,195,73,1,'2026-03',740,749,9,0,1.50),(370,195,74,2,'2026-03',3142,3207,65,45,18.10),(371,196,118,1,'2026-03',851,863,12,2,2.06),(372,196,119,2,'2026-03',1579,1600,21,1,5.78),(373,197,77,1,'2026-03',1301,1317,16,6,3.18),(374,197,78,2,'2026-03',2129,2129,0,0,5.50),(375,198,79,1,'2026-03',801,801,0,0,1.50),(376,198,80,2,'2026-03',1482,1482,0,0,5.50),(377,199,81,1,'2026-03',17,25,8,0,1.50),(378,199,82,2,'2026-03',1505,1535,30,10,8.30),(379,200,83,1,'2026-03',228,228,0,0,1.50),(380,200,84,2,'2026-03',1212,1212,0,0,5.50),(381,201,85,1,'2026-03',1051,1062,11,1,1.78),(382,201,86,2,'2026-03',51,51,0,0,5.50),(383,202,87,1,'2026-03',405,408,3,0,1.50),(384,202,88,2,'2026-03',1,1,0,0,5.50),(385,203,89,1,'2026-03',504,523,19,9,4.02),(386,203,90,2,'2026-03',2340,2360,20,0,5.50),(387,204,136,1,'2026-03',58,58,0,0,1.50),(388,205,91,1,'2026-03',565,571,6,0,1.50),(389,206,93,1,'2026-03',1,1,0,0,1.50),(390,206,92,2,'2026-03',838,838,0,0,5.50),(391,207,134,1,'2026-03',1,1,0,0,1.50),(392,207,135,2,'2026-03',1,1,0,0,5.50),(393,208,45,1,'2026-03',1,1,0,0,1.50),(394,208,46,2,'2026-03',1,1,0,0,5.50),(395,209,94,1,'2026-03',97,97,0,0,1.50),(396,209,95,2,'2026-03',24,24,0,0,5.50),(397,210,96,1,'2026-03',476,484,8,0,1.50),(398,210,97,2,'2026-03',1900,1900,0,0,5.50),(399,211,98,1,'2026-03',593,599,6,0,1.50),(400,212,99,1,'2026-03',1003,1017,14,4,2.62),(401,212,100,2,'2026-03',2129,2129,0,0,5.50),(402,213,101,1,'2026-03',1,1,0,0,1.50),(403,213,102,2,'2026-03',1,1,0,0,5.50),(404,214,103,1,'2026-03',296,305,9,0,1.50),(405,214,104,2,'2026-03',1,1,0,0,5.50),(406,215,105,1,'2026-03',1156,1171,15,5,2.90),(407,215,106,2,'2026-03',2159,2159,0,0,5.50),(408,216,107,1,'2026-03',1658,1661,3,0,1.50),(409,217,108,1,'2026-03',266,272,6,0,1.50),(410,218,109,1,'2026-03',25,25,0,0,1.50),(411,219,1,1,'2026-04',559,564,5,0,1.50),(412,219,2,2,'2026-04',2368,2432,64,44,17.82),(413,220,3,1,'2026-04',900,917,17,7,3.46),(414,220,4,2,'2026-04',1311,1311,0,0,5.50),(415,221,5,1,'2026-04',280,281,1,0,1.50),(416,221,6,2,'2026-04',1669,1672,3,0,5.50),(417,222,124,1,'2026-04',1,1,0,0,1.50),(418,222,125,2,'2026-04',1869,1938,69,49,19.22),(419,223,7,1,'2026-04',1197,1210,13,3,2.34),(420,223,8,2,'2026-04',801,939,138,118,38.54),(421,224,9,1,'2026-04',136,138,2,0,1.50),(422,224,10,2,'2026-04',1,1,0,0,5.50),(423,225,11,1,'2026-04',27,27,0,0,1.50),(424,225,12,2,'2026-04',40,40,0,0,5.50),(425,226,13,1,'2026-04',182,183,1,0,1.50),(426,226,14,2,'2026-04',545,547,2,0,5.50),(427,227,15,1,'2026-04',998,1010,12,2,2.06),(428,227,16,2,'2026-04',1647,1647,0,0,5.50),(429,228,17,1,'2026-04',290,294,4,0,1.50),(430,228,18,2,'2026-04',1136,1136,0,0,5.50),(431,229,20,2,'2026-04',997,997,0,0,5.50),(432,229,19,1,'2026-04',596,600,4,0,1.50),(433,230,126,1,'2026-04',199,200,1,0,1.50),(434,230,127,2,'2026-04',1505,1523,18,0,5.50),(435,231,117,1,'2026-04',1,1,0,0,1.50),(436,231,114,2,'2026-04',2021,2052,31,11,8.58),(437,232,111,2,'2026-04',2942,3014,72,52,20.06),(438,232,110,1,'2026-04',626,643,17,7,3.46),(439,233,21,1,'2026-04',1,1,0,0,1.50),(440,233,22,2,'2026-04',1,1,0,0,5.50),(441,234,116,2,'2026-04',1,79,78,58,21.74),(442,234,115,1,'2026-04',2086,2102,16,6,3.18),(443,235,23,1,'2026-04',541,552,11,1,1.78),(444,235,24,2,'2026-04',1092,1096,4,0,5.50),(445,236,129,2,'2026-04',831,858,27,7,7.46),(446,236,128,1,'2026-04',346,346,0,0,1.50),(447,237,26,2,'2026-04',1995,2015,20,0,5.50),(448,237,25,1,'2026-04',1,1,0,0,1.50),(449,238,27,1,'2026-04',292,315,23,13,5.14),(450,238,28,2,'2026-04',474,493,19,0,5.50),(451,239,30,2,'2026-04',1,1,0,0,5.50),(452,240,130,1,'2026-04',552,553,1,0,1.50),(453,241,32,2,'2026-04',1,1,0,0,5.50),(454,241,31,1,'2026-04',71,71,0,0,1.50),(455,242,34,2,'2026-04',1194,1217,23,3,6.34),(456,242,33,1,'2026-04',24,29,5,0,1.50),(457,243,35,1,'2026-04',253,263,10,0,1.50),(458,243,36,2,'2026-04',1274,1319,45,25,12.50),(459,244,37,1,'2026-04',646,659,13,3,2.34),(460,244,38,2,'2026-04',1295,1337,42,22,11.66),(461,245,40,2,'2026-04',2454,2502,48,28,13.34),(462,245,39,1,'2026-04',801,809,8,0,1.50),(463,246,42,2,'2026-04',3191,3234,43,23,11.94),(464,246,41,1,'2026-04',188,196,8,0,1.50),(465,247,43,1,'2026-04',202,206,4,0,1.50),(466,247,44,2,'2026-04',586,627,41,21,11.38),(467,248,138,2,'2026-04',1,1,0,0,5.50),(468,248,137,1,'2026-04',220,220,0,0,1.50),(469,249,46,2,'2026-04',1,1,0,0,5.50),(470,249,45,1,'2026-04',1,1,0,0,1.50),(471,250,47,1,'2026-04',173,174,1,0,1.50),(472,250,48,2,'2026-04',1,1,0,0,5.50),(473,251,131,1,'2026-04',463,463,0,0,1.50),(474,252,123,2,'2026-04',76,79,3,0,5.50),(475,252,122,1,'2026-04',538,547,9,0,1.50),(476,253,52,2,'2026-04',1125,1160,35,15,9.70),(477,253,51,1,'2026-04',51,60,9,0,1.50),(478,254,54,2,'2026-04',2597,2620,23,3,6.34),(479,254,53,1,'2026-04',779,794,15,5,2.90),(480,255,133,2,'2026-04',3358,3427,69,49,19.22),(481,255,132,1,'2026-04',779,784,5,0,1.50),(482,256,112,1,'2026-04',920,930,10,0,1.50),(483,256,113,2,'2026-04',2220,2240,20,0,5.50),(484,257,56,2,'2026-04',3556,3586,30,10,8.30),(485,257,55,1,'2026-04',746,756,10,0,1.50),(486,258,57,1,'2026-04',1,1,0,0,1.50),(487,258,58,2,'2026-04',1,1,0,0,5.50),(488,259,59,1,'2026-04',371,371,0,0,1.50),(489,259,60,2,'2026-04',1,1,0,0,5.50),(490,260,61,1,'2026-04',366,370,4,0,1.50),(491,260,62,2,'2026-04',977,990,13,0,5.50),(492,261,63,1,'2026-04',996,1013,17,7,3.46),(493,261,64,2,'2026-04',6037,6224,187,167,52.26),(494,262,66,2,'2026-04',1141,1141,0,0,5.50),(495,262,65,1,'2026-04',485,485,0,0,1.50),(496,263,68,2,'2026-04',1526,1529,3,0,5.50),(497,263,67,1,'2026-04',700,704,4,0,1.50),(498,264,70,2,'2026-04',1995,2026,31,11,8.58),(499,264,69,1,'2026-04',534,538,4,0,1.50),(500,265,72,2,'2026-04',870,898,28,8,7.74),(501,265,71,1,'2026-04',585,600,15,5,2.90),(502,266,74,2,'2026-04',3207,3230,23,3,6.34),(503,266,73,1,'2026-04',749,761,12,2,2.06),(504,267,118,1,'2026-04',863,878,15,5,2.90),(505,267,119,2,'2026-04',1600,1605,5,0,5.50),(506,268,75,1,'2026-04',490,494,4,0,1.50),(507,268,76,2,'2026-04',2114,2133,19,0,5.50),(508,269,78,2,'2026-04',2129,2145,16,0,5.50),(509,269,77,1,'2026-04',1317,1336,19,9,4.02),(510,270,79,1,'2026-04',801,824,23,13,5.14),(511,271,81,1,'2026-04',25,40,15,5,2.90),(512,272,83,1,'2026-04',228,228,0,0,1.50),(513,272,84,2,'2026-04',1212,1212,0,0,5.50),(514,273,85,1,'2026-04',1062,1080,18,8,3.74),(515,273,86,2,'2026-04',51,59,8,0,5.50),(516,274,87,1,'2026-04',408,413,5,0,1.50),(517,274,88,2,'2026-04',1,1,0,0,5.50),(518,275,120,1,'2026-04',174,187,13,3,2.34),(519,275,121,2,'2026-04',267,267,0,0,5.50),(520,276,90,2,'2026-04',2360,2380,20,0,5.50),(521,276,89,1,'2026-04',523,533,10,0,1.50),(522,277,136,1,'2026-04',58,59,1,0,1.50),(523,278,91,1,'2026-04',571,583,12,2,2.06),(524,279,93,1,'2026-04',1,1,0,0,1.50),(525,279,92,2,'2026-04',838,867,29,9,8.02),(526,280,134,1,'2026-04',1,1,0,0,1.50),(527,280,135,2,'2026-04',1,1,0,0,5.50),(528,281,94,1,'2026-04',97,100,3,0,1.50),(529,281,95,2,'2026-04',24,24,0,0,5.50),(530,282,97,2,'2026-04',1900,1921,21,1,5.78),(531,282,96,1,'2026-04',484,490,6,0,1.50),(532,283,98,1,'2026-04',599,608,9,0,1.50),(533,284,99,1,'2026-04',1017,1030,13,3,2.34),(534,284,100,2,'2026-04',2129,2129,0,0,5.50),(535,285,102,2,'2026-04',1,1,0,0,5.50),(536,285,101,1,'2026-04',1,1,0,0,1.50),(537,286,103,1,'2026-04',305,308,3,0,1.50),(538,286,104,2,'2026-04',1,1,0,0,5.50),(539,287,105,1,'2026-04',1171,1191,20,10,4.30),(540,287,106,2,'2026-04',2159,2160,1,0,5.50),(541,288,107,1,'2026-04',1661,1663,2,0,1.50),(542,289,108,1,'2026-04',272,275,3,0,1.50),(543,290,109,1,'2026-04',25,25,0,0,1.50),(544,271,82,2,'2026-04',1535,1551,16,0,5.50),(545,270,80,2,'2026-04',1482,1486,4,0,5.50),(546,291,140,2,'2026-04',1,1,0,0,5.50),(547,291,139,1,'2026-04',1,1,0,0,1.50),(548,292,1,1,'2026-05',564,567,3,0,1.50),(549,292,2,2,'2026-05',2432,2435,3,0,5.50),(550,293,3,1,'2026-05',917,932,15,5,2.90),(551,293,4,2,'2026-05',1311,1311,0,0,5.50),(552,294,5,1,'2026-05',281,282,1,0,1.50),(553,294,6,2,'2026-05',1672,1673,1,0,5.50),(554,295,124,1,'2026-05',1,1,0,0,1.50),(555,295,125,2,'2026-05',1938,1987,49,29,13.62),(556,296,7,1,'2026-05',1210,1226,16,6,3.18),(557,296,8,2,'2026-05',939,975,36,16,9.98),(558,297,9,1,'2026-05',138,141,3,0,1.50),(559,297,10,2,'2026-05',1,1,0,0,5.50),(560,298,11,1,'2026-05',27,27,0,0,1.50),(561,298,12,2,'2026-05',40,43,3,0,5.50),(562,299,13,1,'2026-05',183,183,0,0,1.50),(563,299,14,2,'2026-05',547,547,0,0,5.50),(564,300,15,1,'2026-05',1010,1018,8,0,1.50),(565,301,17,1,'2026-05',294,296,2,0,1.50),(566,301,18,2,'2026-05',1136,1136,0,0,5.50),(567,302,19,1,'2026-05',600,613,13,3,2.34),(568,302,20,2,'2026-05',997,1010,13,0,5.50),(569,303,126,1,'2026-05',200,200,0,0,1.50),(570,303,127,2,'2026-05',1523,1544,21,1,5.78),(571,304,114,2,'2026-05',2052,2143,91,71,25.38),(572,304,117,1,'2026-05',1,1,0,0,1.50),(573,305,110,1,'2026-05',643,655,12,2,2.06),(574,305,111,2,'2026-05',3014,3197,183,163,51.14),(575,306,21,1,'2026-05',1,1,0,0,1.50),(576,306,22,2,'2026-05',1,1,0,0,5.50),(577,307,115,1,'2026-05',2102,2117,15,5,2.90),(578,307,116,2,'2026-05',79,133,54,34,15.02),(579,308,24,2,'2026-05',1096,1127,31,11,8.58),(580,308,23,1,'2026-05',552,560,8,0,1.50),(581,309,128,1,'2026-05',346,347,1,0,1.50),(582,309,129,2,'2026-05',858,877,19,0,5.50),(583,310,25,1,'2026-05',1,1,0,0,1.50),(584,310,26,2,'2026-05',2015,2033,18,0,5.50),(585,311,27,1,'2026-05',315,315,0,0,1.50),(586,311,28,2,'2026-05',493,515,22,2,6.06),(587,312,30,2,'2026-05',1,1,0,0,5.50),(588,313,130,1,'2026-05',553,554,1,0,1.50),(589,314,31,1,'2026-05',71,72,1,0,1.50),(590,314,32,2,'2026-05',1,1,0,0,5.50),(591,315,33,1,'2026-05',29,33,4,0,1.50),(592,315,34,2,'2026-05',1217,1244,27,7,7.46),(593,316,35,1,'2026-05',263,271,8,0,1.50),(594,316,36,2,'2026-05',1319,1334,15,0,5.50),(595,317,37,1,'2026-05',659,668,9,0,1.50),(596,317,38,2,'2026-05',1337,1379,42,22,11.66),(597,318,39,1,'2026-05',809,816,7,0,1.50),(598,318,40,2,'2026-05',2502,2504,2,0,5.50),(599,319,41,1,'2026-05',196,202,6,0,1.50),(600,319,42,2,'2026-05',3234,3250,16,0,5.50),(601,320,44,2,'2026-05',627,679,52,32,14.46),(602,320,43,1,'2026-05',206,210,4,0,1.50),(603,321,138,2,'2026-05',1,1,0,0,5.50),(604,321,137,1,'2026-05',220,220,0,0,1.50),(605,322,45,1,'2026-05',1,1,0,0,1.50),(606,322,46,2,'2026-05',1,1,0,0,5.50),(607,323,47,1,'2026-05',174,174,0,0,1.50),(608,323,48,2,'2026-05',1,1,0,0,5.50),(609,324,131,1,'2026-05',463,463,0,0,1.50),(610,325,123,2,'2026-05',79,90,11,0,5.50),(611,325,122,1,'2026-05',547,560,13,3,2.34),(612,326,51,1,'2026-05',60,68,8,0,1.50),(613,326,52,2,'2026-05',1160,1161,1,0,5.50),(614,327,53,1,'2026-05',794,806,12,2,2.06),(615,327,54,2,'2026-05',2620,2666,46,26,12.78),(616,328,132,1,'2026-05',784,791,7,0,1.50),(617,328,133,2,'2026-05',3427,3459,32,12,8.86),(618,329,112,1,'2026-05',930,940,10,0,1.50),(619,329,113,2,'2026-05',2240,2265,25,5,6.90),(620,330,55,1,'2026-05',756,760,4,0,1.50),(621,330,56,2,'2026-05',3586,3603,17,0,5.50),(622,331,57,1,'2026-05',1,1,0,0,1.50),(623,331,58,2,'2026-05',1,1,0,0,5.50),(624,332,60,2,'2026-05',1,1,0,0,5.50),(625,332,59,1,'2026-05',371,371,0,0,1.50),(626,333,61,1,'2026-05',370,374,4,0,1.50),(627,333,62,2,'2026-05',990,1002,12,0,5.50),(628,334,63,1,'2026-05',1013,1028,15,5,2.90),(629,334,64,2,'2026-05',6224,6295,71,51,19.78),(630,335,65,1,'2026-05',485,489,4,0,1.50),(631,335,66,2,'2026-05',1141,1141,0,0,5.50),(632,336,67,1,'2026-05',704,708,4,0,1.50),(633,336,68,2,'2026-05',1529,1529,0,0,5.50),(634,337,140,2,'2026-05',1,1,0,0,5.50),(635,337,139,1,'2026-05',1,1,0,0,1.50),(636,338,70,2,'2026-05',2026,2032,6,0,5.50),(637,338,69,1,'2026-05',538,541,3,0,1.50),(638,339,71,1,'2026-05',600,609,9,0,1.50),(639,339,72,2,'2026-05',898,903,5,0,5.50),(640,340,73,1,'2026-05',761,779,18,8,3.74),(641,340,74,2,'2026-05',3230,3242,12,0,5.50),(642,341,119,2,'2026-05',1605,1606,1,0,5.50),(643,341,118,1,'2026-05',878,888,10,0,1.50),(644,342,75,1,'2026-05',494,497,3,0,1.50),(645,342,76,2,'2026-05',2133,2151,18,0,5.50),(646,343,78,2,'2026-05',2145,2186,41,21,11.38),(647,343,77,1,'2026-05',1336,1354,18,8,3.74),(648,344,80,2,'2026-05',1486,1490,4,0,5.50),(649,344,79,1,'2026-05',824,848,24,14,5.42),(650,345,82,2,'2026-05',1551,1594,43,23,11.94),(651,345,81,1,'2026-05',40,48,8,0,1.50),(652,346,84,2,'2026-05',1212,1212,0,0,5.50),(653,346,83,1,'2026-05',228,228,0,0,1.50),(654,347,86,2,'2026-05',59,59,0,0,5.50),(655,347,85,1,'2026-05',1080,1096,16,6,3.18),(656,348,87,1,'2026-05',413,415,2,0,1.50),(657,348,88,2,'2026-05',1,1,0,0,5.50),(658,349,121,2,'2026-05',267,267,0,0,5.50),(659,349,120,1,'2026-05',187,201,14,4,2.62),(660,350,89,1,'2026-05',533,542,9,0,1.50),(661,350,90,2,'2026-05',2380,2410,30,10,8.30),(662,351,136,1,'2026-05',59,59,0,0,1.50),(663,352,91,1,'2026-05',583,588,5,0,1.50),(664,353,93,1,'2026-05',1,1,0,0,1.50),(665,353,92,2,'2026-05',867,883,16,0,5.50),(666,354,134,1,'2026-05',1,1,0,0,1.50),(667,354,135,2,'2026-05',1,1,0,0,5.50),(668,355,95,2,'2026-05',24,24,0,0,5.50),(669,355,94,1,'2026-05',100,100,0,0,1.50),(670,356,97,2,'2026-05',1921,1935,14,0,5.50),(671,356,96,1,'2026-05',490,493,3,0,1.50),(672,357,98,1,'2026-05',608,614,6,0,1.50),(673,358,100,2,'2026-05',2129,2129,0,0,5.50),(674,358,99,1,'2026-05',1030,1040,10,0,1.50),(675,359,101,1,'2026-05',1,1,0,0,1.50),(676,359,102,2,'2026-05',1,1,0,0,5.50),(677,360,104,2,'2026-05',1,1,0,0,5.50),(678,360,103,1,'2026-05',308,309,1,0,1.50),(679,361,105,1,'2026-05',1191,1219,28,18,6.54),(680,362,107,1,'2026-05',1663,1664,1,0,1.50),(681,363,108,1,'2026-05',275,289,14,4,2.62),(682,364,109,1,'2026-05',25,25,0,0,1.50),(683,300,16,2,'2026-05',1647,1652,5,0,5.50),(684,361,106,2,'2026-05',2160,2160,0,0,5.50),(685,365,1,1,'2026-06',567,571,4,0,1.50),(686,365,2,2,'2026-06',2435,2439,4,0,5.50),(687,366,3,1,'2026-06',932,945,13,3,2.34),(688,366,4,2,'2026-06',1311,1311,0,0,5.50),(689,367,5,1,'2026-06',282,283,1,0,1.50),(690,367,6,2,'2026-06',1673,1673,0,0,5.50),(691,368,124,1,'2026-06',1,1,0,0,1.50),(692,368,125,2,'2026-06',1987,2020,33,13,9.14),(693,369,7,1,'2026-06',1226,1242,16,6,3.18),(694,369,8,2,'2026-06',975,998,23,3,6.34),(695,370,9,1,'2026-06',141,157,16,6,3.18),(696,370,10,2,'2026-06',1,1,0,0,5.50),(697,371,11,1,'2026-06',27,27,0,0,1.50),(698,371,12,2,'2026-06',43,43,0,0,5.50),(699,372,13,1,'2026-06',183,184,1,0,1.50),(700,372,14,2,'2026-06',547,551,4,0,5.50),(701,373,15,1,'2026-06',1018,1032,14,4,2.62),(702,373,16,2,'2026-06',1652,1658,6,0,5.50),(703,374,17,1,'2026-06',296,319,23,13,5.14),(704,374,18,2,'2026-06',1136,1136,0,0,5.50),(705,375,19,1,'2026-06',613,625,12,2,2.06),(706,375,20,2,'2026-06',1010,1012,2,0,5.50),(707,376,126,1,'2026-06',200,200,0,0,1.50),(708,376,127,2,'2026-06',1544,1560,16,0,5.50),(709,377,117,1,'2026-06',1,1,0,0,1.50),(710,377,114,2,'2026-06',2143,2143,0,0,5.50),(711,378,111,2,'2026-06',3197,3197,0,0,5.50),(712,378,110,1,'2026-06',655,672,17,7,3.46),(713,379,21,1,'2026-06',1,1,0,0,1.50),(714,379,22,2,'2026-06',1,1,0,0,5.50),(715,380,116,2,'2026-06',133,133,0,0,5.50),(716,380,115,1,'2026-06',2117,2133,16,6,3.18),(717,381,23,1,'2026-06',560,572,12,2,2.06),(718,381,24,2,'2026-06',1127,1152,25,5,6.90),(719,382,128,1,'2026-06',347,347,0,0,1.50),(720,382,129,2,'2026-06',877,910,33,13,9.14),(721,383,25,1,'2026-06',1,1,0,0,1.50),(722,383,26,2,'2026-06',2033,2047,14,0,5.50),(723,384,27,1,'2026-06',315,328,13,3,2.34),(724,384,28,2,'2026-06',515,515,0,0,5.50),(725,385,30,2,'2026-06',1,1,0,0,5.50),(726,386,130,1,'2026-06',554,555,1,0,1.50),(727,387,31,1,'2026-06',72,121,49,39,12.42),(728,387,32,2,'2026-06',1,1,0,0,5.50),(729,388,34,2,'2026-06',1244,1244,0,0,5.50),(730,388,33,1,'2026-06',33,37,4,0,1.50),(731,389,35,1,'2026-06',271,281,10,0,1.50),(732,389,36,2,'2026-06',1334,1334,0,0,5.50),(733,390,37,1,'2026-06',668,680,12,2,2.06),(734,390,38,2,'2026-06',1379,1379,0,0,5.50),(735,391,40,2,'2026-06',2504,2505,1,0,5.50),(736,391,39,1,'2026-06',816,824,8,0,1.50),(737,392,42,2,'2026-06',3250,3301,51,31,14.18),(738,392,41,1,'2026-06',202,209,7,0,1.50),(739,393,43,1,'2026-06',210,214,4,0,1.50),(740,393,44,2,'2026-06',679,679,0,0,5.50),(741,394,138,2,'2026-06',1,1,0,0,5.50),(742,394,137,1,'2026-06',220,220,0,0,1.50),(743,395,45,1,'2026-06',1,1,0,0,1.50),(744,395,46,2,'2026-06',1,1,0,0,5.50),(745,396,47,1,'2026-06',174,175,1,0,1.50),(746,396,48,2,'2026-06',1,1,0,0,5.50),(747,397,131,1,'2026-06',463,463,0,0,1.50),(748,398,123,2,'2026-06',90,115,25,5,6.90),(749,398,122,1,'2026-06',560,570,10,0,1.50),(750,399,52,2,'2026-06',1161,1164,3,0,5.50),(751,399,51,1,'2026-06',68,81,13,3,2.34),(752,400,54,2,'2026-06',2666,2666,0,0,5.50),(753,400,53,1,'2026-06',806,823,17,7,3.46),(754,401,132,1,'2026-06',791,802,11,1,1.78),(755,401,133,2,'2026-06',3459,3459,0,0,5.50),(756,402,112,1,'2026-06',940,948,8,0,1.50),(757,402,113,2,'2026-06',2265,2285,20,0,5.50),(758,403,56,2,'2026-06',3603,3605,2,0,5.50),(759,403,55,1,'2026-06',760,766,6,0,1.50),(760,404,57,1,'2026-06',1,1,0,0,1.50),(761,404,58,2,'2026-06',1,1,0,0,5.50),(762,405,60,2,'2026-06',1,1,0,0,5.50),(763,405,59,1,'2026-06',371,371,0,0,1.50),(764,406,61,1,'2026-06',374,386,12,2,2.06),(765,406,62,2,'2026-06',1002,1012,10,0,5.50),(766,407,63,1,'2026-06',1028,1048,20,10,4.30),(767,407,64,2,'2026-06',6295,6295,0,0,5.50),(768,408,66,2,'2026-06',1141,1141,0,0,5.50),(769,408,65,1,'2026-06',489,492,3,0,1.50),(770,409,67,1,'2026-06',708,716,8,0,1.50),(771,409,68,2,'2026-06',1529,1531,2,0,5.50),(772,410,140,2,'2026-06',1,1,0,0,5.50),(773,411,70,2,'2026-06',2032,2063,31,11,8.58),(774,411,69,1,'2026-06',541,543,2,0,1.50),(775,412,71,1,'2026-06',609,620,11,1,1.78),(776,412,72,2,'2026-06',903,903,0,0,5.50),(777,413,74,2,'2026-06',3242,3253,11,0,5.50),(778,413,73,1,'2026-06',779,780,1,0,1.50),(779,414,119,2,'2026-06',1606,1608,2,0,5.50),(780,414,118,1,'2026-06',888,900,12,2,2.06),(781,415,75,1,'2026-06',497,497,0,0,1.50),(782,415,76,2,'2026-06',2151,2155,4,0,5.50),(783,416,78,2,'2026-06',2186,2186,0,0,5.50),(784,416,77,1,'2026-06',1354,1376,22,12,4.86),(785,417,80,2,'2026-06',1490,1500,10,0,5.50),(786,417,79,1,'2026-06',848,866,18,8,3.74),(787,418,82,2,'2026-06',1594,1601,7,0,5.50),(788,418,81,1,'2026-06',48,61,13,3,2.34),(789,419,84,2,'2026-06',1212,1212,0,0,5.50),(790,419,83,1,'2026-06',228,228,0,0,1.50),(791,420,85,1,'2026-06',1096,1132,36,26,8.78),(792,420,86,2,'2026-06',59,92,33,13,9.14),(793,421,87,1,'2026-06',415,418,3,0,1.50),(794,421,88,2,'2026-06',1,1,0,0,5.50),(795,422,121,2,'2026-06',267,267,0,0,5.50),(796,422,120,1,'2026-06',201,206,5,0,1.50),(797,423,90,2,'2026-06',2410,2440,30,10,8.30),(798,424,136,1,'2026-06',59,59,0,0,1.50),(799,425,91,1,'2026-06',588,593,5,0,1.50),(800,426,93,1,'2026-06',1,1,0,0,1.50),(801,426,92,2,'2026-06',883,883,0,0,5.50),(802,427,134,1,'2026-06',1,1,0,0,1.50),(803,427,135,2,'2026-06',1,1,0,0,5.50),(804,428,95,2,'2026-06',24,24,0,0,5.50),(805,428,94,1,'2026-06',100,101,1,0,1.50),(806,429,97,2,'2026-06',1935,1935,0,0,5.50),(807,429,96,1,'2026-06',493,494,1,0,1.50),(808,430,98,1,'2026-06',614,620,6,0,1.50),(809,431,99,1,'2026-06',1040,1058,18,8,3.74),(810,431,100,2,'2026-06',2129,2129,0,0,5.50),(811,432,101,1,'2026-06',1,1,0,0,1.50),(812,432,102,2,'2026-06',1,1,0,0,5.50),(813,433,104,2,'2026-06',1,1,0,0,5.50),(814,433,103,1,'2026-06',309,309,0,0,1.50),(815,434,105,1,'2026-06',1219,1261,42,32,10.46),(816,434,106,2,'2026-06',2160,2162,2,0,5.50),(817,435,107,1,'2026-06',1664,1664,0,0,1.50),(818,436,108,1,'2026-06',289,295,6,0,1.50),(819,437,109,1,'2026-06',25,26,1,0,1.50),(820,410,139,1,'2026-06',1,9,8,0,1.50),(821,423,141,1,'2026-06',1,1,0,0,1.50),(822,438,1,1,'2026-07',571,573,2,0,1.50),(823,438,2,2,'2026-07',2439,2439,0,0,5.50),(824,439,3,1,'2026-07',945,961,16,6,3.18),(825,439,4,2,'2026-07',1311,1311,0,0,5.50),(826,440,5,1,'2026-07',283,283,0,0,1.50),(827,440,6,2,'2026-07',1673,1693,20,0,5.50),(828,441,124,1,'2026-07',1,1,0,0,1.50),(829,441,125,2,'2026-07',2020,2039,19,0,5.50),(830,442,7,1,'2026-07',1242,1252,10,0,1.50),(831,442,8,2,'2026-07',998,1059,61,41,16.98),(832,443,9,1,'2026-07',157,160,3,0,1.50),(833,443,10,2,'2026-07',1,1,0,0,5.50),(834,444,11,1,'2026-07',27,27,0,0,1.50),(835,444,12,2,'2026-07',43,43,0,0,5.50),(836,445,13,1,'2026-07',184,184,0,0,1.50),(837,445,14,2,'2026-07',551,585,34,14,9.42),(838,446,15,1,'2026-07',1032,1040,8,0,1.50),(839,446,16,2,'2026-07',1658,1681,23,3,6.34),(840,447,17,1,'2026-07',319,393,74,64,19.42),(841,447,18,2,'2026-07',1136,1144,8,0,5.50),(842,448,20,2,'2026-07',1012,1015,3,0,5.50),(843,448,19,1,'2026-07',625,635,10,0,1.50),(844,449,126,1,'2026-07',200,200,0,0,1.50),(845,449,127,2,'2026-07',1560,1560,0,0,5.50),(846,450,117,1,'2026-07',1,1,0,0,1.50),(847,450,114,2,'2026-07',2143,2215,72,52,20.06),(848,451,110,1,'2026-07',672,684,12,2,2.06),(849,451,111,2,'2026-07',3197,3197,0,0,5.50),(850,452,21,1,'2026-07',1,1,0,0,1.50),(851,452,22,2,'2026-07',1,1,0,0,5.50),(852,453,116,2,'2026-07',133,133,0,0,5.50),(853,453,115,1,'2026-07',2133,2147,14,4,2.62),(854,454,23,1,'2026-07',572,582,10,0,1.50),(855,454,24,2,'2026-07',1152,1169,17,0,5.50),(856,455,129,2,'2026-07',910,955,45,25,12.50),(857,455,128,1,'2026-07',347,348,1,0,1.50),(858,456,26,2,'2026-07',2047,2064,17,0,5.50),(859,456,25,1,'2026-07',1,1,0,0,1.50),(860,457,27,1,'2026-07',328,339,11,1,1.78),(861,457,28,2,'2026-07',515,542,27,7,7.46),(862,458,30,2,'2026-07',1,1,0,0,5.50),(863,459,130,1,'2026-07',555,555,0,0,1.50),(864,460,31,1,'2026-07',121,122,1,0,1.50),(865,460,32,2,'2026-07',1,1,0,0,5.50),(866,461,34,2,'2026-07',1244,1254,10,0,5.50),(867,461,33,1,'2026-07',37,41,4,0,1.50),(868,462,35,1,'2026-07',281,285,4,0,1.50),(869,462,36,2,'2026-07',1334,1341,7,0,5.50),(870,463,37,1,'2026-07',680,692,12,2,2.06),(871,463,38,2,'2026-07',1379,1393,14,0,5.50),(872,464,39,1,'2026-07',824,833,9,0,1.50),(873,464,40,2,'2026-07',2505,2505,0,0,5.50),(874,465,41,1,'2026-07',209,213,4,0,1.50),(875,465,42,2,'2026-07',3301,3321,20,0,5.50),(876,466,43,1,'2026-07',214,218,4,0,1.50),(877,466,44,2,'2026-07',679,679,0,0,5.50),(878,467,138,2,'2026-07',1,1,0,0,5.50),(879,467,137,1,'2026-07',220,220,0,0,1.50),(880,468,45,1,'2026-07',1,1,0,0,1.50),(881,468,46,2,'2026-07',1,1,0,0,5.50),(882,469,47,1,'2026-07',175,175,0,0,1.50),(883,469,48,2,'2026-07',1,1,0,0,5.50),(884,470,131,1,'2026-07',463,463,0,0,1.50),(885,471,123,2,'2026-07',115,127,12,0,5.50),(886,471,122,1,'2026-07',570,577,7,0,1.50),(887,472,51,1,'2026-07',81,84,3,0,1.50),(888,472,52,2,'2026-07',1164,1171,7,0,5.50),(889,473,54,2,'2026-07',2666,2676,10,0,5.50),(890,473,53,1,'2026-07',823,835,12,2,2.06),(891,474,132,1,'2026-07',802,811,9,0,1.50),(892,474,133,2,'2026-07',3459,3471,12,0,5.50),(893,475,112,1,'2026-07',948,958,10,0,1.50),(894,475,113,2,'2026-07',2285,2305,20,0,5.50),(895,476,56,2,'2026-07',3605,3628,23,3,6.34),(896,476,55,1,'2026-07',766,774,8,0,1.50),(897,477,58,2,'2026-07',1,1,0,0,5.50),(898,477,57,1,'2026-07',1,1,0,0,1.50),(899,478,60,2,'2026-07',1,1,0,0,5.50),(900,478,59,1,'2026-07',371,371,0,0,1.50),(901,479,61,1,'2026-07',386,393,7,0,1.50),(902,479,62,2,'2026-07',1012,1041,29,9,8.02),(903,480,64,2,'2026-07',6295,6320,25,5,6.90),(904,480,63,1,'2026-07',1048,1066,18,8,3.74),(905,481,66,2,'2026-07',1141,1141,0,0,5.50),(906,481,65,1,'2026-07',492,492,0,0,1.50),(907,482,68,2,'2026-07',1531,1541,10,0,5.50),(908,482,67,1,'2026-07',716,724,8,0,1.50),(909,483,70,2,'2026-07',2063,2070,7,0,5.50),(910,483,69,1,'2026-07',543,546,3,0,1.50),(911,484,72,2,'2026-07',903,910,7,0,5.50),(912,484,71,1,'2026-07',620,629,9,0,1.50),(913,485,73,1,'2026-07',780,785,5,0,1.50),(914,485,74,2,'2026-07',3253,3270,17,0,5.50),(915,486,118,1,'2026-07',900,914,14,4,2.62),(916,486,119,2,'2026-07',1608,1611,3,0,5.50),(917,487,75,1,'2026-07',497,498,1,0,1.50),(918,487,76,2,'2026-07',2155,2175,20,0,5.50),(919,488,78,2,'2026-07',2186,2186,0,0,5.50),(920,488,77,1,'2026-07',1376,1393,17,7,3.46),(921,489,79,1,'2026-07',866,882,16,6,3.18),(922,489,80,2,'2026-07',1500,1500,0,0,5.50),(923,490,81,1,'2026-07',61,67,6,0,1.50),(924,490,82,2,'2026-07',1601,1627,26,6,7.18),(925,491,84,2,'2026-07',1212,1212,0,0,5.50),(926,491,83,1,'2026-07',228,228,0,0,1.50),(927,492,85,1,'2026-07',1132,1154,22,12,4.86),(928,492,86,2,'2026-07',92,134,42,22,11.66),(929,493,87,1,'2026-07',418,420,2,0,1.50),(930,493,88,2,'2026-07',1,1,0,0,5.50),(931,494,120,1,'2026-07',206,208,2,0,1.50),(932,494,121,2,'2026-07',267,267,0,0,5.50),(933,495,90,2,'2026-07',2440,2461,21,1,5.78),(934,495,141,1,'2026-07',1,1,0,0,1.50),(935,496,136,1,'2026-07',59,60,1,0,1.50),(936,497,91,1,'2026-07',593,598,5,0,1.50),(937,498,92,2,'2026-07',883,915,32,12,8.86),(938,498,93,1,'2026-07',1,1,0,0,1.50),(939,499,134,1,'2026-07',1,1,0,0,1.50),(940,499,135,2,'2026-07',1,1,0,0,5.50),(941,500,94,1,'2026-07',101,102,1,0,1.50),(942,500,95,2,'2026-07',24,24,0,0,5.50),(943,501,96,1,'2026-07',494,498,4,0,1.50),(944,501,97,2,'2026-07',1935,1961,26,6,7.18),(945,502,98,1,'2026-07',620,626,6,0,1.50),(946,503,100,2,'2026-07',2129,2129,0,0,5.50),(947,503,99,1,'2026-07',1058,1070,12,2,2.06),(948,504,102,2,'2026-07',1,1,0,0,5.50),(949,504,101,1,'2026-07',1,1,0,0,1.50),(950,505,104,2,'2026-07',1,1,0,0,5.50),(951,505,103,1,'2026-07',309,309,0,0,1.50),(952,506,106,2,'2026-07',2162,2171,9,0,5.50),(953,506,105,1,'2026-07',1261,1282,21,11,4.58),(954,507,107,1,'2026-07',1664,1665,1,0,1.50),(955,508,108,1,'2026-07',295,303,8,0,1.50),(956,509,109,1,'2026-07',26,26,0,0,1.50),(957,510,139,1,'2026-07',9,19,10,0,1.50),(958,510,140,2,'2026-07',1,1,0,0,5.50);
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
  `username` varchar(100) NOT NULL,
  `password` varchar(655) NOT NULL,
  `role` enum('admin','board','user','treasurer') NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`system_user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `system_users_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_users`
--

LOCK TABLES `system_users` WRITE;
/*!40000 ALTER TABLE `system_users` DISABLE KEYS */;
INSERT INTO `system_users` VALUES (1,1,'0502163041','$2b$10$F0r7/LXF36ajLEBB4AEKVePmuDrOwq2iUmqnk7wSH33jGfoCqn.f2','user',1),(2,2,'0502166614','$2b$10$l70jYhAHFY.CgkwEtdKcJ.7n6c2flOmC54sWenPfRXHJ56K2ycEvi','user',1),(3,3,'0500973482','$2b$10$RaTUAfzE6cY7MXLiDMV7M.TvDd.VOuI.tFA2frurVEgPpQ4iv.FLy','user',1),(4,4,'0502607690','$2b$10$zrG9oKUM8pSJ/w6U0EXZ3OyWb0iR1MODkhsKlXpbMNvobaBeoedoG','user',1),(5,5,'0501581847','$2b$10$1V1B2nmKruzUNy5LYLjJ3.IRbUMqURWXoZBVcQ6nUwRd0UFxZLSMG','user',1),(6,6,'0502993256','$2b$10$YbFZb7xnbSfaJhfsncwikO8r/z2i.7atMCMZBkTz04UqvNDfdh4ee','user',1),(7,7,'1400942452','$2b$10$OybLFyzRePIp25.8bCVUgOViRUj6CT9yUiFL7zkt3ERprpTx..6ai','user',1),(8,8,'0500666946','$2b$10$qeOJuHeTDaSrn4tE6Te1Te76CYFLxwRtOq0jrepkvbdBOBX6xArWG','user',1),(9,9,'0501808034','$2b$10$auV3fC.ztOUjmzlsFlae6OCHpBf0FrFQv.AUoKtOz3oWNTJrOCUd2','user',1),(10,10,'0502679822','$2b$10$3RtfvTnXB/ZxhNDgiUVvK.rBuA5Md5P3J/o0WOlPM5lPUDZo66nrO','user',1),(11,11,'0550090542','$2b$10$jKRREgoY5r/F8f6oZ8IUk.ZT19V/MyhNXIudzpR4Fa.CXF9nQLt5a','user',1),(12,12,'0501460059','$2b$10$lsPo3Yso8RV28fpfwEtLu.vpV3vMcOfQYAUauPYq9iIG0UKU8lkc6','user',1),(13,13,'0502150907','$2b$10$wxLiyPuNrH.DSn316Q69f.z3coLOTZfpeT5Imcmx3rW7wUZX9R3CS','user',1),(14,14,'0502577091','$2b$10$qq9IC79JX15y9g4doXJxL.ZNW7SEdV2JBI7MDlf6YBYX8tqIUlUv.','user',1),(15,15,'0502063415','$2b$10$xa4jMLgv22Njdds42/6MG.CFbS6ZMloXLZZTtePcWoKPS2qYGGGZm','user',1),(16,16,'0502064090','$2b$10$Dvf7MgGS50Wo/lEjgYXF.eoJ9FBHfAIj.VOn3kUuNEJF2hSzsR4ku','user',1),(17,17,'0502158132','$2b$10$JS.VFkFcIJh2QZNt5c3j2.zzUWfOSCsqvzieKmCttl2X9Ha9hgQJy','user',1),(18,18,'0503919425','$2b$10$3PCQb17cGpbQWlyjwnSRqebEJvWEHyKZAHc6NPmvPSh3tRsaVn/Hu','user',1),(19,19,'0501784672','$2b$10$K7VYDL5/NLmkx2yX1wkE5.vYdVwvADD8Xy/iV5U3rWvR6QuE.mfTS','user',1),(20,20,'0503592164','$2b$10$cNx6n8js0VUohgzJwMqT7O6W/WAeaGsyKYNogetgrCI8xICBrIOka','user',1),(21,21,'0503754392','$2b$10$oIckurrEPiolB.Q4cvk1nOmGEviwCXbfYSpxUDk8v.yRKE938Yn2W','user',1),(22,22,'0501747034','$2b$10$USW8Sh/8D.gOA6Giw4e3fOVkIgZXN9ooyk5Cu.68n4gwsE2xZdkCe','user',1),(23,23,'0502116478','$2b$10$mKRkGW1H0MRGeoUl3cdPlOaRhEowV4MNaDK6exFBPhNjsZ5OZjrYu','user',1),(24,24,'0501086771','$2b$10$bhRmWAXHGb.MUyGFY6VBQuXLUjJxzBiafE9Fq.Zh5sCNXeyYK36fq','user',1),(25,25,'0501099667','$2b$10$wKtjWCFHTYKWHe7P./VP5ODER6RNw.vmzl/Z7sG8IeNkQuxlxf/Xi','user',1),(26,26,'0502943293','$2b$10$lKpOtQbEcN79jWvlSF15UuYWWy0YbfxgfGx0VnWMOTfJsP43oecAq','user',1),(27,27,'0501793418','$2b$10$AOa/P8qbOMK/Dn4Zbeb7.uyb/Ry.Pas7/7d5RwyD0OJ5ZYTAhLIdy','user',1),(28,28,'0503171746','$2b$10$glxJAu3IDSpkq5jKP/GsP.1KAg8cZqo3YMNXpCVWvL2/nQhpSX5cO','user',1),(29,29,'0501279038','$2b$10$OlIBY5fUedo57ta2ziHIU.nTsXrWznxAyeYrjNwcYMnFaBxcay8vu','user',1),(30,30,'0503421869','$2b$10$fJwDI1wOxTMbiH2MXF1/8e4tvj/RfA9U.OtNM3RABtzhuZv8W0khq','user',1),(31,31,'0501547269','$2b$10$OhEXaSVfSw3GGav1X6nhKuT7BY7jaZBPNz.gnd877WFuUH7/g0.jW','user',1),(32,32,'0503920332','$2b$10$nkbz14HrKOm8/o1YSu9rDeyr11zDSlD1Rv0KbiA/6hivH43LQ0wkG','user',1),(33,33,'0502884711','$2b$10$VAMZghd5ywui6N9CZF.S4.obPyL3NBOJsT4aZH93XKwPMLSey1ESu','user',1),(34,34,'1751761493','$2b$10$NqknvUX/k8.RX622ulPPMOQodc43HQkzCy3WIb9EhE5hkQH/7Wb9e','user',1),(35,35,'0501347462','$2b$10$lMONBXT2qeb37Sr.N5Ukl.JyRmrEjqXW23GpWc1qGJyt9/5yVLcDa','user',1),(36,36,'0503967671','$2b$10$3fhMIEgb.7VSQPa1l2lLqeFn8IIArNSzzSFDkRQp5P6ARLtz7hmQW','user',1),(37,37,'0501243596','$2b$10$xBW9unzzGHdgF/Umk8SLWu1xR6bd7RY5kXUu/SurWXocf9GuiU4Gu','user',1),(38,38,'0500866942','$2b$10$CFmeLn.QOl4.ZlizPsRkxulAvNsEyn0kn7ubdRZ1gkeObNIZrqXoi','user',1),(39,39,'0502511405','$2b$10$gjvOYCYp4XAmwLbcHTerlOyqaVOdhksrhkEIgUysW0G8f5xhmGz3e','user',1),(40,40,'0550375638','$2b$10$nRXJw04AxXA1.fULVJ2WIuhfKTXoxh8ivfrVfE.58bq38UDednm0G','user',1),(41,41,'0503149098','$2b$10$x892ORRneAXRhr600k0K7OkjWeR.FqElcPHHvjpB5rkMlgu8aaOUO','user',1),(42,42,'0501211684','$2b$10$ttSKasb7oHhjCExKfCm7SO9JFWE5.u.21KYyc6n137PoNKHN/HIs2','user',1),(43,43,'0502991821','$2b$10$kdoGk9SlCchBuqs1GX75fexmKRnjHo8eRXWnf7tOFcZMGZRTac0DK','user',1),(44,44,'0550117428','$2b$10$4qdA1f9tjS4Q55GXo9wzcuuIi1JrPIo9NO0Wa3Krms/Gi82I8a126','user',1),(45,52,'0550394365','$2b$10$ZaAND3qCe3.1ACC9cruMSOez0zGYWasYcwDELVYdjArKoKHt5cuLy','user',1),(46,53,'0503886517','$2b$10$byMlQ8yOH35pJJ9g5Qg5qeqDNuLebM25btS1a0RoIWm/jgqZS/9BW','user',1),(47,54,'1702595453','$2b$10$xlGY3tZoQSrIOsr0ZViFHODktUWqXrj0qvJXeNt4e1OD6k/3j4V3W','user',1),(48,55,'0550080535','$2b$10$UtFxl4U.8uqNuSSmzAuZy.9ewLhWdpY0LyyNrv4OGybxzPiTnGtuy','user',1),(49,56,'0502717564','$2b$10$JtNnEGEfnfatRA927MXL/Otb/pQ1Q9Rcp52wRofUkBmcAIC4De48i','user',1),(50,57,'0504750944','$2b$10$sCKRJ4sfxpqH5K3DternFOjbWM8KZ1/91prdbZzULPq6m80Ix4t2G','user',1),(51,58,'0504363334','$2b$10$9XjItPtZ6SlNvbeNMVyux.fQ7qPcR.FVIO8DJQpVfnPBVvqs5JjuC','user',1),(52,59,'1723689897','$2b$10$YghS0g1Dq1km.ZwFS74mNuSolRTH7STbc8sQZAs6VmN7G8x1pv9HK','user',1),(53,60,'0503739062','$2b$10$YFeyQ6YFJXDG8GhB3EUMPOnpsqnLu4cSqkVbDw/zA/mNoWKIoqrmS','user',1),(54,61,'0502226806','$2b$10$Jxdn2wfyqcutDWCCy3U4JejWgoFCNNMkfzVIUWW0ObjyUWpY8vbji','user',1),(55,62,'0504022351','$2b$10$G/0ux7eGeW6dNR499A5tEuslD7tlOQo/hzhERKYJbGOgQetDtsjby','user',1),(56,63,'0501661532','$2b$10$RMPhTIEXU5/VkMczz.TGHulahLCjJq1bS8ms/Frj9s9cj4GW3oZdq','user',1),(57,64,'0501820229','$2b$10$A6Y6/mqo7PvGh7kGDXDWtuKkhwxI.gdeS7gtrLywqVo1c6YkNQQka','user',1),(58,65,'1711328144','$2b$10$Om5nIia6gla1Csb./gYZnuCpJ0xMxHmPLrFFVSLcVn5Z2NlfObLMa','user',1),(59,66,'0503007080','$2b$10$OmbjFQ2wP2TDS6EH2parxOlG5WLK6XmMzW80UUExZJ3Upj6SCNP6i','user',1),(60,67,'0504295155','$2b$10$3a0MavRvVmP0Ys33k02z6.6DZo/rUHaDgBdSuSc2qLNAqmLmnZcnO','user',1),(61,68,'0500449863','$2b$10$fQDc0xo/tGclw032DN8eBewVhJ7mIPLOTO5CbpDGQG8D5ZwqBhewO','user',1),(62,69,'0503356941','$2b$10$TacMeGDFyRDSpLrXBo0oHuYqpuCeeY2SGr4hyPqgZheCpa.0KnYVe','user',1),(63,70,'1721817151','$2b$10$ZFx/dUMDIB8dBlfxTkbxLOHJB2wi2FbYuYgh.pgar5IHmlmIrJT32','user',1),(64,71,'0503190878','$2b$10$JEB/ZR80D2kLy61/9u.VU.29a3rJEL5hyR5Ed1.BmSWwA/gleckyi','user',1),(65,72,'0502444672','$2b$10$iFrRU.i0mGOXLD6HS3XUFeRagOZ2.nhSNwOHEU63zOze0RgJtUUpW','user',1),(66,73,'0503758831','$2b$10$lNjrb761TzTLC7vQ3/sMYu9UkNokjyeWVEG1CjuQgBA4Rk5HGVlM.','user',1),(67,74,'0502323108','$2b$10$cKXiLe/YlhV1H1RP7yy47uKEmscIY9xUxmX7M3solEygrAx7I3pdO','user',1),(68,75,'0502776412','$2b$10$9qevGw2oysyKXoeNJQHPMuTzE89w9Gn0o0FsulRZyY9trmN/ilKbm','user',1),(69,76,'0501182315','$2b$10$AIBDtBSiiLiK3xs2Ep34mufZKq6uV4RM9mV8XCAeqSdovZaFHkao.','user',1),(70,77,'0502089576','$2b$10$eKtubeSOuoB4e8EawY5dtep8UUoOMavG6ioMpAWqkpL9Ty/UF4Vie','user',1),(71,78,'0503793317','$2b$10$QS79g2Iy6S9VD6av2fT0yOJuxzqChKpxrg371AIXB.E4QG/w0JbyK','user',1),(72,79,'0502828718','$2b$10$pm5.J3gucMDfBkWEnPALEuK9poq6MiQQ0S/bP3XNjZ2WIXIyJfXGW','user',1),(73,80,'admin','$2b$10$qLUn3Etr.44bpkoDTm0Yp.950.ZMnV9tUkVJT0U9ssuhhirVBH.oC','admin',1);
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
  `national_id` varchar(10) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `registration_date` date NOT NULL DEFAULT (curdate()),
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `exempt_from_fines` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `national_id` (`national_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'0502163041','SEGUNDO OSWALDO','ANGUISACA QUINAUCHO',NULL,NULL,NULL,'2026-02-01',1,0),(2,'0502166614','JOSE MIGUEL','ASHCA TOTASIG',NULL,NULL,NULL,'2026-02-01',1,0),(3,'0500973482','JOSE ENRIQUE ','SALAZAR GUANOQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(4,'0502607690','JOSE CARLOS ','CASILLAS CUNDULLE',NULL,NULL,NULL,'2026-02-01',1,0),(5,'0501581847','JOSE MANUEL','LOGRO PALLO',NULL,NULL,NULL,'2026-02-01',1,0),(6,'0502993256','JOSE JORGE','CASILLAS CUNDULLE',NULL,NULL,NULL,'2026-02-01',1,0),(7,'1400942452','CARLOS NASE','SUAMAR JUEP',NULL,NULL,NULL,'2026-02-01',1,0),(8,'0500666946','MARIA DIGNA','GUANOQUIZA GUANOQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(9,'0501808034','JOSE GONZALO','VARGAS VARGAS',NULL,NULL,NULL,'2026-02-01',1,0),(10,'0502679822','VICTOR','ANGUISACA LLUMITASIG',NULL,NULL,NULL,'2026-02-01',1,0),(11,'0550090542','ZENAIDA JEANETH','VARGAS TOCTE',NULL,NULL,NULL,'2026-02-01',1,0),(12,'0501460059','MARIANA ANTUCA','TOCTE CUNDULLE',NULL,NULL,NULL,'2026-02-01',1,0),(13,'0502150907','ERCELINDA ','TOCTE VARGAS ',NULL,NULL,NULL,'2026-02-01',1,0),(14,'0502577091','JORGE ','SALAZAR VARGAS',NULL,NULL,NULL,'2026-02-01',1,0),(15,'0502063415','JOSE ALEJANDRO','CONDULLE YUGCHA',NULL,NULL,NULL,'2026-02-01',1,0),(16,'0502064090','JOSE RAUL','GUANOLUISA GUANOQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(17,'0502158132','BLANCA MARLENE ','PERDOMO VACA',NULL,NULL,NULL,'2026-02-01',1,0),(18,'0503919425','JOSE SEGUNDO','VARGAS TOAQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(19,'0501784672','JOSE MIGUEL','TOAQUIZA NINASUNTA',NULL,NULL,NULL,'2026-02-01',1,0),(20,'0503592164','JORGE GEOVANNY','TOAQUIZA VARGAS',NULL,NULL,NULL,'2026-02-01',1,0),(21,'0503754392','ROSA ','VARGAS PERDOMO',NULL,NULL,NULL,'2026-02-01',1,0),(22,'0501747034','JOSE MIGUEL ','PERDOMO NINASUNTA',NULL,NULL,NULL,'2026-02-01',1,0),(23,'0502116478','JORGE HERIBERTO','SEVILLA ALLAUCA',NULL,NULL,NULL,'2026-02-01',1,0),(24,'0501086771','JOSE FRANCISCO','VARGAS SALAZAR',NULL,NULL,NULL,'2026-02-01',1,0),(25,'0501099667','JOSE ANTONIO','CASILLAS TOCTE',NULL,NULL,NULL,'2026-02-01',1,0),(26,'0502943293','JOSE FABIAN ','CASILLAS TOCTE',NULL,NULL,NULL,'2026-02-01',1,0),(27,'0501793418','MARIA ESMERALDA ','SALAZAR ANGUISACA',NULL,NULL,NULL,'2026-02-01',1,0),(28,'0503171746','BLANCA CECILIA','SALAZAR PERDOMO',NULL,NULL,NULL,'2026-02-01',1,0),(29,'0501279038','MARIA DOLORES','TOCTE ASHCA',NULL,NULL,NULL,'2026-02-01',1,0),(30,'0503421869','MARTHA CECILIA','LLUMITASIG VARGAS ',NULL,NULL,NULL,'2026-02-01',1,0),(31,'0501547269','MARIA HORTENCIA','VACA CHANGO',NULL,NULL,NULL,'2026-02-01',1,0),(32,'0503920332','WALTER GEOVANNY','LASSO IZA',NULL,NULL,NULL,'2026-02-01',1,0),(33,'0502884711','BLANCA MARLENE ','LASSO IZA',NULL,NULL,NULL,'2026-02-01',1,0),(34,'1751761493','LUIS FABIAN','LASSO IZA',NULL,NULL,NULL,'2026-02-01',1,0),(35,'0501347462','JOSE MIGUEL','LASSO PERDOMO',NULL,NULL,NULL,'2026-02-01',1,0),(36,'0503967671','VICTOR','PERDOMO ILAQUISA',NULL,NULL,NULL,'2026-02-01',1,0),(37,'0501243596','MARIA ROSA ','LOGRO TOTASIG',NULL,NULL,NULL,'2026-02-01',1,0),(38,'0500866942','JOSE RICARDO ','LLUMITASIG TOAPANTA',NULL,NULL,NULL,'2026-02-01',1,0),(39,'0502511405','MARIA DOLORES ','TOTASIG JAMI',NULL,NULL,NULL,'2026-02-01',1,0),(40,'0550375638','MARCO VINICIO','VARGAS COFRE',NULL,NULL,NULL,'2026-02-01',1,0),(41,'0503149098','ROSA ','VARGAS TOAQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(42,'0501211684','MANUEL','VARGAS TOAPANTA',NULL,NULL,NULL,'2026-02-01',1,0),(43,'0502991821','JOSE ABELARDO ','PINCHA VARGAS ',NULL,NULL,NULL,'2026-02-01',1,0),(44,'0550117428','WASHINGTON DEMETRIO','ALBARRACIN CUMBAL',NULL,NULL,NULL,'2026-02-01',1,0),(49,'IGL-000001','DE DIOS MANANTIAL DE VIDA','IGLESIA',NULL,NULL,NULL,'2026-02-01',1,1),(50,'IGL-000002','REY DE LOS APOSTOLES','IGLESIA',NULL,NULL,NULL,'2026-02-01',1,1),(51,'ESC-000001','MANUEL IGNACIO CONDULLE','ESCUELA',NULL,NULL,NULL,'2026-02-01',1,1),(52,'0550394365','LUIS WILMER','PERDOMO PERDOMO',NULL,NULL,NULL,'2026-02-01',1,0),(53,'0503886517','SILVIA MARGOTH','TOAQUIZA VARGAS ',NULL,NULL,NULL,'2026-02-01',1,0),(54,'1702595453','ALEJANDRO ','PERDOMO VARGAS ',NULL,NULL,NULL,'2026-02-01',1,0),(55,'0550080535','LUIS EFRAIN ','LLUMITASIG VARGAS',NULL,NULL,NULL,'2026-02-01',1,0),(56,'0502717564','LUIS HERNAN','GUANOLUISA GUANOQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(57,'0504750944','WILLIAN PATRICIO ','NINASUNTA GUANOQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(58,'0504363334','GUIDO','GUANOLUISA GUANOQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(59,'1723689897','LUIS GEOVANNY','CAILLAGUA CONDOR',NULL,NULL,NULL,'2026-02-01',1,0),(60,'0503739062','EDGAR ','PERDOMO CONDOR',NULL,NULL,NULL,'2026-02-01',1,0),(61,'0502226806','JOSE RICARDO','GUANOQUIZA VARGAS',NULL,NULL,NULL,'2026-02-01',1,0),(62,'0504022351','JAVIER','GUANOLUISA ESPINEL',NULL,NULL,NULL,'2026-02-01',1,0),(63,'0501661532','JOSE FIDEL','PERDOMO NINASUNTA',NULL,NULL,NULL,'2026-02-01',1,0),(64,'0501820229','MARIA MAGDALENA','ESPINEL VEGA',NULL,NULL,NULL,'2026-02-01',1,0),(65,'1711328144','JOSE MIGUEL','GUANOLUISA GUANOQUIZA',NULL,NULL,NULL,'2026-02-01',1,0),(66,'0503007080','JOSE BENEDICTO','SHIGUI YUGCHA',NULL,NULL,NULL,'2026-02-01',1,0),(67,'0504295155','LUIS GEOVANNY','TOTASIG CASILLAS',NULL,NULL,NULL,'2026-02-01',1,0),(68,'0500449863','MANUEL','PERDOMO AYALA',NULL,NULL,NULL,'2026-02-01',1,0),(69,'0503356941','JOSE MANUEL',' CUNDULLE TOCTE',NULL,NULL,NULL,'2026-02-04',1,0),(70,'1721817151','ALEXANDRA CRISTINA','CORMACHI PAUCAR',NULL,NULL,NULL,'2026-03-08',1,0),(71,'0503190878','KLEVER','GUANOLUISA GUANOQUIZA',NULL,NULL,NULL,'2026-03-08',1,0),(72,'0502444672','PATRICIO','NINASUNTA ANCHALLI',NULL,NULL,NULL,'2026-03-08',1,0),(73,'0503758831','JEANETH MARGOTH','ANGUISACA SALAZAR',NULL,NULL,NULL,'2026-03-08',1,0),(74,'0502323108','MANUEL','VARGAS CONDOR',NULL,NULL,NULL,'2026-03-08',1,0),(75,'0502776412','JOSE','PERDOMO NINASUNTA',NULL,NULL,NULL,'2026-03-08',1,0),(76,'0501182315','MARIA JUANA ','JAMI TOAPANTA',NULL,NULL,NULL,'2026-03-08',1,0),(77,'0502089576','MARIA ROSA','TOTASIG JAMI',NULL,NULL,NULL,'2026-03-08',1,0),(78,'0503793317','RICARDO','LLUMITASIG VARGAS ',NULL,NULL,NULL,'2026-03-08',1,0),(79,'0502828718','LUIS NELSON','SALAZAR GUANOQUIZA',NULL,NULL,NULL,'2026-05-03',1,0),(80,'0000000000','ADMIN','SISTEMA',NULL,NULL,NULL,'2026-08-29',1,1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'water_system_prod'
--

--
-- Dumping routines for database 'water_system_prod'
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
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
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
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_update_invoice_total`(IN p_invoice_id INT)
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
        END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-29 18:09:49
