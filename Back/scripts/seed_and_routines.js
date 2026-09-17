require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
  console.log('--- Insertando Datos Sintéticos de Demostración en TiDB Cloud ---');
  const isCloudDB = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'erp_agua_demo',
    port: Number(process.env.DB_PORT) || 4000,
    ssl: isCloudDB ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
  });

  try {
    console.log('Insertando datos de prueba...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');


    await connection.query(`
      INSERT INTO administrations (administration_id, name, start_date, status)
      VALUES (1, 'Administracion Comunitaria Demo 2026', '2026-01-01', 'active')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    await connection.query(`
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
    `);

    // Usuarios del sistema (Password: Admin1234*)
    await connection.query(`
      INSERT INTO system_users (system_user_id, user_id, username, password, role, status) VALUES
      (1, 1, 'admin', '$2b$10$BSqzc07pPQVKFetixuxHfOZCQHqGNIE/ALMaGySfDED6To4nM42tW', 'admin', 1),
      (2, 2, 'tesorero', '$2b$10$BSqzc07pPQVKFetixuxHfOZCQHqGNIE/ALMaGySfDED6To4nM42tW', 'treasurer', 1),
      (3, 3, 'socio_demo', '$2b$10$BSqzc07pPQVKFetixuxHfOZCQHqGNIE/ALMaGySfDED6To4nM42tW', 'user', 1)
      ON DUPLICATE KEY UPDATE username=VALUES(username);
    `);

    // Tarifas
    await connection.query(`
      INSERT INTO rates (rate_id, meter_type, unit_price, base_limit, excess_price, active, start_date, end_date) VALUES
      (1, 'consumo', 3.00, 15, 0.45, 1, '2026-01-01', '9999-12-31'),
      (2, 'riego', 5.00, 20, 0.60, 1, '2026-01-01', '9999-12-31')
      ON DUPLICATE KEY UPDATE unit_price=VALUES(unit_price);
    `);

    // Medidores
    await connection.query(`
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
    `);

    // Asignación Medidores
    await connection.query(`
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
    `);

    // Cuentas Bancarias
    await connection.query(`
      INSERT INTO bank_accounts (account_id, bank_name, account_number, account_type, initial_balance, status) VALUES
      (1, 'Banco Pichincha Demo', '2100998877', 'savings', 1250.00, 'active'),
      (2, 'Banco Guayaquil Demo', '3400112233', 'checking', 800.00, 'active')
      ON DUPLICATE KEY UPDATE bank_name=VALUES(bank_name);
    `);

    // Categorias
    await connection.query(`
      INSERT INTO expense_categories (category_id, name, description) VALUES
      (1, 'Mantenimiento y Reparaciones', 'Repuestos de tuberias, bombas y valvulas'),
      (2, 'Materiales de Oficina', 'Papeleria, facturas, tinta'),
      (3, 'Servicios Basicos y Energia', 'Electricidad de la planta de bombeo')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    await connection.query(`
      INSERT INTO income_categories (category_id, name, description) VALUES
      (1, 'Cuotas Extraordinarias', 'Aportes para obras y mingas'),
      (2, 'Nuevas Instalaciones', 'Cobro por acometida nueva'),
      (3, 'Multas y Sanciones', 'Sanciones por inasistencia')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // Configuraciones de Multas
    await connection.query(`
      INSERT INTO fine_configurations (config_id, name, default_amount, description) VALUES
      (1, 'Inasistencia a Asamblea General', 10.00, 'Multa reglamentaria por falta injustificada'),
      (2, 'Inasistencia a Minga Comunitaria', 15.00, 'Multa por falta a trabajos comunitarios')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // Inventario
    await connection.query(`
      INSERT INTO inventory_items (item_id, code, name, description, category, unit_measure, current_stock, minimum_stock, value, condition_status) VALUES
      (1, 'TUB-01', 'Tubo PVC 1/2 pulg x 6m', 'Tubo reforzado para conexion principal', 'Tuberías', 'tubo', 45, 10, 4.50, 'new'),
      (2, 'VAL-01', 'Valvula de paso 1/2 bronce', 'Valvula de corte para acometida', 'Accesorios', 'unidad', 20, 5, 6.20, 'new'),
      (3, 'UNI-01', 'Union rapida PVC 1/2', 'Union para reparaciones rapidas', 'Accesorios', 'unidad', 60, 15, 1.25, 'new')
      ON DUPLICATE KEY UPDATE code=VALUES(code);
    `);


    // Facturas y Lecturas
    await connection.query(`
      INSERT INTO invoices (invoice_id, user_id, invoice_type, billing_month, description, total_amount, issue_date, status) VALUES
      (1, 1, 'water', '2026-08', 'Factura de Agua', 3.00, '2026-08-01', 'paid'),
      (2, 2, 'water', '2026-08', 'Factura de Agua', 4.35, '2026-08-01', 'pending'),
      (3, 3, 'water', '2026-08', 'Factura de Agua', 3.00, '2026-08-01', 'pending')
      ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);
    `);

    await connection.query(`
      INSERT INTO readings (reading_id, invoice_id, meter_id, rate_id, month_year, previous_reading, current_reading, consumption, excess, amount) VALUES
      (1, 1, 1, 1, '2026-08', 120, 132, 12, 0, 3.00),
      (2, 2, 2, 1, '2026-08', 85, 103, 18, 3, 4.35),
      (3, 3, 3, 1, '2026-08', 210, 224, 14, 0, 3.00)
      ON DUPLICATE KEY UPDATE amount=VALUES(amount);
    `);


    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('✅ Procedimientos y Datos cargados con éxito!');
  } finally {
    await connection.end();
  }
}

seed().catch(console.error);