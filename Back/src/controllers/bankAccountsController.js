const bankAccountsModel = require('../models/bankAccountsModel');

const getAllAccounts = async (req, res, next) => {
    try {
        const accounts = await bankAccountsModel.getAllAccounts();
        res.json(accounts);
    } catch (err) {
        next(err);
    }
};

const getActiveAccounts = async (req, res, next) => {
    try {
        const accounts = await bankAccountsModel.getActiveAccounts();
        res.json(accounts);
    } catch (err) {
        next(err);
    }
};

const createAccount = async (req, res, next) => {
    try {
        const id = await bankAccountsModel.createAccount(req.body);
        res.status(201).json({ id, message: 'Cuenta bancaria creada con éxito' });
    } catch (err) {
        next(err);
    }
};

const updateAccount = async (req, res, next) => {
    try {
        const affectedRows = await bankAccountsModel.updateAccount(req.params.id, req.body);
        if (affectedRows === 0) return res.status(404).json({ message: 'Cuenta no encontrada' });
        res.json({ message: 'Cuenta actualizada con éxito' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllAccounts,
    getActiveAccounts,
    createAccount,
    updateAccount
};
