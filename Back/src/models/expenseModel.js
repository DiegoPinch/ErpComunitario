const pool = require('../config/db');

/**
 * Obtiene el balance total actual (Ingresos - Egresos)
 */
const getCurrentBalance = async () => {
    // 1. Ingresos Pagos de facturas
    const [incomeResult] = await pool.query('SELECT SUM(invoice_amount) as total_income FROM payments');
    const totalPayments = parseFloat(incomeResult[0]?.total_income || 0);

    // 2. Ingresos por abonos a deudas
    const [debtIncomeResult] = await pool.query('SELECT SUM(amount_paid) as total_income FROM debt_payments');
    const totalDebtPayments = parseFloat(debtIncomeResult[0]?.total_income || 0);

    // 3. Ingresos extraordinarios / Saldos Iniciales
    const [otherIncomeResult] = await pool.query('SELECT SUM(amount) as total_income FROM other_incomes');
    const totalOtherIncomes = parseFloat(otherIncomeResult[0]?.total_income || 0);

    // 4. Egresos totales (Gastos registrados)
    const [expenseResult] = await pool.query('SELECT SUM(amount) as total_expense FROM expenses');
    const totalExpense = parseFloat(expenseResult[0]?.total_expense || 0);

    const totalIncome = totalPayments + totalDebtPayments + totalOtherIncomes;
    return totalIncome - totalExpense;
};

/**
 * Obtiene la suma total de dinero pendiente de cobrar a favor de la Junta.
 */
const getGlobalDebt = async () => {
    const [globalDebtResult] = await pool.query(`
        SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'pending') +
            (SELECT COALESCE(SUM(remaining_amount), 0) FROM payment_agreements WHERE status = 'active') as global_debt
    `);
    return parseFloat(globalDebtResult[0]?.global_debt || 0);
};

/**
 * Obtiene la recaudación total agrupada por concepto de rubros adicionales
 * basándose solo en facturas pagadas.
 */
const getCollectionByConcept = async () => {
    const query = `
        SELECT 
            ac.concept_id,
            ac.description,
            SUM(ac.amount) as total_collected
        FROM invoice_concept ic
        JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
        JOIN invoices i ON ic.invoice_id = i.invoice_id
        WHERE i.status = 'paid'
        GROUP BY ac.concept_id, ac.description

        UNION ALL

        SELECT 
            0 as concept_id,
            'CONSUMO DE AGUA' as description,
            SUM(r.amount) as total_collected
        FROM readings r
        JOIN invoices i ON r.invoice_id = i.invoice_id
        WHERE i.status = 'paid'
    `;
    const [rows] = await pool.query(query);
    return rows;
};

const getAllExpenses = async () => {
    const query = `
    SELECT e.*, c.name as category_name 
    FROM expenses e
    LEFT JOIN expense_categories c ON e.category_id = c.category_id
    ORDER BY e.expense_date DESC, e.created_at DESC
  `;
    const [rows] = await pool.query(query);
    return rows;
};

const createExpense = async (expenseData) => {
    const { category_id, amount, expense_date, description, payment_method, reference_number, system_user_id } = expenseData;
    const expenseAmount = parseFloat(amount);

    // --- SALDO SHIELD: Validación de fondos antes de proceder ---
    const currentBalance = await getCurrentBalance();

    if (expenseAmount > currentBalance) {
        const error = new Error(`Fondos insuficientes para registrar este egreso. Saldo disponible: $${currentBalance.toFixed(2)}`);
        error.status = 400;
        throw error;
    }

    const [result] = await pool.query(
        `INSERT INTO expenses (category_id, system_user_id, amount, expense_date, description, payment_method, reference_number) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [category_id, system_user_id, expenseAmount, expense_date, description, payment_method || 'cash', reference_number]
    );

    return result.insertId;
};

const updateExpense = async (id, expenseData) => {
    const { category_id, amount, expense_date, description, payment_method, reference_number } = expenseData;
    const newAmount = parseFloat(amount);

    // --- SALDO SHIELD para actualización ---
    // Obtenemos el gasto actual para saber cuánto "devolver" al balance antes de validar
    const [currentExpense] = await pool.query('SELECT amount FROM expenses WHERE expense_id = ?', [id]);
    if (!currentExpense.length) throw new Error('Egreso no encontrado');

    const oldAmount = parseFloat(currentExpense[0].amount);
    const availableFunds = (await getCurrentBalance()) + oldAmount;

    if (newAmount > availableFunds) {
        const error = new Error(`Fondos insuficientes para modificar este egreso. Saldo máximo disponible: $${availableFunds.toFixed(2)}`);
        error.status = 400;
        throw error;
    }

    const [result] = await pool.query(
        `UPDATE expenses 
         SET category_id = ?, amount = ?, expense_date = ?, description = ?, payment_method = ?, reference_number = ?
         WHERE expense_id = ?`,
        [category_id, newAmount, expense_date, description, payment_method || 'cash', reference_number, id]
    );

    return result.affectedRows;
};
const deleteExpense = async (id) => {
    const [result] = await pool.query('DELETE FROM expenses WHERE expense_id = ?', [id]);
    return result.affectedRows;
};

module.exports = {
    getCurrentBalance,
    getGlobalDebt,
    getCollectionByConcept,
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};
