const expenseModel = require('../models/expenseModel');

const getCurrentBalance = async (req, res, next) => {
    try {
        const balance = await expenseModel.getCurrentBalance();
        res.json({ balance });
    } catch (err) {
        next(err);
    }
};

const getGlobalDebt = async (req, res, next) => {
    try {
        const globalDebt = await expenseModel.getGlobalDebt();
        res.json({ globalDebt });
    } catch (err) {
        next(err);
    }
};

const getCollectionByConcept = async (req, res, next) => {
    try {
        const collection = await expenseModel.getCollectionByConcept();
        res.json(collection);
    } catch (err) {
        next(err);
    }
};

const getAllExpenses = async (req, res, next) => {
    try {
        const expenses = await expenseModel.getAllExpenses();
        res.json(expenses);
    } catch (err) {
        next(err);
    }
};

const createExpense = async (req, res, next) => {
    try {
        const expenseData = {
            ...req.body,
            system_user_id: req.user.id
        };
        const id = await expenseModel.createExpense(expenseData);
        res.status(201).json({ id, message: 'Egreso registrado con éxito' });
    } catch (err) {
        // Si el error es de fondos insuficientes
        if (err.status === 400) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

const updateExpense = async (req, res, next) => {
    try {
        const affectedRows = await expenseModel.updateExpense(req.params.id, req.body, req.user.id);
        if (affectedRows === 0) return res.status(404).json({ message: 'Egreso no encontrado' });
        res.json({ message: 'Egreso actualizado con éxito' });
    } catch (err) {
        if (err.status === 400) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        const affectedRows = await expenseModel.deleteExpense(req.params.id, req.user.id, req.body?.reason);
        if (affectedRows === 0) return res.status(404).json({ message: 'Egreso no encontrado' });
        res.json({ message: 'Egreso eliminado con éxito' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCurrentBalance,
    getGlobalDebt,
    getCollectionByConcept,
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};
