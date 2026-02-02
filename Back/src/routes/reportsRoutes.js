const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// Directorio de Usuarios y Medidores
router.get('/users-meters', reportsController.getUsersMeters);

// Historial de Lecturas
router.get('/readings', reportsController.getReadings);

// Reporte de Recaudación
router.get('/recollection', reportsController.getRecollection);

// Reporte de Morosidad
router.get('/delinquency', reportsController.getDelinquency);

// Reporte de Rubros Adicionales
router.get('/additional-charges', reportsController.getAdditionalCharges);

// Directorio de Usuarios Activos
router.get('/active-users', reportsController.getActiveUsers);

module.exports = router;
