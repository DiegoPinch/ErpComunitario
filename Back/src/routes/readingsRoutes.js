const express = require('express');
const router = express.Router();
const {
  getReadings,
  getReading,
  getLatestReading,
  getCurrentReading,
  getReadingsByMonthYear,
  getAssignmentStatus,
  processMonthlyReading
} = require('../controllers/readingsController');

// Rutas generales sin parámetros
router.get('/', getReadings);

// Rutas específicas (deben ir ANTES de las rutas con parámetros dinámicos)
router.get('/assignment-status', getAssignmentStatus);
router.get('/latest/:meterId/:month_year', getLatestReading);
router.get('/current/:meterId/:month_year', getCurrentReading);
router.get('/month/:month_year', getReadingsByMonthYear);

// Rutas con parámetros dinámicos al final
router.get('/:id', getReading);

// POST para procesamiento
router.post('/process', processMonthlyReading);

module.exports = router;
