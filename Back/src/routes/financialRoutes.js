const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// Rutas de información financiera
router.get('/balance', expenseController.getCurrentBalance);
router.get('/collection-by-concept', expenseController.getCollectionByConcept);

// Rutas CRUD de gastos
router.get('/expenses', expenseController.getAllExpenses);
router.post('/expenses', expenseController.createExpense);
router.delete('/expenses/:id', expenseController.deleteExpense);

module.exports = router;
