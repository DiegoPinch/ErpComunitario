const pool = require('../config/db');

const getAllBoardMembers = async (administration_id = null) => {
  let query = `
    SELECT bm.*, u.first_name, u.last_name, u.national_id 
    FROM board_members bm
    JOIN users u ON bm.user_id = u.user_id
  `;
  const params = [];
  
  if (administration_id) {
    query += ' WHERE bm.administration_id = ?';
    params.push(administration_id);
  }
  
  query += ' ORDER BY bm.start_date DESC';
  
  const [rows] = await pool.query(query, params);
  return rows;
};

const getBoardMemberById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM board_members WHERE board_id = ?', [id]);
  return rows[0];
};

const createBoardMember = async (member) => {
  const { user_id, role, start_date, end_date, active, administration_id } = member;
  const [result] = await pool.query(
    `INSERT INTO board_members (user_id, role, start_date, end_date, active, administration_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, role, start_date ?? null, end_date ?? null, active ?? true, administration_id ?? null]
  );
  return result.insertId;
};

const updateBoardMember = async (id, member) => {
  const { user_id, role, start_date, end_date, active, administration_id } = member;
  const [result] = await pool.query(
    `UPDATE board_members SET user_id=?, role=?, start_date=?, end_date=?, active=?, administration_id=? WHERE board_id=?`,
    [user_id, role, start_date, end_date, active, administration_id, id]
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