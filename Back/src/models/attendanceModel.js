const pool = require('../config/db');

const getAllAttendance = async () => {
  const [rows] = await pool.query('SELECT * FROM attendance');
  return rows;
};

const getAttendanceById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM attendance WHERE attendance_id = ?', [id]);
  return rows[0];
};

const createAttendance = async (att) => {
  const { meeting_id, user_id, attended, observations } = att;
  const [result] = await pool.query(
    `INSERT INTO attendance (meeting_id, user_id, attended, observations) VALUES (?, ?, ?, ?)`,
    [meeting_id, user_id, attended, observations ?? null]
  );
  return result.insertId;
};

const updateAttendance = async (id, att) => {
  const { meeting_id, user_id, attended, observations } = att;
  const [result] = await pool.query(
    `UPDATE attendance SET meeting_id=?, user_id=?, attended=?, observations=? WHERE attendance_id=?`,
    [meeting_id, user_id, attended, observations, id]
  );
  return result.affectedRows;
};

const deleteAttendance = async (id) => {
  const [result] = await pool.query('DELETE FROM attendance WHERE attendance_id=?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};