const pool = require('../config/db');

const getAllReadings = async () => {
  const [rows] = await pool.query('SELECT * FROM readings');
  return rows;
};

const getReadingById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM readings WHERE reading_id = ?', [id]);
  return rows[0];
};

// obtener la ultima lectura de un medidor
const getLatestReadingByMeter = async (meterId, month_year) => {
  const queryReading = `
    SELECT current_reading, month_year 
    FROM readings 
    WHERE meter_id = ? AND month_year < ?
    ORDER BY month_year DESC 
    LIMIT 1
  `;
  const [rows] = await pool.query(queryReading, [meterId, month_year]);

  if (rows.length > 0) {
    return {
      previous_reading: rows[0].current_reading,
      month_year: rows[0].month_year,
      source: 'reading'
    };
  }

  // Si no hay lecturas, retornar la lectura inicial del medidor
  const queryMeter = 'SELECT initial_reading, installation_date FROM meters WHERE meter_id = ?';
  const [meterRows] = await pool.query(queryMeter, [meterId]);

  if (meterRows.length > 0) {
    return {
      previous_reading: meterRows[0].initial_reading,
      month_year: meterRows[0].installation_date,
      source: 'initial'
    };
  }

  return null;
};

const getCurrentReadingByMeter = async (meterId, month_year) => {
  const query = `
    SELECT r.current_reading, r.amount, i.status as invoice_status, i.invoice_id
    FROM readings r
    INNER JOIN invoices i ON r.invoice_id = i.invoice_id
    WHERE r.meter_id = ? AND r.month_year = ?
  `;
  const [rows] = await pool.query(query, [meterId, month_year]);
  return rows.length > 0 ? rows[0] : null;
};

const getReadingsByMonthYear = async (month_year) => {
  const [rows] = await pool.query('SELECT * FROM readings WHERE month_year = ?', [month_year]);
  return rows;
};

// obtener usuarios mas sus medidores activos
const getAssignmentStatus = async () => {
  const query = `
    SELECT 
      u.user_id, 
      CONCAT(u.last_name, ' ', u.first_name) as user_name, 
      u.national_id,
      m.meter_id, 
      m.code as meter_code, 
      m.type as meter_type
    FROM users u
    INNER JOIN meter_history mh ON u.user_id = mh.user_id AND mh.assigned = 1
    INNER JOIN meters m ON mh.meter_id = m.meter_id
    ORDER BY (u.national_id REGEXP "^[A-Za-z]") ASC, u.last_name, u.first_name;
  `;
  const [rows] = await pool.query(query);

  // Agrupar los resultados por usuario
  const grouped = rows.reduce((acc, row) => {
    let user = acc.find(u => u.user_id === row.user_id);
    if (!user) {
      user = {
        user_id: row.user_id,
        user_name: row.user_name,
        national_id: row.national_id,
        meters: []
      };
      acc.push(user);
    }
    user.meters.push({
      meter_id: row.meter_id,
      meter_code: row.meter_code,
      meter_type: row.meter_type,
      status: 'pending'
    });
    return acc;
  }, []);

  return grouped;
};


// CALL sp_record_reading_and_invoice(user_id, meter_id, month_year, current_reading)
const recordReadingWithSP = async (data) => {
  const { user_id, meter_id, month_year, current_reading } = data;
  const [result] = await pool.query('CALL sp_record_reading_and_invoice(?, ?, ?, ?)', [
    user_id,
    meter_id,
    month_year,
    current_reading
  ]);
  return result;
};

module.exports = {
  getAllReadings,
  getReadingById,
  getLatestReadingByMeter,
  getReadingsByMonthYear,
  getCurrentReadingByMeter,
  getAssignmentStatus,
  recordReadingWithSP,
};
