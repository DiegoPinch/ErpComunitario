// Punto de entrada principal
require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

// Probar la conexión al pool antes de iniciar el servidor
pool.getConnection()
  .then((connection) => {
    console.log('Conexión a MySQL pool exitosa');
    connection.release();
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar a MySQL pool:', error);
    process.exit(1);
  });
