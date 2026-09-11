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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'd66e5ff4-fee7-11f0-9870-0a002700000e:1-4123';

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
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-29 18:29:55
