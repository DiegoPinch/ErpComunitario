const paymentAgreementsModel = require('../models/paymentAgreementsModel');
const paymentsModel = require('../models/paymentsModel');

const getAllAgreements = async (req, res, next) => {
    try {
        const items = await paymentAgreementsModel.getAllAgreements();
        res.json(items);
    } catch (err) {
        next(err);
    }
};

const getAgreementsByUserId = async (req, res, next) => {
    try {
        const items = await paymentAgreementsModel.getAgreementsByUserId(req.params.userId);
        res.json(items);
    } catch (err) {
        next(err);
    }
};

const createAgreement = async (req, res, next) => {
    try {
        const id = await paymentAgreementsModel.createAgreement({ ...req.body, system_user_id: req.user.id });
        res.status(201).json({ id, message: 'Convenio creado con éxito' });
    } catch (err) {
        next(err);
    }
};

const updateAgreementStatus = async (req, res, next) => {
    try {
        const rows = await paymentAgreementsModel.updateAgreementStatus(
            req.params.id, req.body.status, req.user.id, req.body.reason
        );
        if (!rows) return res.status(404).json({ message: 'Convenio no encontrado' });
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (err) {
        next(err);
    }
};

const addDebtPayment = async (req, res, next) => {
    try {
        const system_user_id = req.user.id;
        const amount_paid = req.body.amount_paid;
        const payment_method = req.body.payment_method;
        const account_id = req.body.account_id;
        const reference_number = req.body.reference_number;
        
        if (!amount_paid || amount_paid <= 0) {
            return res.status(400).json({ message: 'Monto inválido' });
        }
        const result = await paymentsModel.collectCombinedPayment({
            invoiceIds: [],
            debtPayments: [{ agreement_id: Number(req.params.id), amount: amount_paid }],
            amountTendered: amount_paid,
            paymentMethod: payment_method || 'cash',
            accountId: account_id ?? null,
            referenceNumber: reference_number || null,
            idempotencyKey: req.body.idempotency_key,
            systemUserId: system_user_id
        });
        res.json({ 
            message: 'Abono registrado correctamente', 
            debt_payment_id: result.debt_payment_ids[0],
            collection_id: result.collection_id,
            remaining: result.debt_payments?.[0]?.remaining
        });
    } catch (err) {
        next(err);
    }
};

const voidDebtPayment = async (req, res, next) => {
    try {
        await paymentsModel.voidDebtPayment(req.params.paymentId, req.user.id, req.body?.reason);
        res.json({ message: 'Abono anulado correctamente y saldo del convenio restaurado' });
    } catch (err) {
        next(err);
    }
};

const processMonthInstallments = async (req, res, next) => {
    try {
        const { billing_month } = req.body;
        if (!billing_month) return res.status(400).json({ message: 'Se requiere el billing_month (YYYY-MM)' });
        
        const processedCount = await paymentAgreementsModel.processActiveAgreementsForMonth(billing_month);
        res.json({ message: `Se procesaron e insertaron ${processedCount} cuotas en las facturas del mes ${billing_month}` });
    } catch (err) {
        next(err);
    }
};

const getDebtPayments = async (req, res, next) => {
    try {
        const items = await paymentAgreementsModel.getDebtPaymentsByAgreementId(req.params.id);
        res.json(items);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllAgreements,
    getAgreementsByUserId,
    createAgreement,
    updateAgreementStatus,
    addDebtPayment,
    voidDebtPayment,
    getDebtPayments,
    processMonthInstallments
};
