const otherIncomesModel = require('../models/otherIncomesModel');

const getAll = async (req, res, next) => {
    try {
        const items = await otherIncomesModel.getAll();
        res.json(items);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const system_user_id = req.user.id;
        const incomeData = { ...req.body, system_user_id };
        const id = await otherIncomesModel.create(incomeData);
        res.status(201).json({ id, message: 'Ingreso extraordinario registrado correctamente' });
    } catch (err) {
        next(err);
    }
};

const voidIncome = async (req, res, next) => {
    try {
        const affected = await otherIncomesModel.voidIncome(req.params.id, req.user.id, req.body?.reason);
        if (!affected) return res.status(404).json({ message: 'Ingreso no encontrado o ya anulado' });
        res.json({ message: 'Ingreso anulado correctamente' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAll,
    create,
    voidIncome
};
