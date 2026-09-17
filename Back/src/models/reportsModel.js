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
 * Reporte de cobranza por mes facturado.
 * Incluye todas las facturas vigentes para medir facturación, cobro y cartera.
 */
const getRecollectionReport = async (startMonth, endMonth) => {
    const query = `
        SELECT
            i.invoice_id,
            i.billing_month,
            u.national_id,
            CONCAT(u.last_name, ' ', u.first_name) as user_name,
            i.status AS invoice_status,
            i.total_amount AS billed_amount,
            COALESCE((SELECT SUM(r.amount) FROM readings r WHERE r.invoice_id=i.invoice_id),0) AS water_amount,
            COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot,ac.amount)) FROM invoice_concept ic
              JOIN additional_concepts ac ON ac.concept_id=ic.concept_id WHERE ic.invoice_id=i.invoice_id
              AND COALESCE(ic.concept_type_snapshot,ac.concept_type)='fine'),0) AS fine_amount,
            COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot,ac.amount)) FROM invoice_concept ic
              JOIN additional_concepts ac ON ac.concept_id=ic.concept_id WHERE ic.invoice_id=i.invoice_id
              AND COALESCE(ic.concept_type_snapshot,ac.concept_type)<>'fine'),0) AS additional_amount,
            COALESCE(SUM(CASE WHEN p.status='posted' THEN p.invoice_amount ELSE 0 END), 0) AS collected_amount,
            i.total_amount - COALESCE(SUM(CASE WHEN p.status='posted' THEN p.invoice_amount ELSE 0 END), 0) AS pending_amount,
            CASE
              WHEN i.total_amount = 0 THEN 100
              ELSE ROUND(LEAST(COALESCE(SUM(CASE WHEN p.status='posted' THEN p.invoice_amount ELSE 0 END), 0) / i.total_amount * 100, 100), 2)
            END AS collection_percentage,
            GROUP_CONCAT(
              DISTINCT CASE WHEN p.status='posted' THEN DATE_FORMAT(p.payment_date, '%d/%m/%Y') END
              ORDER BY p.payment_date SEPARATOR ', '
            ) AS payment_dates
        FROM invoices i
        JOIN users u ON i.user_id = u.user_id
        LEFT JOIN payments p ON p.invoice_id = i.invoice_id
        WHERE i.status <> 'cancelled'
          AND i.billing_month BETWEEN ? AND ?
        GROUP BY i.invoice_id, i.billing_month, u.national_id, u.last_name, u.first_name,
                 i.status, i.total_amount
        ORDER BY i.billing_month ASC, u.last_name ASC, u.first_name ASC, i.invoice_id ASC;
    `;
    const [rows] = await pool.query(query, [startMonth, endMonth]);
    return rows;
};

/**
 * Report: Morosidad (Facturas Pendientes)
 * Usuarios con deudas en un rango de meses.
 */
