const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');

router.get('/', expenseCategoryController.getAllCategories);
router.get('/:id', expenseCategoryController.getCategory);
router.post('/', expenseCategoryController.createCategory);
router.put('/:id', expenseCategoryController.updateCategory);
router.delete('/:id', expenseCategoryController.deleteCategory);

module.exports = router;
