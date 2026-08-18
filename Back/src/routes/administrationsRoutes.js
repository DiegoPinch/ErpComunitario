const express = require('express');
const router = express.Router();
const administrationsController = require('../controllers/administrationsController');

router.get('/', administrationsController.getAllAdministrations);
router.get('/active', administrationsController.getActiveAdministration);
router.get('/:id', administrationsController.getAdministrationById);
router.post('/', administrationsController.createAdministration);
router.put('/:id', administrationsController.updateAdministration);
router.delete('/:id', administrationsController.deleteAdministration);

module.exports = router;
