const dashboardModel = require('../models/dashboardModel');

const getStats = async (req, res) => {
    try {
        const stats = await dashboardModel.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error al obtener las estadísticas del dashboard' });
    }
};

module.exports = {
    getStats
};
