const pool = require('../config/db');

const getAllAgreements = async () => {
    const [rows] = await pool.query(`
        SELECT pa.*, u.first_name, u.last_name, u.national_id 
        FROM payment_agreements pa
        JOIN users u ON pa.user_id = u.user_id
        ORDER BY pa.created_at DESC
    `);
    return rows;
};

const getAgreementsByUserId = async (user_id) => {
    const [rows] = await pool.query('SELECT * FROM payment_agreements WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    return rows;
};

const createAgreement = async (agreementData) => {
    const { user_id, description, total_amount, number_of_installments, start_month } = agreementData;
    
    // Si envían cuotas, se calcula, si no, se deja NULL (pagos libres)
    const inst_amt = (number_of_installments && number_of_installments > 0) 
                     ? (total_amount / number_of_installments).toFixed(2) 
                     : null;
    
    const [result] = await pool.query(
        `INSERT INTO payment_agreements 
        (user_id, description, total_amount, number_of_installments, installment_amount, remaining_amount, start_month, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [user_id, description, total_amount, number_of_installments || null, inst_amt, total_amount, start_month || null]
    );
    return result.insertId;
};

const addDebtPayment = async (agreement_id, system_user_id, amount_paid, payment_method = 'cash', account_id = null, reference_number = null) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Registrar el pago
        await connection.query(
            "INSERT INTO debt_payments (agreement_id, system_user_id, amount_paid, payment_method, account_id, reference_number) VALUES (?, ?, ?, ?, ?, ?)",
            [agreement_id, system_user_id, amount_paid, payment_method, account_id, reference_number]
        );

        // Descontar del saldo
        const [rows] = await connection.query("SELECT remaining_amount FROM payment_agreements WHERE agreement_id = ?", [agreement_id]);
        if (rows.length === 0) throw new Error("Deuda no encontrada");

        const current_remaining = parseFloat(rows[0].remaining_amount);
        const new_remaining = current_remaining - parseFloat(amount_paid);

        const status = new_remaining <= 0 ? 'completed' : 'active';

        await connection.query(
            "UPDATE payment_agreements SET remaining_amount = ?, status = ? WHERE agreement_id = ?",
            [new_remaining < 0 ? 0 : new_remaining, status, agreement_id]
        );

        await connection.commit();
        // Return the inserted debt_payment_id as well
        const [lastInsert] = await connection.query("SELECT LAST_INSERT_ID() as id");
        return { success: true, new_remaining, debt_payment_id: lastInsert[0].id };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getDebtPaymentsByAgreementId = async (agreement_id) => {
    const [rows] = await pool.query(`
        SELECT dp.*, u.first_name, u.last_name 
        FROM debt_payments dp
        LEFT JOIN users u ON dp.system_user_id = u.user_id
        WHERE dp.agreement_id = ? 
        ORDER BY dp.payment_date DESC
    `, [agreement_id]);
    return rows;
};

const getDebtPaymentReceiptData = async (paymentId) => {
    const [rows] = await pool.query(`
        SELECT 
            dp.debt_payment_id,
            dp.amount_paid,
            dp.payment_date,
            pa.description,
            pa.total_amount,
            pa.remaining_amount,
            u.first_name,
            u.last_name,
            u.national_id
        FROM debt_payments dp
        JOIN payment_agreements pa ON dp.agreement_id = pa.agreement_id
        JOIN users u ON pa.user_id = u.user_id
        WHERE dp.debt_payment_id = ?
    `, [paymentId]);
    return rows[0];
};

const updateAgreementStatus = async (agreement_id, status) => {
    const [result] = await pool.query('UPDATE payment_agreements SET status = ? WHERE agreement_id = ?', [status, agreement_id]);
    return result.affectedRows;
};

// Se ejecuta cada vez que se genera la facturación de un mes
const processActiveAgreementsForMonth = async (billing_month) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Obtener todos los convenios activos que aplican para este mes o antes
        const [agreements] = await connection.query(
            "SELECT * FROM payment_agreements WHERE status = 'active' AND start_month <= ?",
            [billing_month]
        );

        let processed = 0;

        for (const agreement of agreements) {
            // Verificar si el usuario tiene una factura de agua generada para este billing_month
            const [invoices] = await connection.query(
                "SELECT invoice_id FROM invoices WHERE user_id = ? AND billing_month = ? AND invoice_type = 'water'",
                [agreement.user_id, billing_month]
            );

            if (invoices.length > 0) {
                const invoiceId = invoices[0].invoice_id;

                // Crear un concepto adicional tipo 'installment' si no existe ya para esta factura y convenio
                // Se necesita la tabla additional_concepts para insertar el cargo
                // Para simplificar, podríamos insertar directamente en invoice_concept
                // pero la arquitectura dice que pasa por additional_concepts
                
                const [conceptResult] = await connection.query(
                    `INSERT INTO additional_concepts (concept_type, description, amount, applies_to, application_month) 
                     VALUES ('installment', ?, ?, 'user', ?)`,
                    [`Cuota: ${agreement.description}`, agreement.installment_amount, billing_month]
                );
                
                const conceptId = conceptResult.insertId;

                await connection.query(
                    'INSERT INTO invoice_concept (invoice_id, concept_id) VALUES (?, ?)',
                    [invoiceId, conceptId]
                );

                // Sumar al total_amount de la factura
                await connection.query(
                    'UPDATE invoices SET total_amount = total_amount + ? WHERE invoice_id = ?',
                    [agreement.installment_amount, invoiceId]
                );

                // Reducir remaining_amount del convenio
                const newRemaining = agreement.remaining_amount - agreement.installment_amount;
                
                if (newRemaining <= 0) {
                    await connection.query(
                        "UPDATE payment_agreements SET remaining_amount = 0, status = 'completed' WHERE agreement_id = ?",
                        [agreement.agreement_id]
                    );
                } else {
                    await connection.query(
                        "UPDATE payment_agreements SET remaining_amount = ? WHERE agreement_id = ?",
                        [newRemaining, agreement.agreement_id]
                    );
                }
                
                processed++;
            }
        }

        await connection.commit();
        return processed;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllAgreements,
    getAgreementsByUserId,
    createAgreement,
    addDebtPayment,
    getDebtPaymentsByAgreementId,
    getDebtPaymentReceiptData,
    updateAgreementStatus,
    processActiveAgreementsForMonth
};
