const ratesModel = require('../models/ratesModel');

const getRates = async (req, res, next) => {
  try {
    const rates = await ratesModel.getAllRates();
    res.json(rates);
  } catch (err) {
    next(err);
  }
};

const getRate = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rate = await ratesModel.getRateById(id);
    if (!rate) return res.status(404).json({ message: 'Tarifa no encontrada' });
    res.json(rate);
  } catch (err) {
    next(err);
  }
};

const createRate = async (req, res, next) => {
  try {
    const rateData = req.body;
    console.log('Creating rate with data:', rateData);

    // Verificar si ya existe una tarifa activa del mismo tipo
    const existingActiveRate = await ratesModel.getActiveRateByType(rateData.meter_type);
    if (existingActiveRate) {
      return res.status(400).json({
        message: `Ya existe una tarifa activa para el tipo '${rateData.meter_type}'. Debe desactivar la tarifa existente antes de crear una nueva.`
      });
    }

    const id = await ratesModel.createRate(rateData);
    console.log('Rate created successfully with id:', id);
    res.status(201).json({ rate_id: id });
  } catch (err) {
    console.error('Error creating rate:', err.message);
    console.error('Full error:', err);
    next(err);
  }
};

const updateRate = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await ratesModel.updateRate(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Tarifa no encontrada o sin cambios' });
    res.json({ updated: rows });
  } catch (err) {
    next(err);
  }
};

const deleteRate = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await ratesModel.deleteRate(id);
    if (!rows) return res.status(404).json({ message: 'Tarifa no encontrada' });
    res.json({ deactivated: rows, message: 'Tarifa desactivada correctamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRates,
  getRate,
  createRate,
  updateRate,
  deleteRate,
};