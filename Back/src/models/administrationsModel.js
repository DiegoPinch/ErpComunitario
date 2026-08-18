const pool = require('../config/db');

const getAllAdministrations = async () => {
    const [rows] = await pool.query('SELECT * FROM administrations ORDER BY start_date DESC');
    return rows;
};

const getAdministrationById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM administrations WHERE administration_id = ?', [id]);
    return rows[0];
};

const getActiveAdministration = async () => {
    const [rows] = await pool.query("SELECT * FROM administrations WHERE status = 'active' ORDER BY start_date DESC LIMIT 1");
    return rows[0];
};

const createAdministration = async (adminData) => {
    const { name, start_date, end_date, status } = adminData;
    
    if (status === 'active' || !status) {
        await pool.query("UPDATE administrations SET status = 'completed' WHERE status = 'active'");
    }

    const [result] = await pool.query(
        'INSERT INTO administrations (name, start_date, end_date, status) VALUES (?, ?, ?, ?)',
        [name, start_date, end_date || null, status || 'active']
    );
    return result.insertId;
};

const updateAdministration = async (id, adminData) => {
    const { name, start_date, end_date, status } = adminData;

    if (status === 'active') {
        await pool.query("UPDATE administrations SET status = 'completed' WHERE status = 'active' AND administration_id != ?", [id]);
    }

    const [result] = await pool.query(
        'UPDATE administrations SET name = ?, start_date = ?, end_date = ?, status = ? WHERE administration_id = ?',
        [name, start_date, end_date || null, status, id]
    );
    return result.affectedRows;
};

const deleteAdministration = async (id) => {
    const [result] = await pool.query('DELETE FROM administrations WHERE administration_id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getAllAdministrations,
    getAdministrationById,
    getActiveAdministration,
    createAdministration,
    updateAdministration,
    deleteAdministration
};
