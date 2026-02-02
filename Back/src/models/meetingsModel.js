const pool = require('../config/db');

const getAllMeetings = async () => {
  const [rows] = await pool.query('SELECT * FROM meetings');
  return rows;
};

const getMeetingById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM meetings WHERE meeting_id = ?', [id]);
  return rows[0];
};

const createMeeting = async (meeting) => {
  const { reason, meeting_date, minutes, notes } = meeting;
  const [result] = await pool.query(
    `INSERT INTO meetings (reason, meeting_date, minutes, notes) VALUES (?, ?, ?, ?)`,
    [reason, meeting_date ?? null, minutes ?? null, notes ?? null]
  );
  return result.insertId;
};

const updateMeeting = async (id, meeting) => {
  const { reason, meeting_date, minutes, notes } = meeting;
  const [result] = await pool.query(
    `UPDATE meetings SET reason=?, meeting_date=?, minutes=?, notes=? WHERE meeting_id=?`,
    [reason, meeting_date, minutes, notes, id]
  );
  return result.affectedRows;
};

const deleteMeeting = async (id) => {
  const [result] = await pool.query('DELETE FROM meetings WHERE meeting_id=?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
};