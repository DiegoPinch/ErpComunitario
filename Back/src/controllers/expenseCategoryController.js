const expenseCategoryModel = require('../models/expenseCategoryModel');

const getAllCategories = async (req, res, next) => {
    try {
        const categories = await expenseCategoryModel.getAllCategories();
        res.json(categories);
    } catch (err) {
        next(err);
    }
};

const getCategory = async (req, res, next) => {
    try {
        const category = await expenseCategoryModel.getCategoryById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });
        res.json(category);
    } catch (err) {
        next(err);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const id = await expenseCategoryModel.createCategory(req.body);
        res.status(201).json({ id, message: 'Categoría creada con éxito' });
    } catch (err) {
        next(err);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const affectedRows = await expenseCategoryModel.updateCategory(req.params.id, req.body);
        if (affectedRows === 0) return res.status(404).json({ message: 'Categoría no encontrada' });
        res.json({ message: 'Categoría actualizada con éxito' });
    } catch (err) {
        next(err);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const affectedRows = await expenseCategoryModel.deleteCategory(req.params.id);
        if (affectedRows === 0) return res.status(404).json({ message: 'Categoría no encontrada' });
        res.json({ message: 'Categoría eliminada con éxito' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
