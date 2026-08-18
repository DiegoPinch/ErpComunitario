const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryController');

// Items
router.get('/items', controller.getAllItems);
router.get('/items/:id', controller.getItemById);
router.post('/items', controller.createItem);
router.put('/items/:id', controller.updateItem);

// Movements
router.get('/items/:itemId/movements', controller.getMovementsByItem);
router.post('/movements', controller.createMovement);

module.exports = router;
