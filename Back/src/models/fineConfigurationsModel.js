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

const deleteConfig = async (id) => {
    const [meetings] = await pool.query('SELECT meeting_id FROM meetings WHERE fine_config_id = ? LIMIT 1', [id]);
    if (meetings.length > 0) {
        throw new Error('No se puede eliminar la configuración porque tiene reuniones asociadas.');
    }

    const [result] = await pool.query('DELETE FROM fine_configurations WHERE config_id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAllConfigs,
    getConfigById,
    createConfig,
    updateConfig,
    deleteConfig
};
