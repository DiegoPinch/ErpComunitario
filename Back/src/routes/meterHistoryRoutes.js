const express = require('express');
const router = express.Router();
const {
  getAssignmentsByUser,
  getAvailableMeters,
  removeAssignment,
  assignMeter,
  createAndAssignMeter
} = require('../controllers/meterHistoryController');

// Rutas para asignación de medidores
router.get('/available-meters', getAvailableMeters);     // Medidores disponibles para asignar
router.get('/user/:userId', getAssignmentsByUser);       // Asignaciones de un usuario
router.post('/assign', assignMeter);                     // Crear asignación
router.post('/quick-setup', createAndAssignMeter);       // Crear y vincular en un paso
router.put('/remove/:id', removeAssignment);             // Retirar asignación

module.exports = router;
