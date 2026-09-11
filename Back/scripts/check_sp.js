const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });
  const [rows] = await pool.query("SHOW PROCEDURE STATUS WHERE Db = 'water_system_prod'");
  console.log(rows.map(r => ({ Name: r.Name, Collation: r.Database_Collation })));
  process.exit();
})();
