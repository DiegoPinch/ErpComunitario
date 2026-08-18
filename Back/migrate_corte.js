require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
    try {
        await pool.query("ALTER TABLE accounting_periods ADD COLUMN previous_balance DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER end_date");
        console.log("Migration successful");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists");
        } else {
            console.error(err);
        }
    } finally {
        process.exit();
    }
}
migrate();
