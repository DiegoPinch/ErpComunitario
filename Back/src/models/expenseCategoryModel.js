const pool = require('../config/db');

const getAllCategories = async () => {
    const [rows] = await pool.query('SELECT * FROM expense_categories ORDER BY name ASC');
    return rows;
};

const getCategoryById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM expense_categories WHERE category_id = ?', [id]);
    return rows[0];
};

const createCategory = async (categoryData) => {
    const { name, description } = categoryData;
    const [result] = await pool.query(
        'INSERT INTO expense_categories (name, description) VALUES (?, ?)',
        [name, description]
    );
    return result.insertId;
};

const updateCategory = async (id, categoryData) => {
    const { name, description } = categoryData;
    const [result] = await pool.query(
        'UPDATE expense_categories SET name = ?, description = ? WHERE category_id = ?',
        [name, description, id]
    );
    return result.affectedRows;
};

const deleteCategory = async (id) => {
    const [expenses] = await pool.query('SELECT expense_id FROM expenses WHERE category_id = ? LIMIT 1', [id]);
    if (expenses.length > 0) {
        throw new Error('No se puede eliminar la categoría porque tiene gastos asociados.');
    }

    const [result] = await pool.query('DELETE FROM expense_categories WHERE category_id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
