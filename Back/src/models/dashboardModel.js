const pool = require('../config/db');

const getDashboardStats = async () => {
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; // Local (Ej: '2026-01')

    // Lanzamos todas las promesas al mismo tiempo (ejecución en paralelo)
    const [
        totalUsers,
        meterTypes,
        monthlyRevenue,
        totalDebt,
        revenueHistory,
        consumptionTrend,
        criticalDebtors
    ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT type, COUNT(*) as count FROM meters GROUP BY type'),
        // Suma el total de facturas PAGADAS del mes actual
        pool.query('SELECT SUM(total_amount) as total FROM invoices WHERE status = "paid" AND billing_month = ?', [currentMonthYear]),
        pool.query('SELECT SUM(total_amount) as total FROM invoices WHERE status = "pending"'),
        pool.query(`
            SELECT 
                i.billing_month as month,
                SUM(i.total_amount - COALESCE(concepts.total_extra, 0)) as water_amount,
                SUM(COALESCE(concepts.total_extra, 0)) as additional_amount
            FROM invoices i
            LEFT JOIN (
                SELECT invoice_id, SUM(ac.amount) as total_extra
                FROM invoice_concept ic
                JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
                GROUP BY invoice_id
            ) concepts ON i.invoice_id = concepts.invoice_id
            WHERE i.status = 'paid'
            AND i.billing_month >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), '%Y-%m')
            GROUP BY i.billing_month
            ORDER BY i.billing_month ASC
        `),
        pool.query(`
            SELECT 
                r.month_year as month,
                SUM(CASE WHEN UPPER(m.type) = 'CONSUMO' THEN r.consumption ELSE 0 END) as domestic_consumption,
                SUM(CASE WHEN UPPER(m.type) = 'RIEGO' THEN r.consumption ELSE 0 END) as irrigation_consumption
            FROM readings r
            JOIN meters m ON r.meter_id = m.meter_id
            WHERE r.month_year >= DATE_FORMAT(DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), "%Y-%m")
            GROUP BY r.month_year
            ORDER BY r.month_year ASC
        `),
        pool.query(`
            SELECT 
                u.user_id,
                CONCAT(u.last_name, ' ', u.first_name) as name,
                u.national_id,
                COUNT(i.invoice_id) as months_debt,
                SUM(i.total_amount) as total_amount
            FROM users u
            JOIN invoices i ON u.user_id = i.user_id
            WHERE i.status = 'pending'
            GROUP BY u.user_id
            HAVING months_debt >= 3
            ORDER BY months_debt DESC, total_amount DESC
            LIMIT 10
        `)
    ]);

    return {
        kpis: {
            activeUsers: totalUsers[0][0].count,
            meterDistribution: meterTypes[0],
            monthlyRevenue: monthlyRevenue[0][0].total || 0,
            totalPendingDebt: totalDebt[0][0].total || 0
        },
        revenueHistory: revenueHistory[0],
        consumptionTrend: consumptionTrend[0],
        criticalDebtors: criticalDebtors[0]
    };
};

module.exports = {
    getDashboardStats
};
