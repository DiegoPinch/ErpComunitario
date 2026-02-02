const pool = require('../config/db');
const bcrypt = require('bcrypt');

const getAllSystemUsers = async () => {
  const [rows] = await pool.query(`
    SELECT su.*, u.first_name, u.last_name, u.national_id
    FROM system_users su
    LEFT JOIN users u ON su.user_id = u.user_id
    ORDER BY (u.national_id REGEXP "^[A-Za-z]") ASC, u.last_name ASC, u.first_name ASC
  `);
  return rows;
};

const getSystemUserById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM system_users WHERE system_user_id = ?', [id]);
  return rows[0];
};

const getSystemUserByUsername = async (username) => {
  const [rows] = await pool.query('SELECT * FROM system_users WHERE username = ?', [username]);
  return rows[0];
};

const existsUsername = async (username, excludeId = null) => {
  let query = 'SELECT * FROM system_users WHERE username = ?';
  const params = [username];
  if (excludeId) {
    query += ' AND system_user_id != ?';
    params.push(excludeId);
  }
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

const createSystemUser = async (su) => {
  const { user_id, username, password, role } = su;
  const exists = await existsUsername(username);
  if (exists) throw new Error('El nombre de usuario ya existe');

  let pwd = password;
  if (!pwd) {
    if (!user_id) throw new Error('Password o user_id requerido para obtener cédula');
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    const userRow = rows && rows[0];
    const cedula = userRow && (userRow.cedula || userRow.dni || userRow.identification || userRow.document || userRow.ci || userRow.id_number);
    if (!cedula) throw new Error('No se encontró cédula/dni del usuario para usar como password');
    pwd = String(cedula);
  }

  const hashed = await bcrypt.hash(pwd, 10);
  const [result] = await pool.query(
    `INSERT INTO system_users (user_id, username, password, role) VALUES (?, ?, ?, ?)`,
    [user_id, username, hashed, role || 'user']
  );
  return result.insertId;
};

const updateSystemUser = async (id, su) => {
  const { user_id, username, password, role } = su;
  const exists = await existsUsername(username, id);
  if (exists) throw new Error('El nombre de usuario ya existe');

  let hashed = password;
  if (password) {
    hashed = await bcrypt.hash(password, 10);
  } else {
    const existing = await getSystemUserById(id);
    if (!existing) throw new Error('System user no encontrado');
    hashed = existing.password;
  }

  const [result] = await pool.query(
    `UPDATE system_users SET user_id=?, username=?, password=?, role=? WHERE system_user_id=?`,
    [user_id, username, hashed, role, id]
  );
  return result.affectedRows;
};

const deleteSystemUser = async (id) => {
  const [result] = await pool.query('DELETE FROM system_users WHERE system_user_id=?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAllSystemUsers,
  getSystemUserById,
  getSystemUserByUsername,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
};