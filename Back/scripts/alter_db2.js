const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });
  try {
    // Agregar previous_balance
    await pool.query("ALTER TABLE accounting_periods ADD COLUMN previous_balance DECIMAL(10,2) NOT NULL DEFAULT '0.00' AFTER end_date;");
    console.log('EXITO: Columna previous_balance añadida');
  } catch(e) {
    console.log('NOTA previous_balance:', e.message);
  }
  
  try {
    // Modificar attended
    await pool.query("ALTER TABLE attendance MODIFY COLUMN attended ENUM('yes','no','justified') NOT NULL;");
    console.log('EXITO: Columna attended modificada a ENUM');
  } catch(e) {
    console.log('NOTA attended:', e.message);
  }
  
  process.exit();
})();
