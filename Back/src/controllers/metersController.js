const metersModel = require('../models/metersModel');

const getMeters = async (req, res, next) => {
  try {
    const meters = await metersModel.getAllMeters();
    res.json(meters);
  } catch (err) {
    next(err);
  }
};

const getMeter = async (req, res, next) => {
  try {
    const id = req.params.id;
    const meter = await metersModel.getMeterById(id);
    if (!meter) return res.status(404).json({ message: 'Medidor no encontrado' });
    res.json(meter);
  } catch (err) {
    next(err);
  }
};

const createMeter = async (req, res, next) => {
  try {
    const meterData = req.body;
    const id = await metersModel.createMeter(meterData);
    res.status(201).json({ meter_id: id });
  } catch (err) {
    next(err);
  }
};

const updateMeter = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await metersModel.updateMeter(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Medidor no encontrado o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteMeter = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await metersModel.deleteMeter(id);
    if (!rows) return res.status(404).json({ message: 'Medidor no encontrado' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMeters,
  getMeter,
  createMeter,
  updateMeter,
  deleteMeter,
};