const pool = require('../config/db');

// Obtener asignaciones de un usuario con datos enriquecidos (Historial Completo)
const getAssignmentsByUser = async (userId) => {
  const query = `
    SELECT 
      mh.history_id as assignment_id,
      mh.meter_id,
      mh.user_id,
      mh.assignment_date,
      mh.removal_date,
      mh.assigned,
      m.code as meter_code,
      m.type as meter_type,
      CONCAT(u.first_name, ' ', u.last_name) as user_name
    FROM meter_history mh
    INNER JOIN meters m ON mh.meter_id = m.meter_id
    INNER JOIN users u ON mh.user_id = u.user_id
    WHERE mh.user_id = ?
    ORDER BY mh.assigned DESC, mh.assignment_date DESC
  `;
  const [rows] = await pool.query(query, [userId]);
  return rows;
};

// Obtener medidores disponibles para asignar
const getAvailableMeters = async () => {
  const query = `
    SELECT 
      m.meter_id,
      m.code,
      m.type,
      m.initial_reading,
      m.installation_date,
      m.active
    FROM meters m
    WHERE m.active = TRUE
    AND NOT EXISTS (
      SELECT 1 
      FROM meter_history mh 
      WHERE mh.meter_id = m.meter_id 
      AND mh.assigned = TRUE
    )
    ORDER BY m.code ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

// Verificar si un medidor está asignado actualmente
const isMeterAssigned = async (meterId) => {
  const query = 'SELECT * FROM meter_history WHERE meter_id = ? AND assigned = TRUE';
  const [rows] = await pool.query(query, [meterId]);
  return rows.length > 0;
};

// Retirar una asignación (actualizar removal_date y assigned)
const removeAssignment = async (historyId) => {
  const query = `
    UPDATE meter_history 
    SET assigned = FALSE, removal_date = CURDATE() 
    WHERE history_id = ? AND assigned = TRUE
  `;
  const [result] = await pool.query(query, [historyId]);
  return result.affectedRows;
};

// Helper function to format date to MySQL format (YYYY-MM-DD)
const formatDateForMySQL = (date) => {
  if (!date) return null;

  // Si ya es una cadena en formato YYYY-MM-DD, devolverla tal cual
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Convertir a objeto Date si es una cadena ISO
  const dateObj = date instanceof Date ? date : new Date(date);

  // Formatear a YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Crear con validación
const createMeterHistoryWithValidation = async (history) => {
  const { meter_id, user_id, assignment_date, assigned } = history;

  // 1. Validar que el medidor no esté asignado actualmente a NADIE
  const isAssigned = await isMeterAssigned(meter_id);
  if (isAssigned) {
    throw new Error('Este medidor ya está asignado a otro usuario. Primero debe retirarlo.');
  }

  // 2. Obtener el tipo del medidor que se intenta asignar
  const [meterRows] = await pool.query('SELECT type FROM meters WHERE meter_id = ?', [meter_id]);
  if (meterRows.length === 0) throw new Error('El medidor no existe.');
  const meterType = meterRows[0].type;

  // 3. Validar que el usuario no tenga ya un medidor ACTIVO del mismo tipo
  const checkTypeQuery = `
    SELECT mh.history_id 
    FROM meter_history mh
    INNER JOIN meters m ON mh.meter_id = m.meter_id
    WHERE mh.user_id = ? AND mh.assigned = 1 AND m.type = ?
  `;

  console.log(`Validando tipo de medidor: userId=${user_id}, type=${meterType}`);
  const [existingTypeRows] = await pool.query(checkTypeQuery, [user_id, meterType]);

  if (existingTypeRows.length > 0) {
    console.warn(`Intento de duplicidad detectado: El usuario ${user_id} ya tiene un medidor activo de tipo ${meterType}`);
    throw new Error(`El usuario ya tiene un medidor activo de tipo "${meterType}". Solo se permite un medidor por tipo.`);
  }

  // Formatear la fecha para MySQL
  const formattedDate = formatDateForMySQL(assignment_date);

  // Crear asignación
  const [result] = await pool.query(
    `INSERT INTO meter_history (meter_id, user_id, assignment_date, removal_date, assigned)
     VALUES (?, ?, ?, NULL, ?)`,
    [meter_id, user_id, formattedDate, assigned ?? true]
  );
  return result.insertId;
};

// Crear medidor y asignarlo en una sola transacción
const createAndAssignMeter = async (data) => {
  const { code, type, initial_reading, installation_date, user_id, assignment_date } = data;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Validar si el código ya existe
    const [existing] = await connection.query('SELECT meter_id FROM meters WHERE code = ?', [code]);
    if (existing.length > 0) {
      throw new Error('El código de medidor ya existe');
    }

    // 2. Validar que el usuario no tenga ya un medidor ACTIVO del mismo tipo
    const checkTypeQuery = `
      SELECT mh.history_id 
      FROM meter_history mh
      INNER JOIN meters m ON mh.meter_id = m.meter_id
      WHERE mh.user_id = ? AND mh.assigned = 1 AND m.type = ?
    `;
    const [existingTypeRows] = await connection.query(checkTypeQuery, [user_id, type]);
    if (existingTypeRows.length > 0) {
      throw new Error(`El usuario ya tiene un medidor activo de tipo "${type}".`);
    }

    // 3. Crear el medidor
    const [meterResult] = await connection.query(
      `INSERT INTO meters (code, type, initial_reading, installation_date, active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [code, type, initial_reading || 1, installation_date || new Date()]
    );
    const meterId = meterResult.insertId;

    // 4. Crear la asignación
    const formattedDate = formatDateForMySQL(assignment_date || new Date());
    await connection.query(
      `INSERT INTO meter_history (meter_id, user_id, assignment_date, assigned)
       VALUES (?, ?, ?, TRUE)`,
      [meterId, user_id, formattedDate]
    );

    await connection.commit();
    return meterId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAssignmentsByUser,
  getAvailableMeters,
  isMeterAssigned,
  removeAssignment,
  createMeterHistoryWithValidation,
  createAndAssignMeter,
};