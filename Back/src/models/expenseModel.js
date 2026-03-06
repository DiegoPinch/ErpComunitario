const pool = require('../config/db');

/**
 * Obtiene el balance total actual (Ingresos - Egresos)
 */
const getCurrentBalance = async () => {
    // 1. Ingresos Pagos de facturas
    const [incomeResult] = await pool.query('SELECT SUM(amount_paid) as total_income FROM payments');
    const totalIncome = parseFloat(incomeResult[0]?.total_income || 0);

    // 2. Egresos totales (Gastos registrados)
    const [expenseResult] = await pool.query('SELECT SUM(amount) as total_expense FROM expenses');
    const totalExpense = parseFloat(expenseResult[0]?.total_expense || 0);

    return totalIncome - totalExpense;
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
    const { category_id, amount, expense_date, description, payment_method, reference_number } = expenseData;
    const expenseAmount = parseFloat(amount);

    // --- SALDO SHIELD: Validación de fondos antes de proceder ---
    const currentBalance = await getCurrentBalance();

    if (expenseAmount > currentBalance) {
        const error = new Error(`Fondos insuficientes para registrar este egreso. Saldo disponible: $${currentBalance.toFixed(2)}`);
        error.status = 400;
        throw error;
    }

    const [result] = await pool.query(
        `INSERT INTO expenses (category_id, amount, expense_date, description, payment_method, reference_number) 
     VALUES (?, ?, ?, ?, ?, ?)`,
        [category_id, expenseAmount, expense_date, description, payment_method || 'cash', reference_number]
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
    getCollectionByConcept,
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};
