const fs = require('fs');
const path = require('path');

let schemaProd = fs.readFileSync(path.join(__dirname, '..', 'schema_prod.sql'), 'utf8');
schemaProd = schemaProd.replace(/\/\*![0-9]+[^\*]*\*\/\s*;?/g, '');
schemaProd = schemaProd.replace(/SET @[^\n;]+;/g, '');
schemaProd = schemaProd.replace(/SET @@[^\n;]+;/g, '');
schemaProd = schemaProd.replace(/--\s*-- Dumping routines[\s\S]*?(?=-- Dump completed|$)/, '');
schemaProd = schemaProd.replace(/-- Dump completed.*/g, '');
schemaProd = schemaProd.replace(/CREATE DEFINER=[^ ]+ PROCEDURE/g, 'CREATE PROCEDURE');

// Extract each table block
const rawTables = {};
const lines = schemaProd.split('\n');
let currentTable = null;
let currentContent = [];

for (const line of lines) {
  const match = line.match(/CREATE TABLE `?(\w+)`?/);
  if (match) {
    currentTable = match[1];
    currentContent = [line];
  } else if (currentTable) {
    currentContent.push(line);
    if (line.trim().endsWith(';')) {
      rawTables[currentTable] = currentContent.join('\n');
      currentTable = null;
      currentContent = [];
    }
  }
}

console.log('Extracted tables:', Object.keys(rawTables).length);

// Strict dependency order (Parent tables first, then child tables)
const orderedTableNames = [
  'administrations',
  'users',
  'system_users',
  'rates',
  'meters',
  'meter_history',
  'bank_accounts',
  'board_members',
  'expense_categories',
  'income_categories',
  'expenses',
  'other_incomes',
  'fine_configurations',
  'meetings',
  'attendance',
  'additional_concepts',
  'invoices',
  'invoice_concept',
  'readings',
  'payments',
  'payment_agreements',
  'debt_payments',
  'inventory_items',
  'inventory_movements',
  'accounting_periods'
];

let orderedDDL = '';
// First drop in reverse order
orderedDDL += '-- 0. Eliminar tablas existentes si ya existen\n';
for (let i = orderedTableNames.length - 1; i >= 0; i--) {
  orderedDDL += `DROP TABLE IF EXISTS \`${orderedTableNames[i]}\`;\n`;
}
orderedDDL += '\n-- 1. Crear tablas en orden de dependencias\n';
for (const name of orderedTableNames) {
  if (rawTables[name]) {
    orderedDDL += rawTables[name] + '\n\n';
  } else {
    console.error('Table missing from rawTables:', name);
  }
}

