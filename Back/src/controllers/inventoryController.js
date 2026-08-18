const inventoryModel = require('../models/inventoryModel');

// --- ITEMS ---
const getAllItems = async (req, res, next) => {
    try {
        const items = await inventoryModel.getAllItems();
        res.json(items);
    } catch (err) {
        next(err);
    }
};

const getItemById = async (req, res, next) => {
    try {
        const item = await inventoryModel.getItemById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item no encontrado' });
        res.json(item);
    } catch (err) {
        next(err);
    }
};

const createItem = async (req, res, next) => {
    try {
        const id = await inventoryModel.createItem(req.body);
        res.status(201).json({ id, message: 'Item de inventario creado' });
    } catch (err) {
        next(err);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const rows = await inventoryModel.updateItem(req.params.id, req.body);
        if (!rows) return res.status(404).json({ message: 'Item no encontrado' });
        res.json({ message: 'Item actualizado correctamente' });
    } catch (err) {
        next(err);
    }
};

// --- MOVEMENTS ---
const getMovementsByItem = async (req, res, next) => {
    try {
        const movements = await inventoryModel.getMovementsByItem(req.params.itemId);
        res.json(movements);
    } catch (err) {
        next(err);
    }
};

const createMovement = async (req, res, next) => {
    try {
        const movementData = {
            ...req.body,
            system_user_id: req.user?.id || 1
        };
        const id = await inventoryModel.createMovement(movementData);
        res.status(201).json({ id, message: 'Movimiento de inventario registrado' });
    } catch (err) {
        if (err.status === 400) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

module.exports = {
    getAllItems,
    getItemById,
    createItem,
    updateItem,
    getMovementsByItem,
    createMovement
};
