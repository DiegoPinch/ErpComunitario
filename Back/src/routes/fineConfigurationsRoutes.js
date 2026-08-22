const express = require('express');
const router = express.Router();
const fineConfigurationsController = require('../controllers/fineConfigurationsController');

router.get('/', fineConfigurationsController.getAllConfigs);
router.get('/:id', fineConfigurationsController.getConfig);
router.post('/', fineConfigurationsController.createConfig);
router.put('/:id', fineConfigurationsController.updateConfig);
router.delete('/:id', fineConfigurationsController.deleteConfig);

module.exports = router;
