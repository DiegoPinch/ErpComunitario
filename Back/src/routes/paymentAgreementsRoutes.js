const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentAgreementsController');

const { generateDebtReceiptPdf } = require('../controllers/pdfController');

router.get('/', controller.getAllAgreements);
router.get('/user/:userId', controller.getAgreementsByUserId);
router.post('/', controller.createAgreement);
router.put('/:id/status', controller.updateAgreementStatus);
router.post('/:id/payment', controller.addDebtPayment);
router.get('/:id/payments', controller.getDebtPayments);
router.post('/process-month', controller.processMonthInstallments);
router.get('/receipt', generateDebtReceiptPdf);

module.exports = router;
