const express = require('express');
const router = express.Router();
const {
  getInvoiceConcepts,
  getInvoiceConcept,
  createInvoiceConcept,
  updateInvoiceConcept,
  deleteInvoiceConcept
} = require('../controllers/invoiceConceptController');

router.get('/', getInvoiceConcepts);
router.get('/:id', getInvoiceConcept);
router.post('/', createInvoiceConcept);
router.put('/:id', updateInvoiceConcept);
router.delete('/:id', deleteInvoiceConcept);

module.exports = router;
