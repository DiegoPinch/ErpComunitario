const express = require('express');
const router = express.Router();
const { authorize } = require('../middlewares/auth');
router.use(authorize(['board', 'treasurer']));
const {
  createInvoiceConcept,
  deleteInvoiceConcept
} = require('../controllers/invoiceConceptController');

router.post('/', createInvoiceConcept);
router.delete('/:id', deleteInvoiceConcept);

module.exports = router;