const syntheticData = `
-- ====================================================
-- INSERCION DE DATOS SINTETICOS DE PRUEBA (100% FICTICIOS)
-- ====================================================

-- 1. Administracion de Prueba
INSERT INTO administrations (administration_id, name, start_date, status)
VALUES (1, 'Administracion Comunitaria Demo 2026', '2026-01-01', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Socios Sinteticos (Cedulas ficticias)
INSERT INTO users (user_id, national_id, first_name, last_name, address, phone, email, registration_date, status, exempt_from_fines) VALUES
(1, '1700000001', 'Juan Carlos', 'Perez Morales', 'Sector El Centro', '0990000001', 'juan.perez@demo.com', '2026-01-01', 1, 0),
(2, '1700000002', 'Maria Elena', 'Lopez Castro', 'Sector La Loma', '0990000002', 'maria.lopez@demo.com', '2026-01-01', 1, 0),
(3, '1700000003', 'Carlos Alberto', 'Gomez Andrade', 'Sector El Molino', '0990000003', 'carlos.gomez@demo.com', '2026-01-01', 1, 0),
(4, '1700000004', 'Rosa Matilde', 'Sanchez Torres', 'Sector Las Penas', '0990000004', 'rosa.sanchez@demo.com', '2026-01-01', 1, 0),
(5, '1700000005', 'Luis Fernando', 'Vasquez Benitez', 'Sector Bellavista', '0990000005', 'luis.vasquez@demo.com', '2026-01-01', 1, 0),
(6, '1700000006', 'Ana Lucia', 'Torres Vega', 'Sector San Pedro', '0990000006', 'ana.torres@demo.com', '2026-01-01', 1, 0),
(7, '1700000007', 'Segundo Miguel', 'Cevallos Cardenas', 'Sector El Centro', '0990000007', 'segundo.c@demo.com', '2026-01-01', 1, 0),
(8, '1700000008', 'Teresa Paulina', 'Morales Salazar', 'Sector La Loma', '0990000008', 'teresa.m@demo.com', '2026-01-01', 1, 1)
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name);

-- 3. Usuarios del Sistema (Contraseña para todos: Admin1234*)
-- Hash Bcrypt de 'Admin1234*': $2b$10$BSqzc07pPQVKFetixuxHfOZCQHqGNIE/ALMaGySfDED6To4nM42tW
INSERT INTO system_users (system_user_id, user_id, username, password, role, status) VALUES
(1, 1, 'admin', '$2b$10$BSqzc07pPQVKFetixuxHfOZCQHqGNIE/ALMaGySfDED6To4nM42tW', 'admin', 1),
(2, 2, 'tesorero', '$2b$10$BSqzc07pPQVKFetixuxHfOZCQHqGNIE/ALMaGySfDED6To4nM42tW', 'treasurer', 1),
(3, 3, 'socio_demo', '$2b$10$BSqzc07pPQVKFetixuxHfOZCQHqGNIE/ALMaGySfDED6To4nM42tW', 'user', 1)
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- 4. Tarifas de Agua
INSERT INTO rates (rate_id, meter_type, unit_price, base_limit, excess_price, active, start_date, end_date) VALUES
(1, 'consumo', 3.00, 15, 0.45, 1, '2026-01-01', '9999-12-31'),
(2, 'riego', 5.00, 20, 0.60, 1, '2026-01-01', '9999-12-31')
ON DUPLICATE KEY UPDATE unit_price=VALUES(unit_price);

-- 5. Medidores de Prueba
INSERT INTO meters (meter_id, code, type, initial_reading, installation_date, active) VALUES
(1, 'MED-001', 'consumo', 0, '2026-01-01', 1),
(2, 'MED-002', 'consumo', 0, '2026-01-01', 1),
(3, 'MED-003', 'consumo', 0, '2026-01-01', 1),
(4, 'MED-004', 'consumo', 0, '2026-01-01', 1),
(5, 'MED-005', 'riego', 0, '2026-01-01', 1),
(6, 'MED-006', 'consumo', 0, '2026-01-01', 1),
(7, 'MED-007', 'consumo', 0, '2026-01-01', 1),
(8, 'MED-008', 'riego', 0, '2026-01-01', 1)
ON DUPLICATE KEY UPDATE code=VALUES(code);

-- 6. Historial de Asignacion de Medidores
INSERT INTO meter_history (history_id, meter_id, user_id, assignment_date, assigned) VALUES
(1, 1, 1, '2026-01-01', 1),
(2, 2, 2, '2026-01-01', 1),
(3, 3, 3, '2026-01-01', 1),
(4, 4, 4, '2026-01-01', 1),
(5, 5, 4, '2026-01-01', 1),
(6, 6, 5, '2026-01-01', 1),
(7, 7, 6, '2026-01-01', 1),
(8, 8, 7, '2026-01-01', 1)
ON DUPLICATE KEY UPDATE meter_id=VALUES(meter_id);

-- 7. Cuentas Bancarias de Prueba
INSERT INTO bank_accounts (account_id, bank_name, account_number, account_type, initial_balance, status) VALUES
(1, 'Banco Pichincha Demo', '2100998877', 'savings', 1250.00, 'active'),
(2, 'Banco Guayaquil Demo', '3400112233', 'checking', 800.00, 'active')
ON DUPLICATE KEY UPDATE bank_name=VALUES(bank_name);

-- 8. Categorias de Gastos e Ingresos
INSERT INTO expense_categories (category_id, name, description, active) VALUES
(1, 'Mantenimiento y Reparaciones', 'Repuestos de tuberias, bombas y valvulas', 1),
(2, 'Materiales de Oficina', 'Papeleria, facturas, tinta', 1),
(3, 'Servicios Basicos y Energia', 'Electricidad de la planta de bombeo', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO income_categories (category_id, name, description, active) VALUES
(1, 'Cuotas Extraordinarias', 'Aportes para obras y mingas', 1),
(2, 'Nuevas Instalaciones', 'Cobro por acometida nueva', 1),
(3, 'Multas y Sanciones', 'Sanciones por inasistencia', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 9. Configuraciones de Multas
INSERT INTO fine_configurations (config_id, fine_type, amount, description, active) VALUES
(1, 'Inasistencia a Asamblea General', 10.00, 'Multa reglamentaria por falta injustificada', 1),
(2, 'Inasistencia a Minga Comunitaria', 15.00, 'Multa por falta a trabajos comunitarios', 1)
ON DUPLICATE KEY UPDATE fine_type=VALUES(fine_type);

-- 10. Inventario de Prueba
INSERT INTO inventory_items (item_id, code, name, unit, stock, min_stock, unit_price, active) VALUES
(1, 'TUB-01', 'Tubo PVC 1/2 pulg x 6m', 'tubo', 45, 10, 4.50, 1),
(2, 'VAL-01', 'Valvula de paso 1/2 bronce', 'unidad', 20, 5, 6.20, 1),
(3, 'UNI-01', 'Union rapida PVC 1/2', 'unidad', 60, 15, 1.25, 1)
ON DUPLICATE KEY UPDATE code=VALUES(code);

-- 11. Facturas y Lecturas del mes 2026-08
INSERT INTO invoices (invoice_id, user_id, invoice_type, billing_month, total_amount, paid_amount, issue_date, status) VALUES
(1, 1, 'water', '2026-08', 3.00, 3.00, '2026-08-01', 'paid'),
(2, 2, 'water', '2026-08', 4.35, 0.00, '2026-08-01', 'pending'),
(3, 3, 'water', '2026-08', 3.00, 0.00, '2026-08-01', 'pending')
ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);

INSERT INTO readings (reading_id, invoice_id, meter_id, rate_id, month_year, previous_reading, current_reading, consumption, excess, amount) VALUES
(1, 1, 1, 1, '2026-08', 120, 132, 12, 0, 3.00),
(2, 2, 2, 1, '2026-08', 85, 103, 18, 3, 4.35),
(3, 3, 3, 1, '2026-08', 210, 224, 14, 0, 3.00)
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

INSERT INTO payments (payment_id, invoice_id, amount, payment_date, payment_method, bank_account_id, reference_number, system_user_id, status) VALUES
(1, 1, 3.00, '2026-08-05 10:30:00', 'cash', NULL, 'REC-00101', 1, 'posted')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

SET FOREIGN_KEY_CHECKS = 1;
`;

