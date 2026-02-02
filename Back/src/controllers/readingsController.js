const readingsModel = require('../models/readingsModel');

const getReadings = async (req, res, next) => {
  try {
    const readings = await readingsModel.getAllReadings();
    res.json(readings);
  } catch (err) {
    next(err);
  }
};

const getReading = async (req, res, next) => {
  try {
    const id = req.params.id;
    const reading = await readingsModel.getReadingById(id);
    if (!reading) return res.status(404).json({ message: 'Lectura no encontrada' });
    res.json(reading);
  } catch (err) {
    next(err);
  }
};

const getLatestReading = async (req, res, next) => {
  try {
    const { meterId, month_year } = req.params;
    const reading = await readingsModel.getLatestReadingByMeter(meterId, month_year);
    if (!reading) return res.status(404).json({ message: 'No se encontró lectura previa o inicial' });
    res.json(reading);
  } catch (err) {
    next(err);
  }
};

const getCurrentReading = async (req, res, next) => {
  try {
    const { meterId, month_year } = req.params;
    const reading = await readingsModel.getCurrentReadingByMeter(meterId, month_year);
    res.json(reading);
  } catch (err) {
    next(err);
  }
};

const getReadingsByMonthYear = async (req, res, next) => {
  try {
    const month_year = req.params.month_year;
    const readings = await readingsModel.getReadingsByMonthYear(month_year);
    res.json(readings);
  } catch (err) {
    next(err);
  }
};

const getAssignmentStatus = async (req, res, next) => {
  try {
    const assignments = await readingsModel.getAssignmentStatus();
    res.json(assignments);
  } catch (err) {
    next(err);
  }
};

const processMonthlyReading = async (req, res, next) => {
  try {
    const result = await readingsModel.recordReadingWithSP(req.body);
    res.json({ message: 'Lectura procesada correctamente', result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReadings,
  getReading,
  getLatestReading,
  getCurrentReading,
  getReadingsByMonthYear,
  getAssignmentStatus,
  processMonthlyReading,
};