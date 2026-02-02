const pool = require('../config/db');

const getAllUsers = async () => {
  const [rows] = await pool.query('SELECT * FROM users WHERE status = true ORDER BY (national_id REGEXP "^[A-Za-z]") ASC, last_name ASC, first_name ASC');
  return rows;
};

const getUserById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE status = true AND user_id = ?', [id]);
  return rows[0];
};

const existsNationalIdOrEmail = async (national_id, email, excludeId = null) => {
  let query = 'SELECT * FROM users WHERE (national_id = ? OR email = ?)';
  const params = [national_id, email];
  if (excludeId) {
    query += ' AND user_id != ?';
    params.push(excludeId);
  }
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

const createUser = async (user) => {
  const {
    national_id,
    first_name,
    last_name,
    address,
    phone,
    email,
    registration_date,
    status,
  } = user;

  const exists = await existsNationalIdOrEmail(national_id, email);
  if (exists) throw new Error('National ID or email already registered');

  let query;
  let params;
  if (registration_date === undefined) {
    query =
      'INSERT INTO users (national_id, first_name, last_name, address, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
    params = [
      national_id,
      first_name,
      last_name,
      address,
      phone,
      email,
      status ?? true,
    ];
  } else {
    query =
      'INSERT INTO users (national_id, first_name, last_name, address, phone, email, registration_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    params = [
      national_id,
      first_name,
      last_name,
      address,
      phone,
      email,
      registration_date,
      status ?? true,
    ];
  }

  const [result] = await pool.query(query, params);
  return result.insertId;
};

const updateUser = async (id, user) => {
  const {
    national_id,
    first_name,
    last_name,
    address,
    phone,
    email,
    registration_date,
    status,
  } = user;

  const exists = await existsNationalIdOrEmail(national_id, email, id);
  if (exists) throw new Error('National ID or email already registered');

  let query;
  let params;
  if (registration_date === undefined) {
    query =
      'UPDATE users SET national_id=?, first_name=?, last_name=?, address=?, phone=?, email=?, status=? WHERE user_id=?';
    params = [
      national_id,
      first_name,
      last_name,
      address,
      phone,
      email,
      status,
      id,
    ];
  } else {
    query =
      'UPDATE users SET national_id=?, first_name=?, last_name=?, address=?, phone=?, email=?, registration_date=?, status=? WHERE user_id=?';
    params = [
      national_id,
      first_name,
      last_name,
      address,
      phone,
      email,
      registration_date,
      status,
      id,
    ];
  }

  const [result] = await pool.query(query, params);
  return result.affectedRows;
};

const deleteUser = async (id) => {
  const [result] = await pool.query('UPDATE users SET status = false WHERE user_id=?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
