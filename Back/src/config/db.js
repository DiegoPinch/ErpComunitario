// Configuración de la base de datos (MySQL Pool)
const mysql = require('mysql2/promise');

const isCloudDB = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'erp_agua_demo',
  port: Number(process.env.DB_PORT) || (isCloudDB ? 4000 : 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  ssl: isCloudDB ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
});

module.exports = pool;
 