let routines = fs.readFileSync(path.join(__dirname, '..', 'routines_only.sql'), 'utf8');
routines = routines.replace(/\/\*![0-9]+[^\*]*\*\/\s*;?/g, '');
routines = routines.replace(/SET @[^\n;]+;/g, '');
routines = routines.replace(/SET @@[^\n;]+;/g, '');
routines = routines.replace(/CREATE DEFINER=[^ ]+ PROCEDURE/g, 'CREATE PROCEDURE');
routines = routines.replace(/-- MySQL dump[\s\S]*?(?=DROP PROCEDURE)/, '');
routines = routines.replace(/-- Dump completed.*/g, '');
routines = routines.replace(/DELIMITER\s*;;?/gi, '');
routines = routines.replace(/DELIMITER\s*\/\//gi, '');
routines = routines.replace(/DELIMITER\s*;/gi, '');
routines = routines.replace(/END\s*;;/gi, 'END;');
routines = routines.replace(/END\s*\/\//gi, 'END;');

const fullScript = `CREATE DATABASE IF NOT EXISTS erp_agua_demo;
USE erp_agua_demo;

SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================
-- 1. ESTRUCTURA DE TABLAS (EN ORDEN DE DEPENDENCIAS)
-- ====================================================
` + orderedDDL + `

-- ====================================================
-- 2. PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES)
-- ====================================================
` + routines + `

` + syntheticData;

fs.writeFileSync(path.join(__dirname, '..', 'schema_sintetico.sql'), fullScript, 'utf8');
console.log('schema_sintetico.sql unificado generado exitosamente con tablas ordenadas + SPs + datos sintéticos!');