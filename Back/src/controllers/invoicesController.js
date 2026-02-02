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

module.exports = {
  getPendingUsersSummary,
  getInvoicesByUserId,
  getInvoiceDetails,
};