const express = require('express');
const router = express.Router();
const bankAccountsController = require('../controllers/bankAccountsController');

router.get('/', bankAccountsController.getAllAccounts);
router.get('/active', bankAccountsController.getActiveAccounts);
router.post('/', bankAccountsController.createAccount);
router.put('/:id', bankAccountsController.updateAccount);

module.exports = router;
