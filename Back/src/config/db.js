// Configuración de la base de datos (MySQL Pool)
const mysql = require('mysql2/promise');

const host = (process.env.DB_HOST || 'localhost').trim();
const user = (process.env.DB_USER || 'root').trim();
const password = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : '';
const database = (process.env.DB_NAME || 'erp_agua_demo').trim();
const isCloudDB = host !== 'localhost' && host !== '127.0.0.1';
const port = Number(process.env.DB_PORT) || (isCloudDB ? 4000 : 3306);

const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
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
 
