const pool = require('../config/db');

const getAllBoardMembers = async () => {
  const [rows] = await pool.query('SELECT * FROM board_members');
  return rows;
};

const getBoardMemberById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM board_members WHERE board_id = ?', [id]);
  return rows[0];
};

const createBoardMember = async (member) => {
  const { user_id, role, start_date, end_date, active } = member;
  const [result] = await pool.query(
    `INSERT INTO board_members (user_id, role, start_date, end_date, active) VALUES (?, ?, ?, ?, ?)`,
    [user_id, role, start_date ?? null, end_date ?? null, active ?? true]
  );
  return result.insertId;
};

const updateBoardMember = async (id, member) => {
  const { user_id, role, start_date, end_date, active } = member;
  const [result] = await pool.query(
    `UPDATE board_members SET user_id=?, role=?, start_date=?, end_date=?, active=? WHERE board_id=?`,
    [user_id, role, start_date, end_date, active, id]
  );
  return result.affectedRows;
};

const deleteBoardMember = async (id) => {
  const [result] = await pool.query('DELETE FROM board_members WHERE board_id=?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAllBoardMembers,
  getBoardMemberById,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember,
};