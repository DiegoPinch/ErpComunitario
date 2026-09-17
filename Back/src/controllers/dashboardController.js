const dashboardModel = require('../models/dashboardModel');

const getStats = async (req, res) => {
    try {
        const stats = await dashboardModel.getDashboardStats(req.query.month);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al obtener las estadísticas del dashboard' });
    }
};

module.exports = {
    getStats
};
