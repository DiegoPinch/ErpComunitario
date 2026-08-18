const administrationsModel = require('../models/administrationsModel');

const getAllAdministrations = async (req, res, next) => {
    try {
        const administrations = await administrationsModel.getAllAdministrations();
        res.json(administrations);
    } catch (err) {
        next(err);
    }
};

const getAdministrationById = async (req, res, next) => {
    try {
        const admin = await administrationsModel.getAdministrationById(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Directiva no encontrada' });
        res.json(admin);
    } catch (err) {
        next(err);
    }
};

const getActiveAdministration = async (req, res, next) => {
    try {
        const admin = await administrationsModel.getActiveAdministration();
        if (!admin) return res.status(404).json({ message: 'No hay ninguna directiva activa' });
        res.json(admin);
    } catch (err) {
        next(err);
    }
};

const createAdministration = async (req, res, next) => {
    try {
        const id = await administrationsModel.createAdministration(req.body);
        res.status(201).json({ message: 'Directiva creada exitosamente', id });
    } catch (err) {
        next(err);
    }
};

const updateAdministration = async (req, res, next) => {
    try {
        const affectedRows = await administrationsModel.updateAdministration(req.params.id, req.body);
        if (affectedRows === 0) return res.status(404).json({ message: 'Directiva no encontrada' });
        res.json({ message: 'Directiva actualizada exitosamente' });
    } catch (err) {
        next(err);
    }
};

const deleteAdministration = async (req, res, next) => {
    try {
        const affectedRows = await administrationsModel.deleteAdministration(req.params.id);
        if (affectedRows === 0) return res.status(404).json({ message: 'Directiva no encontrada' });
        res.json({ message: 'Directiva eliminada exitosamente' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllAdministrations,
    getAdministrationById,
    getActiveAdministration,
    createAdministration,
    updateAdministration,
    deleteAdministration
};
