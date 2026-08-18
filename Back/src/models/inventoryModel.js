const pool = require('../config/db');

// --- ITEMS ---
const getAllItems = async () => {
    const [rows] = await pool.query('SELECT * FROM inventory_items ORDER BY name ASC');
    return rows;
};

const getItemById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM inventory_items WHERE item_id = ?', [id]);
    return rows[0];
};

const createItem = async (itemData) => {
    const { code, name, category, description, unit_measure, initial_stock, current_stock, minimum_stock } = itemData;
    const stock = current_stock !== undefined ? current_stock : (initial_stock || 0);
    
    const [result] = await pool.query(
        `INSERT INTO inventory_items (code, name, category, description, unit_measure, current_stock, minimum_stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [code, name, category, description, unit_measure, stock, minimum_stock || 0]
    );
    return result.insertId;
};

const updateItem = async (id, itemData) => {
    const { code, name, category, description, unit_measure, minimum_stock } = itemData;
    const [result] = await pool.query(
        `UPDATE inventory_items 
         SET code = ?, name = ?, category = ?, description = ?, unit_measure = ?, minimum_stock = ? 
         WHERE item_id = ?`,
        [code, name, category, description, unit_measure, minimum_stock, id]
    );
    return result.affectedRows;
};

// --- MOVEMENTS (KARDEX) ---
const getMovementsByItem = async (itemId) => {
    const [rows] = await pool.query(`
        SELECT im.*, su.username 
        FROM inventory_movements im
        LEFT JOIN system_users su ON im.system_user_id = su.system_user_id
        WHERE im.item_id = ?
        ORDER BY im.movement_date DESC
    `, [itemId]);
    return rows;
};

const createMovement = async (movementData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { item_id, system_user_id, movement_type, quantity, unit_cost, reference, description } = movementData;
        const total_cost = quantity * (unit_cost || 0);

        // Insertar movimiento
        const [result] = await connection.query(
            `INSERT INTO inventory_movements 
            (item_id, system_user_id, movement_type, quantity, unit_cost, total_cost, reference, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item_id, system_user_id, movement_type, quantity, unit_cost || 0, total_cost, reference, description]
        );

        // Actualizar stock del item
        if (movement_type === 'in') {
            await connection.query('UPDATE inventory_items SET current_stock = current_stock + ? WHERE item_id = ?', [quantity, item_id]);
        } else if (movement_type === 'out') {
            // Verificar si hay stock suficiente
            const [itemRows] = await connection.query('SELECT current_stock FROM inventory_items WHERE item_id = ?', [item_id]);
            if (itemRows[0].current_stock < quantity) {
                const error = new Error('Stock insuficiente para realizar esta salida');
                error.status = 400;
                throw error;
            }
            await connection.query('UPDATE inventory_items SET current_stock = current_stock - ? WHERE item_id = ?', [quantity, item_id]);
        }

        await connection.commit();
        return result.insertId;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
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
