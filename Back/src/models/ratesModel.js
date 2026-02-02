const pool = require('../config/db');

const getAllRates = async () => {
  const [rows] = await pool.query('SELECT * FROM rates');
  return rows;
};

const getRateById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM rates WHERE rate_id = ?', [id]);
  return rows[0];
};

const createRate = async (rate) => {
  const { meter_type, unit_price, base_limit, excess_price, active, start_date, end_date } = rate;

  // Usar fecha actual como valor por defecto si no se proporciona
  const finalStartDate = start_date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const finalEndDate = end_date || '9999-12-31'; // Fecha muy lejana para indicar "sin fin"

  const [result] = await pool.query(
    `INSERT INTO rates (meter_type, unit_price, base_limit, excess_price, active, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [meter_type, unit_price, base_limit ?? 0, excess_price ?? 0, active ?? true, finalStartDate, finalEndDate]
  );
  return result.insertId;
};

const updateRate = async (id, rate) => {
  const { meter_type, unit_price, base_limit, excess_price, active, start_date, end_date } = rate;
  const [result] = await pool.query(
    `UPDATE rates SET meter_type=?, unit_price=?, base_limit=?, excess_price=?, active=?, start_date=?, end_date=?
     WHERE rate_id=?`,
    [meter_type, unit_price, base_limit, excess_price, active, start_date, end_date, id]
  );
  return result.affectedRows;
};

const deleteRate = async (id) => {
  const [result] = await pool.query('UPDATE rates SET active = false, end_date = NOW() WHERE rate_id=?', [id]);
  return result.affectedRows;
};

const getActiveRateByType = async (meter_type) => {
  const [rows] = await pool.query('SELECT * FROM rates WHERE meter_type = ? AND active = true', [meter_type]);
  return rows[0];
};

module.exports = {
  getAllRates,
  getRateById,
  createRate,
  updateRate,
  deleteRate,
  getActiveRateByType,
};