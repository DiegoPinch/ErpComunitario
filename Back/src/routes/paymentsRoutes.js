const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/auth');
router.use(authorize(['board', 'treasurer']));
const {
  collectPayments,
  collectCombinedPayment,
  voidPayment
} = require('../controllers/paymentsController');
const {
  generateReceiptPdf
} = require('../controllers/pdfController');

router.post('/collect', collectPayments);
router.post('/collect-combined', collectCombinedPayment);
router.delete('/void/:invoiceId', voidPayment);
router.get('/receipt', generateReceiptPdf);

module.exports = router;
