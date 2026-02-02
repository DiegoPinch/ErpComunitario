const pool = require('../config/db');

const getAllMeters = async () => {
  const query = `
    SELECT 
      m.*,
      EXISTS (
        SELECT 1 FROM meter_history mh 
        WHERE mh.meter_id = m.meter_id AND mh.assigned = TRUE
      ) as is_assigned
    FROM meters m
  `;
  const [rows] = await pool.query(query);
  return rows;
};

const getMeterById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM meters WHERE meter_id = ?', [id]);
  return rows[0];
};

const existsCode = async (code, excludeId = null) => {
  let query = 'SELECT * FROM meters WHERE code = ?';
  const params = [code];
  if (excludeId) {
    query += ' AND meter_id != ?';
    params.push(excludeId);
  }
  const [rows] = await pool.query(query, params);
  return rows.length > 0;
};

const createMeter = async (meter) => {
  const { code, type, initial_reading, installation_date, active } = meter;
  const exists = await existsCode(code);
  if (exists) throw new Error('Código de medidor ya registrado');
  const [result] = await pool.query(
    `INSERT INTO meters (code, type, initial_reading, installation_date, active)
     VALUES (?, ?, ?, ?, ?)`,
    [code, type, initial_reading ?? 0, installation_date ?? null, active ?? true]
  );
  return result.insertId;
};

const updateMeter = async (id, meter) => {
  const { code, type, initial_reading, installation_date, active } = meter;
  const exists = await existsCode(code, id);
  if (exists) throw new Error('Código de medidor ya registrado');
  const [result] = await pool.query(
    `UPDATE meters SET code=?, type=?, initial_reading=?, installation_date=?, active=?
     WHERE meter_id=?`,
    [code, type, initial_reading, installation_date, active, id]
  );
  return result.affectedRows;
};

const deleteMeter = async (id) => {
  const [result] = await pool.query('DELETE FROM meters WHERE meter_id=?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAllMeters,
  getMeterById,
  createMeter,
  updateMeter,
  deleteMeter,
};