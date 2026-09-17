const paymentsModel = require('../models/paymentsModel');

const collectPayments = async (req, res, next) => {
  try {
    const { invoice_ids, amount_paid, change_amount, payment_method, account_id, reference_number, idempotency_key } = req.body;
    if (!invoice_ids || !Array.isArray(invoice_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de invoice_ids' });
    }

    const paid = parseFloat(amount_paid) || 0;
    const change = parseFloat(change_amount) || 0;
    const systemUserId = req.user.id;

    const result = await paymentsModel.collectPayments(invoice_ids, paid, change, systemUserId, payment_method, account_id, reference_number, idempotency_key);
    res.json({ message: 'Pagos procesados correctamente', ...result });
  } catch (err) {
    next(err);
  }
};

const collectCombinedPayment = async (req, res, next) => {
  try {
    const result = await paymentsModel.collectCombinedPayment({
      invoiceIds: req.body.invoice_ids || [],
      debtPayments: req.body.debt_payments || [],
      amountTendered: req.body.amount_tendered,
      paymentMethod: req.body.payment_method || 'cash',
      accountId: req.body.account_id ?? null,
      referenceNumber: req.body.reference_number || null,
      idempotencyKey: req.body.idempotency_key,
      systemUserId: req.user.id
    });
    res.status(result.idempotent ? 200 : 201).json({ message: 'Cobro registrado correctamente', ...result });
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

    await paymentsModel.voidPayment(invoiceId, req.user.id, req.body?.reason);
    res.json({ message: 'Pago anulado correctamente. La factura vuelve a estar pendiente.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  collectPayments,
  collectCombinedPayment,
  voidPayment
};
