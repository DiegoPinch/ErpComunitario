const invoicesModel = require('../models/invoicesModel');

const getPendingUsersSummary = async (req, res, next) => {
  try {
    const summary = await invoicesModel.getPendingUsersSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

const getInvoicesByUserId = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const invoices = await invoicesModel.getInvoicesByUserId(userId);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

const getInvoiceDetails = async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId;
    const details = await invoicesModel.getInvoiceDetails(invoiceId);
    res.json(details);
  } catch (err) {
    next(err);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const id = await invoicesModel.createInvoice(req.body);
    res.status(201).json({ id, message: 'Factura/Cargo creado correctamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPendingUsersSummary,
  getInvoicesByUserId,
  getInvoiceDetails,
  createInvoice,
};