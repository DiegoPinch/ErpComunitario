// Punto de entrada principal
require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');
const { assertAccountingSchema } = require('./utils/databaseSchema');

const PORT = process.env.PORT || 3000;

// Probar la conexión al pool antes de iniciar el servidor
pool.getConnection()
  .then(async (connection) => {
    try { await assertAccountingSchema(connection); }
    finally { connection.release(); }
    console.log('Conexión y estructura contable verificadas');
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo iniciar el backend:', error.message);
    process.exit(1);
  });
