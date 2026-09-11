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
        -- 1. Consumo de Agua (Facturas de Agua Pendientes)
        SELECT 
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            i.billing_month,
            'Consumo de Agua' as concept_type,
            'Consumo de Agua (Planilla Mensual)' as description,
            (i.total_amount - COALESCE((SELECT SUM(ac.amount) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id), 0)) as total_debt
        FROM invoices i
        JOIN users u ON i.user_id = u.user_id
        WHERE i.status = 'pending' 
          AND i.invoice_type = 'water'
          AND i.billing_month BETWEEN ? AND ?
          AND (i.total_amount - COALESCE((SELECT SUM(ac.amount) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id), 0)) > 0

        UNION ALL

        -- 2. Multas y Rubros de Facturas de Agua Pendientes
        SELECT 
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            i.billing_month,
            CASE WHEN ac.concept_type = 'fine' THEN 'Multas de Agua' ELSE 'Rubros Adicionales' END as concept_type,
            ac.description,
            ac.amount as total_debt
        FROM invoice_concept ic
        JOIN invoices i ON ic.invoice_id = i.invoice_id
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        JOIN users u ON i.user_id = u.user_id
        WHERE i.status = 'pending'
          AND i.invoice_type = 'water'
          AND i.billing_month BETWEEN ? AND ?

        UNION ALL

        -- 3. Facturas Pendientes que no son de Agua (ej. Instalaciones directas)
        SELECT 
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            i.billing_month,
            CASE WHEN i.invoice_type = 'installation' THEN 'Venta de Ramal' ELSE 'Otros Rubros' END as concept_type,
            COALESCE(i.description, 'Instalación de Ramal/Servicio') as description,
            i.total_amount as total_debt
        FROM invoices i
        JOIN users u ON i.user_id = u.user_id
        WHERE i.status = 'pending' 
          AND i.invoice_type != 'water'
          AND i.billing_month BETWEEN ? AND ?

        UNION ALL

        -- 4. Deuda Histórica / Convenios Activos (con soporte para start_month null)
        SELECT 
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            COALESCE(pa.start_month, DATE_FORMAT(pa.created_at, '%Y-%m')) as billing_month,
            CASE WHEN pa.description LIKE '%ramal%' THEN 'Venta de Ramal' ELSE 'Deuda Histórica' END as concept_type,
            pa.description,
            pa.remaining_amount as total_debt
        FROM payment_agreements pa
        JOIN users u ON pa.user_id = u.user_id
        WHERE pa.status = 'active'
          AND COALESCE(pa.start_month, DATE_FORMAT(pa.created_at, '%Y-%m')) BETWEEN ? AND ?

        ORDER BY billing_month ASC, user_name ASC, concept_type ASC;
    `;
    const [rows] = await pool.query(query, [
        startMonth, endMonth, 
        startMonth, endMonth, 
        startMonth, endMonth, 
        startMonth, endMonth
    ]);
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

/**
 * Report: Cobros por Fecha de Pago
 * Lista todos los pagos realizados en una fecha específica, sin importar el mes de facturación.
 */
const getDailyCollectionsReport = async (date) => {
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    return await getDetailedCollectionsReport(startDate, endDate);
};

/**
 * Report: Recaudación Detallada y Conciliación de Caja
 * Obtiene todos los ingresos (facturas, convenios, otros ingresos) y egresos en un rango de fechas.
 */
const getDetailedCollectionsReport = async (startDate, endDate) => {
    // 1. Pagos de facturas desglosados proporcionalmente
    const paymentsQuery = `
        SELECT 
            p.payment_id,
            p.payment_date,
            p.payment_method,
            p.account_id,
            ba.bank_name,
            ba.account_number,
            p.invoice_amount,
            p.amount_paid,
            p.change_amount,
            i.invoice_id,
            i.total_amount as invoice_total,
            i.invoice_type,
            i.description as invoice_desc,
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as client_name,
            i.billing_month,
            COALESCE(p.invoice_amount / NULLIF(i.total_amount, 0), 1) as payment_ratio,
            -- Componente de consumo de agua (lecturas)
            COALESCE((
                SELECT SUM(r.amount) 
                FROM readings r 
                WHERE r.invoice_id = i.invoice_id
            ), 0) as water_component,
            -- Componente de multas
            COALESCE((
                SELECT SUM(ac.amount) 
                FROM invoice_concept ic 
                JOIN additional_concepts ac ON ic.concept_id = ac.concept_id 
                WHERE ic.invoice_id = i.invoice_id AND ac.concept_type = 'fine'
            ), 0) as fine_component,
            -- Componente de rubros adicionales
            COALESCE((
                SELECT SUM(ac.amount) 
                FROM invoice_concept ic 
                JOIN additional_concepts ac ON ic.concept_id = ac.concept_id 
                WHERE ic.invoice_id = i.invoice_id AND ac.concept_type NOT IN ('fine')
            ), 0) as additional_component
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        LEFT JOIN bank_accounts ba ON p.account_id = ba.account_id
        WHERE p.payment_date >= ? AND p.payment_date <= ?
        ORDER BY p.payment_date ASC
    `;
    const [invoicePayments] = await pool.query(paymentsQuery, [startDate, endDate]);

    // 2. Abonos a convenios (Cuentas por cobrar recuperadas)
    const debtPaymentsQuery = `
        SELECT 
            dp.debt_payment_id,
            dp.payment_date,
            dp.payment_method,
            dp.account_id,
            ba.bank_name,
            ba.account_number,
            dp.amount_paid,
            pa.description as agreement_desc,
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as client_name
        FROM debt_payments dp
        JOIN payment_agreements pa ON dp.agreement_id = pa.agreement_id
        JOIN users u ON pa.user_id = u.user_id
        LEFT JOIN bank_accounts ba ON dp.account_id = ba.account_id
        WHERE dp.payment_date >= ? AND dp.payment_date <= ?
        ORDER BY dp.payment_date ASC
    `;
    const [debtPayments] = await pool.query(debtPaymentsQuery, [startDate, endDate]);

    // 3. Ingresos extraordinarios
    const otherIncomesQuery = `
        SELECT 
            oi.income_id,
            oi.income_date as payment_date,
            oi.payment_method,
            oi.account_id,
            ba.bank_name,
            ba.account_number,
            oi.amount as amount_paid,
            oi.description
        FROM other_incomes oi
        LEFT JOIN bank_accounts ba ON oi.account_id = ba.account_id
        WHERE oi.income_date >= ? AND oi.income_date <= ?
        ORDER BY oi.income_date ASC
    `;
    const [otherIncomes] = await pool.query(otherIncomesQuery, [startDate, endDate]);

    // 4. Egresos / Gastos
    const expensesQuery = `
        SELECT 
            e.expense_id,
            e.expense_date as payment_date,
            e.payment_method,
            e.account_id,
            ba.bank_name,
            ba.account_number,
            e.amount as amount_paid,
            e.description,
            ec.name as category_name
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
        LEFT JOIN bank_accounts ba ON e.account_id = ba.account_id
        WHERE e.expense_date >= ? AND e.expense_date <= ?
        ORDER BY e.expense_date ASC
    `;
    const [expenses] = await pool.query(expensesQuery, [startDate, endDate]);

    // 5. Desglose detallado de rubros adicionales y multas cobrados
    const conceptsBreakdownQuery = `
        SELECT 
            ac.concept_id,
            ac.concept_type,
            ac.description,
            ac.amount as concept_amount,
            COUNT(ic.id) as qty_paid,
            SUM(ac.amount * COALESCE(p.invoice_amount / NULLIF(i.total_amount, 0), 1)) as total_collected
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN invoice_concept ic ON i.invoice_id = ic.invoice_id
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        WHERE p.payment_date >= ? AND p.payment_date <= ?
        GROUP BY ac.concept_id, ac.concept_type, ac.description, ac.amount
        ORDER BY ac.concept_type DESC, ac.description ASC
    `;
    const [conceptsBreakdown] = await pool.query(conceptsBreakdownQuery, [startDate, endDate]);

    // 6. Cuentas bancarias activas
    const [bankAccounts] = await pool.query('SELECT account_id, bank_name, account_number, initial_balance FROM bank_accounts WHERE status = "active"');

    return {
        invoicePayments,
        debtPayments,
        otherIncomes,
        expenses,
        conceptsBreakdown,
        bankAccounts
    };
};

const getCashBalanceReport = async (startMonth, endMonth) => {
    // Para simplificar la compatibilidad de SQL, traemos ingresos y egresos agrupados
    // y los uniremos en el controlador
    const incQuery = `
        SELECT i.billing_month AS mes, SUM(p.invoice_amount) AS total_ingresos
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        WHERE i.billing_month BETWEEN ? AND ?
          AND p.movement_type = 'payment'
        GROUP BY mes
    `;
    const expQuery = `
        SELECT DATE_FORMAT(expense_date, '%Y-%m') AS mes, SUM(amount) AS total_egresos
        FROM expenses
        WHERE DATE_FORMAT(expense_date, '%Y-%m') BETWEEN ? AND ?
        GROUP BY mes
    `;
    
    const [ingresos] = await pool.query(incQuery, [startMonth, endMonth]);
    const [egresos] = await pool.query(expQuery, [startMonth, endMonth]);
    
    return { ingresos, egresos };
};

/**
 * Report: Detalle de Egresos
 * Lista cada gasto individual en un rango de meses (Para el desglose del PDF).
 */
const getCashExpensesDetailReport = async (startMonth, endMonth) => {
    const query = `
        SELECT 
            e.expense_date,
            c.name AS category_name,
            e.description,
            e.payment_method,
            e.amount
        FROM expenses e
        LEFT JOIN expense_categories c ON e.category_id = c.category_id
        WHERE DATE_FORMAT(e.expense_date, '%Y-%m') BETWEEN ? AND ?
        ORDER BY e.expense_date ASC
    `;
    const [rows] = await pool.query(query, [startMonth, endMonth]);
    return rows;
};

const getComprehensiveReport = async (startDate, endDate) => {
    // 1. Bank Accounts
    const [bankAccounts] = await pool.query('SELECT account_id, bank_name, account_number FROM bank_accounts');

    // 2. Incomes
    const incomesQuery = `
        SELECT 
            p.payment_date as trans_date,
            CAST('Factura de Agua' AS CHAR) as type,
            CAST(CONCAT(u.first_name, ' ', u.last_name) AS CHAR) as source_dest,
            p.payment_method,
            p.account_id,
            p.reference_number,
            p.invoice_amount as amount,
            COALESCE((SELECT SUM(r.amount) FROM readings r WHERE r.invoice_id = i.invoice_id), 0) as water_component,
            COALESCE((SELECT SUM(ac.amount) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND ac.concept_type = 'fine'), 0) as fine_component,
            COALESCE((SELECT SUM(ac.amount) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND ac.concept_type != 'fine'), 0) as additional_component,
            i.total_amount,
            CAST(i.invoice_type AS CHAR) as invoice_type,
            CAST(ba.bank_name AS CHAR) as bank_name,
            CAST(NULL AS CHAR) as agreement_desc
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        LEFT JOIN bank_accounts ba ON p.account_id = ba.account_id
        WHERE p.payment_date >= ? AND p.payment_date <= ?

        UNION ALL

        SELECT 
            dp.payment_date as trans_date,
            CAST('Pago Convenio/Deuda' AS CHAR) as type,
            CAST(CONCAT(u.first_name, ' ', u.last_name) AS CHAR) as source_dest,
            dp.payment_method,
            dp.account_id,
            dp.reference_number,
            dp.amount_paid as amount,
            0 as water_component,
            0 as fine_component,
            0 as additional_component,
            dp.amount_paid as total_amount,
            CAST('legacy_debt' AS CHAR) as invoice_type,
            CAST(ba.bank_name AS CHAR) as bank_name,
            CAST(pa.description AS CHAR) as agreement_desc
        FROM debt_payments dp
        JOIN payment_agreements pa ON dp.agreement_id = pa.agreement_id
        JOIN users u ON pa.user_id = u.user_id
        LEFT JOIN bank_accounts ba ON dp.account_id = ba.account_id
        WHERE dp.payment_date >= ? AND dp.payment_date <= ?

        UNION ALL

        SELECT 
            oi.income_date as trans_date,
            CAST('Ingreso Extraordinario' AS CHAR) as type,
            CAST(oi.description AS CHAR) as source_dest,
            oi.payment_method,
            oi.account_id,
            oi.reference_number,
            oi.amount as amount,
            0 as water_component,
            0 as fine_component,
            0 as additional_component,
            oi.amount as total_amount,
            CAST('other_income' AS CHAR) as invoice_type,
            CAST(ba.bank_name AS CHAR) as bank_name,
            CAST(NULL AS CHAR) as agreement_desc
        FROM other_incomes oi
        LEFT JOIN bank_accounts ba ON oi.account_id = ba.account_id
        WHERE oi.income_date >= ? AND oi.income_date <= ?

        ORDER BY trans_date ASC
    `;
    const [incomes] = await pool.query(incomesQuery, [startDate, endDate, startDate, endDate, startDate, endDate]);

    // 3. Expenses
    const expensesQuery = `
        SELECT 
            e.expense_date as trans_date,
            ec.name as type,
            e.description as source_dest,
            e.payment_method,
            e.account_id,
            e.reference_number,
            e.amount,
            ba.bank_name
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
        LEFT JOIN bank_accounts ba ON e.account_id = ba.account_id
        WHERE e.expense_date >= ? AND e.expense_date <= ?
        ORDER BY trans_date ASC
    `;
    const [expenses] = await pool.query(expensesQuery, [startDate, endDate]);

    // 4. Accounts Receivable (Cuentas por Cobrar Desglosadas filtradas hasta el fin de periodo)
    // Filtramos para que solo incluya las deudas emitidas hasta el mes del fin de periodo (endDate)
    const [pendingInvoicesResult] = await pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'pending' AND billing_month <= DATE_FORMAT(?, '%Y-%m')",
        [endDate]
    );
    const pendingInvoices = pendingInvoicesResult[0].total || 0;

    const [pendingAgreementsResult] = await pool.query(
        `SELECT description, COALESCE(SUM(remaining_amount), 0) as total 
         FROM payment_agreements 
         WHERE status = 'active' 
           AND COALESCE(start_month, DATE_FORMAT(created_at, '%Y-%m')) <= DATE_FORMAT(?, '%Y-%m')
         GROUP BY description`,
        [endDate]
    );

    const accountsReceivableDetails = {
        pendingInvoices,
        pendingAgreements: pendingAgreementsResult
    };

    return {
        bankAccounts,
        incomes,
        expenses,
        accountsReceivableDetails
    };
};

const getBankAccountLedgerReport = async (startMonth, endMonth) => {
    // 1. Obtenemos todas las cuentas bancarias activas
    const [accounts] = await pool.query("SELECT * FROM bank_accounts WHERE status = 'active'");
    
    // Convertimos rango de meses a fechas de inicio y fin
    const startDate = `${startMonth}-01 00:00:00`;
    // Determinar último día del mes final
    const [year, month] = endMonth.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${endMonth}-${String(lastDay).padStart(2, '0')} 23:59:59`;

    const ledgerQuery = `
        SELECT 
            p.payment_date as trans_date,
            'ingreso' as trans_type,
            CONCAT(u.last_name, ' ', u.first_name) as source_dest,
            CASE 
                WHEN i.invoice_type = 'water' THEN 'Consumo de Agua'
                WHEN i.invoice_type = 'installation' THEN 'Venta de Ramal'
                ELSE 'Factura'
            END as concept,
            p.reference_number,
            p.invoice_amount as amount
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        WHERE p.account_id = ?
          AND p.payment_date >= ? AND p.payment_date <= ?

        UNION ALL

        SELECT 
            dp.payment_date as trans_date,
            'ingreso' as trans_type,
            CONCAT(u.last_name, ' ', u.first_name) as source_dest,
            CASE WHEN pa.description LIKE '%ramal%' THEN 'Venta de Ramal' ELSE 'Deuda Histórica' END as concept,
            dp.reference_number,
            dp.amount_paid as amount
        FROM debt_payments dp
        JOIN payment_agreements pa ON dp.agreement_id = pa.agreement_id
        JOIN users u ON pa.user_id = u.user_id
        WHERE dp.account_id = ?
          AND dp.payment_date >= ? AND dp.payment_date <= ?

        UNION ALL

        SELECT 
            oi.income_date as trans_date,
            'ingreso' as trans_type,
            oi.description as source_dest,
            'Ingreso Extraordinario' as concept,
            oi.reference_number,
            oi.amount as amount
        FROM other_incomes oi
        WHERE oi.account_id = ?
          AND oi.income_date >= ? AND oi.income_date <= ?

        UNION ALL

        SELECT 
            e.expense_date as trans_date,
            CASE WHEN e.payment_method = 'cash' THEN 'ingreso' ELSE 'egreso' END as trans_type,
            CASE WHEN e.payment_method = 'cash' THEN CONCAT('Depósito de Efectivo: ', e.description) ELSE e.description END as source_dest,
            CASE WHEN e.payment_method = 'cash' THEN 'Traspaso de Caja' ELSE ec.name END as concept,
            e.reference_number,
            e.amount as amount
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
        WHERE e.account_id = ?
          AND e.expense_date >= ? AND e.expense_date <= ?

        ORDER BY trans_date ASC;
    `;

    const results = [];
    for (const acc of accounts) {
        const [transactions] = await pool.query(ledgerQuery, [
            acc.account_id, startDate, endDate,
            acc.account_id, startDate, endDate,
            acc.account_id, startDate, endDate,
            acc.account_id, startDate, endDate
        ]);
        
        // Calcular sumatorias del periodo
        const totalIncomes = transactions.filter(t => t.trans_type === 'ingreso').reduce((accVal, t) => accVal + parseFloat(t.amount || 0), 0);
        const totalExpenses = transactions.filter(t => t.trans_type === 'egreso').reduce((accVal, t) => accVal + parseFloat(t.amount || 0), 0);
        
        results.push({
            account_id: acc.account_id,
            bank_name: acc.bank_name,
            account_number: acc.account_number,
            account_type: acc.account_type,
            initial_balance: parseFloat(acc.initial_balance || 0),
            total_incomes: totalIncomes,
            total_expenses: totalExpenses,
            period_balance: totalIncomes - totalExpenses,
            current_balance: parseFloat(acc.initial_balance || 0) + totalIncomes - totalExpenses,
            transactions
        });
    }

    return results;
};

