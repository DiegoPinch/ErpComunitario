const express = require('express');
const router = express.Router();
const {
  getPendingUsersSummary,
  getInvoicesByUserId,
  getInvoiceDetails
} = require('../controllers/invoicesController');

router.get('/users-summary', getPendingUsersSummary);
router.get('/user/:userId', getInvoicesByUserId);
router.get('/:invoiceId/details', getInvoiceDetails);

module.exports = router;
