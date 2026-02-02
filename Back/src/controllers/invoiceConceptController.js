const invoiceConceptModel = require('../models/invoiceConceptModel');

const getInvoiceConcepts = async (req, res, next) => {
  try {
    const items = await invoiceConceptModel.getAllInvoiceConcepts();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getInvoiceConcept = async (req, res, next) => {
  try {
    const id = req.params.id;
    const item = await invoiceConceptModel.getInvoiceConceptById(id);
    if (!item) return res.status(404).json({ message: 'Concepto de factura no encontrado' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const createInvoiceConcept = async (req, res, next) => {
  try {
    const id = await invoiceConceptModel.createInvoiceConcept(req.body);
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
};

const updateInvoiceConcept = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await invoiceConceptModel.updateInvoiceConcept(id, req.body);
    if (!rows) return res.status(404).json({ message: 'Concepto de factura no encontrado o sin cambios' });
    res.json({ updated: rows });
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
  getInvoiceConcepts,
  getInvoiceConcept,
  createInvoiceConcept,
  updateInvoiceConcept,
  deleteInvoiceConcept,
};