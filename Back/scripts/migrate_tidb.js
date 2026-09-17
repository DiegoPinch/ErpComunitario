require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  console.log('--- Aplicando migración contable en TiDB Cloud ---');
  console.log('Host:', process.env.DB_HOST);
  console.log('Base:', process.env.DB_NAME);

  const isCloudDB = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'erp_agua_demo',
    port: Number(process.env.DB_PORT) || 4000,
    ssl: isCloudDB ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
  });

  const runSql = async (sql, desc) => {
    try {
      await connection.query(sql);
      if (desc) console.log(`  ✓ ${desc}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column') || err.message.includes('already exists')) {
        console.log(`  - Ya existía: ${desc || sql.slice(0, 40)}`);
      } else {
        console.warn(`  ⚠ ${desc || sql.slice(0, 40)}: ${err.message}`);
      }
    }
  };

  try {
    // 1. accounting_ledger_lock
    await runSql(`
      CREATE TABLE IF NOT EXISTS accounting_ledger_lock (
        lock_id TINYINT NOT NULL PRIMARY KEY
      ) ENGINE=InnoDB;
    `, 'Tabla accounting_ledger_lock');
    await runSql(`INSERT IGNORE INTO accounting_ledger_lock (lock_id) VALUES (1);`, 'Fila lock_id=1');

    // 2. payment_collections
    await runSql(`
      CREATE TABLE IF NOT EXISTS payment_collections (
        collection_id BIGINT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        system_user_id INT NOT NULL,
        payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        total_due DECIMAL(12,2) NOT NULL,
        amount_tendered DECIMAL(12,2) NOT NULL,
        change_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        net_received DECIMAL(12,2) NOT NULL,
        payment_method ENUM('cash','transfer','deposit','card') NOT NULL,
        account_id INT DEFAULT NULL,
        reference_number VARCHAR(100) DEFAULT NULL,
        idempotency_key VARCHAR(100) NOT NULL,
        status ENUM('posted','partially_voided','voided') NOT NULL DEFAULT 'posted',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (collection_id),
        UNIQUE KEY uq_payment_collections_idempotency (idempotency_key),
        KEY idx_payment_collections_date (payment_date),
        CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users(user_id),
        CONSTRAINT fk_collections_system_user FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id),
        CONSTRAINT fk_collections_account FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, 'Tabla payment_collections');

    // 3. financial_audit_log
    await runSql(`
      CREATE TABLE IF NOT EXISTS financial_audit_log (
        audit_id BIGINT NOT NULL AUTO_INCREMENT,
        system_user_id INT NOT NULL,
        action VARCHAR(60) NOT NULL,
        entity_type VARCHAR(60) NOT NULL,
        entity_id BIGINT DEFAULT NULL,
        occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reason VARCHAR(255) DEFAULT NULL,
        before_json JSON DEFAULT NULL,
        after_json JSON DEFAULT NULL,
        PRIMARY KEY (audit_id),
        KEY idx_financial_audit_entity (entity_type, entity_id),
        KEY idx_financial_audit_date (occurred_at),
        CONSTRAINT fk_financial_audit_user FOREIGN KEY (system_user_id) REFERENCES system_users(system_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, 'Tabla financial_audit_log');

    // 4. Columns in payments
    await runSql(`ALTER TABLE payments ADD COLUMN collection_id BIGINT DEFAULT NULL AFTER payment_id;`, 'payments.collection_id');
    await runSql(`ALTER TABLE payments ADD COLUMN status ENUM('posted','voided') NOT NULL DEFAULT 'posted';`, 'payments.status');
    await runSql(`ALTER TABLE payments ADD COLUMN voided_at DATETIME DEFAULT NULL;`, 'payments.voided_at');
    await runSql(`ALTER TABLE payments ADD COLUMN voided_by INT DEFAULT NULL;`, 'payments.voided_by');
    await runSql(`ALTER TABLE payments ADD COLUMN void_reason VARCHAR(255) DEFAULT NULL;`, 'payments.void_reason');

    // 5. Columns in debt_payments
    await runSql(`ALTER TABLE debt_payments ADD COLUMN collection_id BIGINT DEFAULT NULL AFTER debt_payment_id;`, 'debt_payments.collection_id');
    await runSql(`ALTER TABLE debt_payments ADD COLUMN status ENUM('posted','voided') NOT NULL DEFAULT 'posted';`, 'debt_payments.status');
    await runSql(`ALTER TABLE debt_payments ADD COLUMN voided_at DATETIME DEFAULT NULL;`, 'debt_payments.voided_at');
    await runSql(`ALTER TABLE debt_payments ADD COLUMN voided_by INT DEFAULT NULL;`, 'debt_payments.voided_by');
    await runSql(`ALTER TABLE debt_payments ADD COLUMN void_reason VARCHAR(255) DEFAULT NULL;`, 'debt_payments.void_reason');

    // 6. Columns in expenses
    await runSql(`ALTER TABLE expenses ADD COLUMN status ENUM('posted','voided') NOT NULL DEFAULT 'posted';`, 'expenses.status');
    await runSql(`ALTER TABLE expenses ADD COLUMN voided_at DATETIME DEFAULT NULL;`, 'expenses.voided_at');
    await runSql(`ALTER TABLE expenses ADD COLUMN voided_by INT DEFAULT NULL;`, 'expenses.voided_by');
    await runSql(`ALTER TABLE expenses ADD COLUMN void_reason VARCHAR(255) DEFAULT NULL;`, 'expenses.void_reason');

    // 7. Columns in other_incomes
    await runSql(`ALTER TABLE other_incomes ADD COLUMN status ENUM('posted','voided') NOT NULL DEFAULT 'posted';`, 'other_incomes.status');
    await runSql(`ALTER TABLE other_incomes ADD COLUMN voided_at DATETIME DEFAULT NULL;`, 'other_incomes.voided_at');
    await runSql(`ALTER TABLE other_incomes ADD COLUMN voided_by INT DEFAULT NULL;`, 'other_incomes.voided_by');
    await runSql(`ALTER TABLE other_incomes ADD COLUMN void_reason VARCHAR(255) DEFAULT NULL;`, 'other_incomes.void_reason');

    // 8. Columns in invoice_concept
    await runSql(`ALTER TABLE invoice_concept ADD COLUMN description_snapshot VARCHAR(2000) DEFAULT NULL;`, 'invoice_concept.description_snapshot');
    await runSql(`ALTER TABLE invoice_concept ADD COLUMN amount_snapshot DECIMAL(12,2) DEFAULT NULL;`, 'invoice_concept.amount_snapshot');
    await runSql(`ALTER TABLE invoice_concept ADD COLUMN concept_type_snapshot ENUM('standard','fine','installment','discount') DEFAULT NULL;`, 'invoice_concept.concept_type_snapshot');
    await runSql(`ALTER TABLE invoice_concept ADD COLUMN agreement_id INT DEFAULT NULL;`, 'invoice_concept.agreement_id');

    // 9. Columns in accounting_periods
    await runSql(`ALTER TABLE accounting_periods ADD COLUMN previous_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00;`, 'accounting_periods.previous_balance');
    await runSql(`ALTER TABLE accounting_periods ADD COLUMN snapshot_json LONGTEXT NULL;`, 'accounting_periods.snapshot_json');
    await runSql(`ALTER TABLE accounting_periods ADD COLUMN integrity_hash CHAR(64) DEFAULT NULL;`, 'accounting_periods.integrity_hash');
    await runSql(`ALTER TABLE accounting_periods ADD COLUMN closed_at DATETIME DEFAULT NULL;`, 'accounting_periods.closed_at');

    console.log('✨ Migración contable completada exitosamente.');
  } finally {
    await connection.end();
  }
}

run().catch(console.error);