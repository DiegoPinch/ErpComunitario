const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });
  const [rows] = await pool.query("SELECT * FROM payments WHERE payment_id IN (489, 490)");
  console.log(rows);
  process.exit();
})();