const getCashIncomesDetailReport = async (startMonth, endMonth) => {
    const startDate = `${startMonth}-01 00:00:00`;
    const [year, month] = endMonth.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${endMonth}-${String(lastDay).padStart(2, '0')} 23:59:59`;

    // 1. Pagos de facturas
    const paymentsQuery = `
        SELECT 
            p.payment_date,
            p.payment_method,
            p.invoice_amount as amount,
            i.invoice_type,
            i.description as doc_desc,
            CONCAT(u.last_name, ' ', u.first_name) as client_name,
            COALESCE((SELECT SUM(r.amount) FROM readings r WHERE r.invoice_id = i.invoice_id), 0) as water_component,
            COALESCE((SELECT SUM(ac.amount) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND ac.concept_type = 'fine'), 0) as fine_component,
            COALESCE((SELECT SUM(ac.amount) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND ac.concept_type NOT IN ('fine')), 0) as additional_component
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        WHERE p.payment_date >= ? AND p.payment_date <= ?
    `;
    const [invoicePayments] = await pool.query(paymentsQuery, [startDate, endDate]);

    // 2. Abonos a convenios / deudas históricas
    const debtPaymentsQuery = `
        SELECT 
            dp.payment_date,
            dp.payment_method,
            dp.amount_paid as amount,
            'legacy_debt' as invoice_type,
            pa.description as doc_desc,
            CONCAT(u.last_name, ' ', u.first_name) as client_name,
            0 as water_component,
            0 as fine_component,
            0 as additional_component
        FROM debt_payments dp
        JOIN payment_agreements pa ON dp.agreement_id = pa.agreement_id
        JOIN users u ON pa.user_id = u.user_id
        WHERE dp.payment_date >= ? AND dp.payment_date <= ?
    `;
    const [debtPayments] = await pool.query(debtPaymentsQuery, [startDate, endDate]);

    // 3. Ingresos extraordinarios
    const otherIncomesQuery = `
        SELECT 
            oi.income_date as payment_date,
            oi.payment_method,
            oi.amount,
            'other_income' as invoice_type,
            oi.description as doc_desc,
            'Ingreso Extraordinario' as client_name,
            0 as water_component,
            0 as fine_component,
            0 as additional_component
        FROM other_incomes oi
        WHERE oi.income_date >= ? AND oi.income_date <= ?
    `;
    const [otherIncomes] = await pool.query(otherIncomesQuery, [startDate, endDate]);

    const results = [];

    // Mapeo de Pagos de Factura desglosados
    invoicePayments.forEach(p => {
        const ratio = parseFloat(p.amount) / (parseFloat(p.water_component) + parseFloat(p.fine_component) + parseFloat(p.additional_component) || 1);
        const water = parseFloat(p.water_component) * ratio;
        const fine = parseFloat(p.fine_component) * ratio;
        const additional = parseFloat(p.additional_component) * ratio;

        if (p.invoice_type === 'water') {
            if (water > 0) {
                results.push({
                    payment_date: p.payment_date,
                    client_name: p.client_name,
                    concept: 'Consumo de Agua',
                    payment_method: p.payment_method,
                    amount: water
                });
            }
            if (fine > 0) {
                results.push({
                    payment_date: p.payment_date,
                    client_name: p.client_name,
                    concept: 'Multa de Agua',
                    payment_method: p.payment_method,
                    amount: fine
                });
            }
            if (additional > 0) {
                results.push({
                    payment_date: p.payment_date,
                    client_name: p.client_name,
                    concept: 'Rubros Adicionales',
                    payment_method: p.payment_method,
                    amount: additional
                });
            }
        } else if (p.invoice_type === 'installation') {
            results.push({
                payment_date: p.payment_date,
                client_name: p.client_name,
                concept: 'Venta de Ramal',
                payment_method: p.payment_method,
                amount: parseFloat(p.amount)
            });
        } else {
            results.push({
                payment_date: p.payment_date,
                client_name: p.client_name,
                concept: p.doc_desc || 'Factura',
                payment_method: p.payment_method,
                amount: parseFloat(p.amount)
            });
        }
    });

    // Mapeo de Pagos de Convenios (Abonos a Deudas)
    debtPayments.forEach(p => {
        const descLower = String(p.doc_desc || '').toLowerCase();
        const concept = (descLower.includes('ramal') || descLower.includes('conexion') || descLower.includes('conexión'))
            ? 'Venta de Ramal'
            : 'Deuda Histórica';
            
        results.push({
            payment_date: p.payment_date,
            client_name: p.client_name,
            concept: concept,
            payment_method: p.payment_method,
            amount: parseFloat(p.amount)
        });
    });

    // Mapeo de Ingresos Extraordinarios
    otherIncomes.forEach(p => {
        const descLower = String(p.doc_desc || '').toLowerCase();
        let concept = p.doc_desc || 'Ingreso Extraordinario';
        if (descLower.includes('ramal') || descLower.includes('conexion') || descLower.includes('conexión')) {
            concept = 'Venta de Ramal';
        }
        
        results.push({
            payment_date: p.payment_date,
            client_name: 'Ingreso Extraordinario',
            concept: concept,
            payment_method: p.payment_method,
            amount: parseFloat(p.amount)
        });
    });

    // Ordenar cronológicamente
    results.sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));

    return results;
};

module.exports = {
    getUsersMetersReport,
    getReadingsReport,
    getRecollectionReport,
    getDelinquencyReport,
    getAdditionalChargesReport,
    getActiveUsersReport,
    getDailyCollectionsReport,
    getDetailedCollectionsReport,
    getCashBalanceReport,
    getCashExpensesDetailReport,
    getComprehensiveReport,
    getBankAccountLedgerReport,
    getCashIncomesDetailReport
};


