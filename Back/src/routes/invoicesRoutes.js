const express = require('express');
const router = express.Router();
const {
  getPendingUsersSummary,
  getInvoicesByUserId,
  getInvoiceDetails,
  createInvoice
} = require('../controllers/invoicesController');

router.get('/users-summary', getPendingUsersSummary);
router.get('/user/:userId', getInvoicesByUserId);
router.get('/:invoiceId/details', getInvoiceDetails);
router.post('/', createInvoice);

module.exports = router;
