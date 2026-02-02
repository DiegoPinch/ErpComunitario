const express = require('express');
const router = express.Router();
const {
  collectPayments,
  voidPayment
} = require('../controllers/paymentsController');
const {
  generateReceiptPdf
} = require('../controllers/pdfController');

router.post('/collect', collectPayments);
router.delete('/void/:invoiceId', voidPayment);
router.get('/receipt', generateReceiptPdf);

module.exports = router;
