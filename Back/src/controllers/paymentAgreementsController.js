const paymentAgreementsModel = require('../models/paymentAgreementsModel');

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
        const id = await paymentAgreementsModel.createAgreement(req.body);
        res.status(201).json({ id, message: 'Convenio creado con éxito' });
    } catch (err) {
        next(err);
    }
};

const updateAgreementStatus = async (req, res, next) => {
    try {
        const rows = await paymentAgreementsModel.updateAgreementStatus(req.params.id, req.body.status);
        if (!rows) return res.status(404).json({ message: 'Convenio no encontrado' });
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (err) {
        next(err);
    }
};

const addDebtPayment = async (req, res, next) => {
    try {
        const system_user_id = req.user?.system_user_id || req.user?.id || 1; // fallback to 1
        const amount_paid = req.body.amount_paid;
        const payment_method = req.body.payment_method;
        const account_id = req.body.account_id;
        const reference_number = req.body.reference_number;
        
        if (!amount_paid || amount_paid <= 0) {
            return res.status(400).json({ message: 'Monto inválido' });
        }
        const result = await paymentAgreementsModel.addDebtPayment(req.params.id, system_user_id, amount_paid, payment_method, account_id, reference_number);
        res.json({ 
            message: 'Abono registrado correctamente', 
            remaining: result.new_remaining,
            debt_payment_id: result.debt_payment_id 
        });
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
    getDebtPayments,
    processMonthInstallments
};