const getDelinquencyReport = async (startMonth, endMonth) => {
    const [year, month] = endMonth.split('-').map(Number);
    const cutoff = endMonth + '-' + new Date(year, month, 0).getDate() + ' 23:59:59';
    return require('./receivablesModel').getReceivables(cutoff);
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
            COALESCE(ic.description_snapshot, ac.description) as concept,
            COALESCE(ic.amount_snapshot, ac.amount) as concept_amount,
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
                SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount))
                FROM invoice_concept ic 
                JOIN additional_concepts ac ON ic.concept_id = ac.concept_id 
                WHERE ic.invoice_id = i.invoice_id AND COALESCE(ic.concept_type_snapshot, ac.concept_type) = 'fine'
            ), 0) as fine_component,
            -- Componente de rubros adicionales
            COALESCE((
                SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount))
                FROM invoice_concept ic 
                JOIN additional_concepts ac ON ic.concept_id = ac.concept_id 
                WHERE ic.invoice_id = i.invoice_id AND COALESCE(ic.concept_type_snapshot, ac.concept_type) NOT IN ('fine')
            ), 0) as additional_component
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        LEFT JOIN bank_accounts ba ON p.account_id = ba.account_id
        WHERE p.status='posted' AND p.payment_date >= ? AND p.payment_date <= ?
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
        WHERE dp.status='posted' AND dp.payment_date >= ? AND dp.payment_date <= ?
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
        WHERE oi.status='posted' AND oi.income_date >= ? AND oi.income_date <= ?
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
        WHERE e.status='posted' AND e.expense_date >= ? AND e.expense_date <= ?
        ORDER BY e.expense_date ASC
    `;
    const [expenses] = await pool.query(expensesQuery, [startDate, endDate]);

    // 5. Desglose detallado de rubros adicionales y multas cobrados
    const conceptsBreakdownQuery = `
        SELECT 
            ac.concept_id,
            COALESCE(ic.concept_type_snapshot, ac.concept_type) AS concept_type,
            COALESCE(ic.description_snapshot, ac.description) AS description,
            COALESCE(ic.amount_snapshot, ac.amount) as concept_amount,
            COUNT(ic.id) as qty_paid,
            SUM(COALESCE(ic.amount_snapshot, ac.amount) * COALESCE(p.invoice_amount / NULLIF(i.total_amount, 0), 1)) as total_collected
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN invoice_concept ic ON i.invoice_id = ic.invoice_id
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        WHERE p.status='posted' AND p.payment_date >= ? AND p.payment_date <= ?
        GROUP BY ac.concept_id, COALESCE(ic.concept_type_snapshot, ac.concept_type),
          COALESCE(ic.description_snapshot, ac.description), COALESCE(ic.amount_snapshot, ac.amount)
        ORDER BY concept_type DESC, description ASC
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
        SELECT DATE_FORMAT(movement_date, '%Y-%m') AS mes, SUM(amount) AS total_ingresos
        FROM (
          SELECT payment_date AS movement_date, invoice_amount AS amount FROM payments WHERE status='posted'
          UNION ALL
          SELECT payment_date, amount_paid FROM debt_payments WHERE status='posted'
          UNION ALL
          SELECT income_date, amount FROM other_incomes WHERE status='posted'
        ) movements
        WHERE DATE_FORMAT(movement_date, '%Y-%m') BETWEEN ? AND ?
        GROUP BY mes
    `;
    const expQuery = `
        SELECT DATE_FORMAT(expense_date, '%Y-%m') AS mes, SUM(amount) AS total_egresos
        FROM expenses
        WHERE status='posted' AND DATE_FORMAT(expense_date, '%Y-%m') BETWEEN ? AND ?
          AND (account_id IS NULL OR LOWER(payment_method) != 'cash')
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
        WHERE e.status='posted' AND DATE_FORMAT(e.expense_date, '%Y-%m') BETWEEN ? AND ?
        ORDER BY e.expense_date ASC
    `;
    const [rows] = await pool.query(query, [startMonth, endMonth]);
    return rows;
};

const getComprehensiveReport = async (startDate, endDate, periodSnapshot = null) => {
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
            CAST(i.billing_month AS CHAR) as accounting_month,
            COALESCE((SELECT SUM(r.amount) FROM readings r WHERE r.invoice_id = i.invoice_id), 0) as water_component,
            COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount)) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND COALESCE(ic.concept_type_snapshot, ac.concept_type) = 'fine'), 0) as fine_component,
            COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount)) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND COALESCE(ic.concept_type_snapshot, ac.concept_type) != 'fine'), 0) as additional_component,
            i.total_amount,
            CAST(i.invoice_type AS CHAR) as invoice_type,
            CAST(ba.bank_name AS CHAR) as bank_name,
            CAST(NULL AS CHAR) as agreement_desc
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        LEFT JOIN bank_accounts ba ON p.account_id = ba.account_id
        WHERE p.status='posted' AND p.payment_date >= ? AND p.payment_date <= ?

        UNION ALL

        SELECT 
            dp.payment_date as trans_date,
            CAST('Pago Convenio/Deuda' AS CHAR) as type,
            CAST(CONCAT(u.first_name, ' ', u.last_name) AS CHAR) as source_dest,
            dp.payment_method,
            dp.account_id,
            dp.reference_number,
            dp.amount_paid as amount,
            DATE_FORMAT(dp.payment_date, '%Y-%m') as accounting_month,
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
        WHERE dp.status='posted' AND dp.payment_date >= ? AND dp.payment_date <= ?

        UNION ALL

        SELECT 
            oi.income_date as trans_date,
            CAST('Ingreso Extraordinario' AS CHAR) as type,
            CAST(oi.description AS CHAR) as source_dest,
            oi.payment_method,
            oi.account_id,
            oi.reference_number,
            oi.amount as amount,
            DATE_FORMAT(oi.income_date, '%Y-%m') as accounting_month,
            0 as water_component,
            0 as fine_component,
            0 as additional_component,
            oi.amount as total_amount,
            CAST('other_income' AS CHAR) as invoice_type,
            CAST(ba.bank_name AS CHAR) as bank_name,
            CAST(NULL AS CHAR) as agreement_desc
        FROM other_incomes oi
        LEFT JOIN bank_accounts ba ON oi.account_id = ba.account_id
        WHERE oi.status='posted' AND oi.income_date >= ? AND oi.income_date <= ?

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
        WHERE e.status='posted' AND e.expense_date >= ? AND e.expense_date <= ?
        ORDER BY trans_date ASC
    `;
    const [expenses] = await pool.query(expensesQuery, [startDate, endDate]);

    // 4. Accounts Receivable (Cuentas por Cobrar Desglosadas filtradas hasta el fin de periodo)
    // Filtramos para que solo incluya las deudas emitidas hasta el mes del fin de periodo (endDate)
    const receivables = await require('./receivablesModel').getReceivables(endDate);
    const accountsReceivableDetails = {
        pendingInvoices: Number(periodSnapshot?.pending_invoices ??
            receivables.filter(r => r.invoice_id).reduce((s,r) => s + Number(r.total_debt), 0)),
        pendingAgreements: periodSnapshot?.pending_agreements !== undefined
            ? [{description:'Convenios pendientes al cierre',total:Number(periodSnapshot.pending_agreements)}]
            : receivables.filter(r => r.agreement_id).map(r => ({description:r.description,total:Number(r.total_debt)}))
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
    const [accounts] = await pool.query("SELECT * FROM bank_accounts ORDER BY bank_name, account_number");
    
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
        WHERE p.status='posted' AND p.account_id = ?
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
        WHERE dp.status='posted' AND dp.account_id = ?
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
        WHERE oi.status='posted' AND oi.account_id = ?
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
        WHERE e.status='posted' AND e.account_id = ?
          AND e.expense_date >= ? AND e.expense_date <= ?

        ORDER BY trans_date ASC;
    `;

    const results = [];
    for (const acc of accounts) {
        const [openingRows] = await pool.query(`
            SELECT ? +
              COALESCE((SELECT SUM(invoice_amount) FROM payments WHERE status='posted' AND account_id=? AND payment_date < ?),0) +
              COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE status='posted' AND account_id=? AND payment_date < ?),0) +
              COALESCE((SELECT SUM(amount) FROM other_incomes WHERE status='posted' AND account_id=? AND income_date < ?),0) -
              COALESCE((SELECT SUM(amount) FROM expenses WHERE status='posted' AND account_id=? AND payment_method!='cash' AND expense_date < ?),0) +
              COALESCE((SELECT SUM(amount) FROM expenses WHERE status='posted' AND account_id=? AND payment_method='cash' AND expense_date < ?),0)
              AS opening_balance`,
            [Number(acc.initial_balance || 0), acc.account_id, startDate, acc.account_id, startDate,
              acc.account_id, startDate, acc.account_id, startDate, acc.account_id, startDate]
        );
        const openingBalance = Number(openingRows[0].opening_balance || 0);
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
            opening_balance: openingBalance,
            total_incomes: totalIncomes,
            total_expenses: totalExpenses,
            period_balance: totalIncomes - totalExpenses,
            current_balance: openingBalance + totalIncomes - totalExpenses,
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
            COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount)) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND COALESCE(ic.concept_type_snapshot, ac.concept_type) = 'fine'), 0) as fine_component,
            COALESCE((SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount)) FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id WHERE ic.invoice_id = i.invoice_id AND COALESCE(ic.concept_type_snapshot, ac.concept_type) NOT IN ('fine')), 0) as additional_component
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.invoice_id
        JOIN users u ON i.user_id = u.user_id
        WHERE p.status='posted' AND p.payment_date >= ? AND p.payment_date <= ?
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
        WHERE dp.status='posted' AND dp.payment_date >= ? AND dp.payment_date <= ?
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
        WHERE oi.status='posted' AND oi.income_date >= ? AND oi.income_date <= ?
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


