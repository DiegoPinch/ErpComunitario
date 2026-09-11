const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Pinchita411@',
    database: 'water_system_prod'
  });
  try {
    await pool.query("ALTER TABLE fine_configurations ADD COLUMN fine_type ENUM('session','minga') NOT NULL DEFAULT 'session' AFTER name;");
    console.log('EXITO: Columna añadida correctamente');
  } catch(e) {
    if (e.message.includes('Duplicate column')) {
        console.log('La columna ya existe.');
    } else {
        console.error('ERROR:', e.message);
    }
  }
  process.exit();
})();
