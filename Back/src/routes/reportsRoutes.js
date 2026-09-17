const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/auth');
router.use(authorize(['board', 'treasurer']));
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

const dailyCollectionsReportController = require('../controllers/dailyCollectionsReportController');

// Reporte de Cobros Diarios
router.get('/daily-collections', dailyCollectionsReportController.getDailyCollections);
router.post('/cash-count', require('../controllers/cashCountController').save);
router.get('/collection-days', require('../controllers/cashCountController').listCollectionDays);

const comprehensiveReportController = require('../controllers/comprehensiveReportController');

// Reporte de Estado de Caja
router.get('/cash-balance', reportsController.getCashBalance);

// Reporte Detallado de Egresos
router.get('/expenses', reportsController.getExpensesReport);

// Reporte Detallado de Ingresos
router.get('/incomes', reportsController.getIncomesReport);

// Reporte de Cuentas Bancarias Detallado
router.get('/bank-accounts', reportsController.getBankReport);

// Reporte Integral Contable
router.get('/comprehensive', comprehensiveReportController.getComprehensivePdf);

module.exports = router;


