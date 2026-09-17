const pool = require('../config/db');

const getAllConfigs = async () => {
    const [rows] = await pool.query('SELECT * FROM fine_configurations ORDER BY name ASC');
    return rows;
};

const getConfigById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM fine_configurations WHERE config_id = ?', [id]);
    return rows[0];
};

const createConfig = async (configData) => {
    const { name, fine_type, default_amount, description } = configData;
    const [result] = await pool.query(
        'INSERT INTO fine_configurations (name, fine_type, default_amount, description) VALUES (?, ?, ?, ?)',
        [name, fine_type || 'session', default_amount, description || null]
    );
    return result.insertId;
};

const updateConfig = async (id, configData) => {
    const { name, fine_type, default_amount, description } = configData;
    const [result] = await pool.query(
        'UPDATE fine_configurations SET name = ?, fine_type = ?, default_amount = ?, description = ? WHERE config_id = ?',
        [name, fine_type || 'session', default_amount, description || null, id]
    );
    return result.affectedRows;
};

module.exports = {
    getAllConfigs,
    getConfigById,
    createConfig,
    updateConfig
};
