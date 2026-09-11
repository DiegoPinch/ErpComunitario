const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@', database: 'water_system_prod' });

  try {
    console.log('Alterando la base de datos...');
    await pool.query('ALTER DATABASE water_system_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');

    const [tables] = await pool.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'water_system_prod' AND TABLE_TYPE = 'BASE TABLE'");
    
    for (const row of tables) {
      const tableName = row.TABLE_NAME;
      console.log(`Convirtiendo tabla: ${tableName}`);
      // Convierte la tabla y todas sus columnas de caracteres
      await pool.query(`ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
    }

    console.log('EXITO: Todas las tablas y columnas ahora tienen la misma collation (utf8mb4_general_ci).');
  } catch(e) {
    console.error(e.message);
  }
  process.exit();
})();
