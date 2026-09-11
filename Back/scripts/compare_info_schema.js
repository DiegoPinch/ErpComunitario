const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'Pinchita411@' });

  try {
    const [devTables] = await pool.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'water_system'");
    const [prodTables] = await pool.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'water_system_prod'");
    
    const devTableNames = devTables.map(t => t.TABLE_NAME);
    const prodTableNames = prodTables.map(t => t.TABLE_NAME);

    let missingTables = devTableNames.filter(t => !prodTableNames.includes(t));
    if (missingTables.length > 0) {
      console.log('TABLAS FALTANTES EN PROD:', missingTables);
    } else {
      console.log('Todas las tablas existen en PROD.');
    }

    const [devColumns] = await pool.query("SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'water_system'");
    const [prodColumns] = await pool.query("SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'water_system_prod'");

    let hasMissingColumns = false;
    for (const dCol of devColumns) {
      const pCol = prodColumns.find(p => p.TABLE_NAME === dCol.TABLE_NAME && p.COLUMN_NAME === dCol.COLUMN_NAME);
      if (!pCol) {
         if (!missingTables.includes(dCol.TABLE_NAME)) {
            console.log(`COLUMNA FALTANTE: ${dCol.COLUMN_NAME} (${dCol.COLUMN_TYPE}) en la tabla ${dCol.TABLE_NAME}`);
            hasMissingColumns = true;
         }
      } else if (pCol.COLUMN_TYPE !== dCol.COLUMN_TYPE) {
         console.log(`TIPO DE DATO DIFERENTE en ${dCol.TABLE_NAME}.${dCol.COLUMN_NAME}: DEV tiene ${dCol.COLUMN_TYPE}, PROD tiene ${pCol.COLUMN_TYPE}`);
      }
    }

    if (!hasMissingColumns) {
      console.log('Todas las columnas están perfectamente sincronizadas entre DEV y PROD.');
    }

  } catch(e) {
    console.error(e.message);
  }
  process.exit();
})();
