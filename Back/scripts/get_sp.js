const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system' });
  const [rows] = await pool.query('SHOW CREATE PROCEDURE sp_apply_global_concept');
  console.log(rows[0]['Create Procedure']);
  process.exit();
})();
