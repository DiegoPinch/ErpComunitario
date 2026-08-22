const fineConfigurationsModel = require('../models/fineConfigurationsModel');

const getAllConfigs = async (req, res, next) => {
    try {
        const configs = await fineConfigurationsModel.getAllConfigs();
        res.json(configs);
    } catch (err) {
        next(err);
    }
};

const getConfig = async (req, res, next) => {
    try {
        const config = await fineConfigurationsModel.getConfigById(req.params.id);
        if (!config) return res.status(404).json({ message: 'Configuración de multa no encontrada' });
        res.json(config);
    } catch (err) {
        next(err);
    }
};

const createConfig = async (req, res, next) => {
    try {
        const id = await fineConfigurationsModel.createConfig(req.body);
        res.status(201).json({ config_id: id, message: 'Configuración de multa creada con éxito' });
    } catch (err) {
        next(err);
    }
};

const updateConfig = async (req, res, next) => {
    try {
        const affectedRows = await fineConfigurationsModel.updateConfig(req.params.id, req.body);
        if (affectedRows === 0) return res.status(404).json({ message: 'Configuración de multa no encontrada' });
        res.json({ message: 'Configuración de multa actualizada con éxito' });
    } catch (err) {
        next(err);
    }
};

const deleteConfig = async (req, res, next) => {
    try {
        const affectedRows = await fineConfigurationsModel.deleteConfig(req.params.id);
        if (affectedRows === 0) return res.status(404).json({ message: 'Configuración de multa no encontrada' });
        res.json({ message: 'Configuración de multa eliminada con éxito' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllConfigs,
    getConfig,
    createConfig,
    updateConfig,
    deleteConfig
};
