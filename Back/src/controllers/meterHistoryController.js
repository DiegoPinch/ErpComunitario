const meterHistoryModel = require('../models/meterHistoryModel');

// Obtener asignaciones de un usuario específico con datos enriquecidos
const getAssignmentsByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const assignments = await meterHistoryModel.getAssignmentsByUser(userId);
    res.json(assignments);
  } catch (err) {
    next(err);
  }
};

// Obtener medidores disponibles para asignar
const getAvailableMeters = async (req, res, next) => {
  try {
    const meters = await meterHistoryModel.getAvailableMeters();
    res.json(meters);
  } catch (err) {
    next(err);
  }
};

// Retirar una asignación (marcar como no asignado)
const removeAssignment = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await meterHistoryModel.removeAssignment(id);
    if (!rows) {
      return res.status(404).json({ message: 'Asignación no encontrada o ya retirada' });
    }
    res.json({ success: true, message: 'Medidor retirado exitosamente' });
  } catch (err) {
    next(err);
  }
};

// Crear asignación con validación (evita asignaciones duplicadas)
const assignMeter = async (req, res, next) => {
  try {
    const data = req.body;
    const id = await meterHistoryModel.createMeterHistoryWithValidation(data);
    res.status(201).json({ history_id: id, message: 'Medidor asignado exitosamente' });
  } catch (err) {
    // Si es error de validación (medidor ya asignado o usuario ya tiene ese tipo), devolver 400
    if (err.message.includes('ya está asignado') || err.message.includes('ya tiene un medidor') || err.message.includes('no existe')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

// Crear medidor y asignar directamente
const createAndAssignMeter = async (req, res, next) => {
  try {
    const data = req.body;
    const meterId = await meterHistoryModel.createAndAssignMeter(data);
    res.status(201).json({ meter_id: meterId, message: 'Medidor creado y asignado exitosamente' });
  } catch (err) {
    if (err.message.includes('ya existe') || err.message.includes('ya tiene un medidor')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

module.exports = {
  getAssignmentsByUser,
  getAvailableMeters,
  removeAssignment,
  assignMeter,
  createAndAssignMeter,
};