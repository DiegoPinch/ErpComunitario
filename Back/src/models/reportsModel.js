const pool = require('../config/db');

/**
 * Report: Directorio de Usuarios y Medidores
 * Listado completo de usuarios y sus medidores activos.
 */
const getUsersMetersReport = async () => {
    const query = `
        SELECT 
            u.user_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            u.national_id,
            u.address,
            u.phone,
            m.code as meter_code,
            m.type as meter_type,
            m.initial_reading,
            m.active as meter_status,
            mh.assigned as assignment_status
        FROM users u
        INNER JOIN meter_history mh ON u.user_id = mh.user_id
        INNER JOIN meters m ON mh.meter_id = m.meter_id
        ORDER BY (u.national_id REGEXP "^[A-Za-z]") ASC, u.last_name, u.first_name, mh.assignment_date DESC;
    `;
    const [rows] = await pool.query(query);
    return rows;
};

/**
 * Report: Historial de Lecturas por Usuario
 * Lecturas filtradas por rango de meses (YYYY-MM).
 */
const getReadingsReport = async (startMonth, endMonth) => {
    const query = `
        SELECT 
            r.month_year,
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            m.code as meter_code,
            m.type as meter_type,
            r.previous_reading,
            r.current_reading,
            r.consumption,
            r.amount as consumption_amount,
            i.total_amount as invoice_total,
            i.status as invoice_status
        FROM readings r
        JOIN invoices i ON r.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        JOIN meters m ON r.meter_id = m.meter_id
        WHERE r.month_year BETWEEN ? AND ?
        ORDER BY r.month_year ASC, u.last_name ASC, u.first_name ASC;
    `;
    const [rows] = await pool.query(query, [startMonth, endMonth]);
    return rows;
};

/**
 * Report: Recaudación (Facturas Pagadas)
 * Listado de pagos realizados en un rango de meses de facturación.
 */
const getRecollectionReport = async (startMonth, endMonth) => {
    const query = `
        SELECT 
            p.payment_date,
            i.billing_month,
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            p.payment_method,
            i.total_amount as paid_amount
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        WHERE i.billing_month BETWEEN ? AND ?
        ORDER BY i.billing_month ASC, p.payment_date DESC, u.last_name ASC, u.first_name ASC;
    `;
    const [rows] = await pool.query(query, [startMonth, endMonth]);
    return rows;
};

/**
 * Report: Morosidad (Facturas Pendientes)
 * Usuarios con deudas en un rango de meses.
 */
const getDelinquencyReport = async (startMonth, endMonth) => {
    const query = `
        SELECT 
            i.billing_month,
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            i.status,
            i.total_amount as total_debt
        FROM invoices i
        JOIN users u ON i.user_id = u.user_id
        WHERE i.status = 'pending' 
          AND i.billing_month BETWEEN ? AND ?
        ORDER BY i.billing_month ASC, u.last_name ASC, u.first_name ASC;
    `;
    const [rows] = await pool.query(query, [startMonth, endMonth]);
    return rows;
};

/**
 * Report: Rubros Adicionales Pagados
 * Detalle de conceptos adicionales recaudados.
 */
const getAdditionalChargesReport = async (startMonth, endMonth) => {
    const query = `
        SELECT 
            i.billing_month,
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            ac.description as concept,
            ac.amount as concept_amount,
            i.status as invoice_status
        FROM invoice_concept ic
        JOIN invoices i ON ic.invoice_id = i.invoice_id
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        JOIN users u ON i.user_id = u.user_id
        WHERE i.status = 'paid'
          AND i.billing_month BETWEEN ? AND ?
        ORDER BY i.billing_month ASC, u.last_name ASC, u.first_name ASC, ac.description;
    `;
    const [rows] = await pool.query(query, [startMonth, endMonth]);
    return rows;
};

/**
 * Report: Directorio de Usuarios Activos
 * Listado de solo usuarios activos ordenados por apellido.
 */
const getActiveUsersReport = async () => {
    const query = `
        SELECT 
            national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            phone,
            email,
            address,
            CASE WHEN status = 1 THEN 'Activo' ELSE 'Inactivo' END as status_label
        FROM users u
        WHERE status = 1 
          AND EXISTS (SELECT 1 FROM meter_history WHERE user_id = u.user_id)
        ORDER BY (u.national_id REGEXP "^[A-Za-z]") ASC, last_name, first_name;
    `;
    const [rows] = await pool.query(query);
    return rows;
};

module.exports = {
    getUsersMetersReport,
    getReadingsReport,
    getRecollectionReport,
    getDelinquencyReport,
    getAdditionalChargesReport,
    getActiveUsersReport,
};
