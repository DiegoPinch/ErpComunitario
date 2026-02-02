const paymentsModel = require('../models/paymentsModel');

const collectPayments = async (req, res, next) => {
  try {
    const { invoice_ids, amount_paid, change_amount } = req.body;
    if (!invoice_ids || !Array.isArray(invoice_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de invoice_ids' });
    }

    const paid = parseFloat(amount_paid) || 0;
    const change = parseFloat(change_amount) || 0;

    await paymentsModel.collectPayments(invoice_ids, paid, change);
    res.json({ message: 'Pagos procesados correctamente' });
  } catch (err) {
    next(err);
  }
};

const voidPayment = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    if (!invoiceId) {
      return res.status(400).json({ message: 'Se requiere el invoiceId' });
    }

    await paymentsModel.voidPayment(invoiceId);
    res.json({ message: 'Pago anulado correctamente. La factura vuelve a estar pendiente.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  collectPayments,
  voidPayment
};