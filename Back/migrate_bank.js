require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Running migration...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bank_accounts (
                account_id INT AUTO_INCREMENT PRIMARY KEY,
                bank_name VARCHAR(150) NOT NULL,
                account_number VARCHAR(100) NOT NULL,
                account_type ENUM('savings', 'checking') NOT NULL DEFAULT 'savings',
                initial_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
                status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table bank_accounts created or exists');

        const addCol = async (table, col, def) => {
            try {
                await pool.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
                console.log(`Added ${col} to ${table}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log(`Column ${col} already exists in ${table}`);
                else throw e;
            }
        };

        const addFk = async (table, fkName, col, refTable, refCol) => {
            try {
                await pool.query(`ALTER TABLE ${table} ADD CONSTRAINT ${fkName} FOREIGN KEY (${col}) REFERENCES ${refTable}(${refCol})`);
                console.log(`Added FK ${fkName} to ${table}`);
            } catch (e) {
                if (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_CANT_CREATE_TABLE') console.log(`FK ${fkName} might already exist in ${table}`);
                else throw e;
            }
        };

        await addCol('payments', 'account_id', 'INT DEFAULT NULL');
        await addFk('payments', 'fk_payments_account', 'account_id', 'bank_accounts', 'account_id');

        await addCol('other_incomes', 'account_id', 'INT DEFAULT NULL');
        await addFk('other_incomes', 'fk_other_incomes_account', 'account_id', 'bank_accounts', 'account_id');

        await addCol('expenses', 'account_id', 'INT DEFAULT NULL');
        await addFk('expenses', 'fk_expenses_account', 'account_id', 'bank_accounts', 'account_id');

        await addCol('debt_payments', 'payment_method', "ENUM('cash', 'transfer', 'deposit') NOT NULL DEFAULT 'cash'");
        await addCol('debt_payments', 'account_id', 'INT DEFAULT NULL');
        await addFk('debt_payments', 'fk_debt_payments_account', 'account_id', 'bank_accounts', 'account_id');

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        process.exit();
    }
}

migrate();
