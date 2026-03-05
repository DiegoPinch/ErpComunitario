const invoiceConceptModel = require('../models/invoiceConceptModel');

const createInvoiceConcept = async (req, res, next) => {
  try {
    const id = await invoiceConceptModel.createInvoiceConcept(req.body);
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};

const deleteInvoiceConcept = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await invoiceConceptModel.deleteInvoiceConcept(id);
    if (!rows) return res.status(404).json({ message: 'Concepto de factura no encontrado' });
    res.json({ deleted: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInvoiceConcept,
  deleteInvoiceConcept,
};