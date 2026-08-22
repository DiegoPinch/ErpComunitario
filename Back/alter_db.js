require('dotenv').config();
const pool = require('./src/config/db');

async function addReferenceNumber() {
    try {
        console.log("Adding reference_number to debt_payments...");
        await pool.query(`
            ALTER TABLE debt_payments 
            ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100) AFTER account_id;
        `);
        console.log("Success: debt_payments altered.");
        process.exit(0);
    } catch (err) {
        console.error("Error altering debt_payments:", err.message);
        // It might fail if account_id isn't there, let's just add it
        try {
            await pool.query(`
                ALTER TABLE debt_payments 
                ADD COLUMN reference_number VARCHAR(100);
            `);
            console.log("Success: added reference_number at the end.");
            process.exit(0);
        } catch (e2) {
             console.error("Failed completely:", e2);
             process.exit(1);
        }
    }
}

addReferenceNumber();
