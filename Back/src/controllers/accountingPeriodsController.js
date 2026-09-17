const model = require('../models/accountingPeriodsModel');

const getAllPeriods = async (req, res, next) => {
    try {
        const items = await model.getAllPeriods();
        res.json(items);
    } catch (err) {
        next(err);
    }
};

const getPeriodById = async (req, res, next) => {
    try {
        const item = await model.getPeriodById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Informe no encontrado' });
        res.json(item);
    } catch (err) {
        next(err);
    }
};

const generatePeriod = async (req, res, next) => {
    try {
        const periodData = {
            ...req.body,
            system_user_id: req.user.id
        };
        const id = await model.generateAccountingPeriod(periodData);
        res.status(201).json({ id, message: 'Informe contable generado con éxito' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllPeriods,
    getPeriodById,
    generatePeriod
};
