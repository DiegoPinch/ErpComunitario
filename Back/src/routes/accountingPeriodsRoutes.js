const express = require('express');
const router = express.Router();
const controller = require('../controllers/accountingPeriodsController');

router.get('/', controller.getAllPeriods);
router.get('/:id', controller.getPeriodById);
router.post('/', controller.generatePeriod);

module.exports = router;
