const pool = require('../config/db');
const { money, validatePaymentMethod } = require('../utils/accountingRules');
const { assertAccountingDateOpen, lockFinancialLedger } = require('../utils/periodLock');

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
    const { user_id, description, total_amount, number_of_installments, start_month, system_user_id } = agreementData;
    const total = money(total_amount, 'Monto total del convenio');
    if (total <= 0) throw Object.assign(new Error('El monto del convenio debe ser mayor que cero'), { status: 400 });
    if (!String(description || '').trim()) throw Object.assign(new Error('La descripción es obligatoria'), { status: 400 });
    if (start_month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(String(start_month))) {
        throw Object.assign(new Error('El mes inicial debe tener formato YYYY-MM'), { status: 400 });
    }
    const installmentCount = number_of_installments ? Number(number_of_installments) : null;
    if (installmentCount !== null && (!Number.isInteger(installmentCount) || installmentCount <= 0)) {
        throw Object.assign(new Error('El número de cuotas debe ser un entero mayor que cero'), { status: 400 });
    }
    
    // Si envían cuotas, se calcula, si no, se deja NULL (pagos libres)
    const inst_amt = installmentCount
                     ? money(total / installmentCount)
                     : null;
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [result] = await connection.query(
            `INSERT INTO payment_agreements
            (user_id, description, total_amount, number_of_installments, installment_amount, remaining_amount, start_month, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [user_id, String(description).trim(), total, installmentCount, inst_amt, total, start_month || null]
        );
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, after_json)
             VALUES (?, 'PAYMENT_AGREEMENT_CREATED', 'payment_agreement', ?, ?)`,
            [system_user_id, result.insertId, JSON.stringify({ user_id, description: String(description).trim(), total_amount: total,
                number_of_installments: installmentCount, installment_amount: inst_amt, start_month: start_month || null })]
        );
        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const addDebtPayment = async (agreement_id, system_user_id, amount_paid, payment_method = 'cash', account_id = null, reference_number = null) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);

        validatePaymentMethod(payment_method, account_id);
        const paidAmount = money(amount_paid, 'Monto del abono');
        if (paidAmount <= 0) throw Object.assign(new Error('El abono debe ser mayor que cero'), { status: 400 });
        await assertAccountingDateOpen(connection, new Date());

        const [rows] = await connection.query(
            "SELECT remaining_amount, status FROM payment_agreements WHERE agreement_id = ? FOR UPDATE", [agreement_id]
        );
        if (rows.length === 0) throw new Error("Deuda no encontrada");
        if (rows[0].status !== 'active') throw Object.assign(new Error('El convenio no está activo'), { status: 409 });

        const current_remaining = parseFloat(rows[0].remaining_amount);
        if (paidAmount > current_remaining) {
            throw Object.assign(new Error(`El abono supera el saldo pendiente de $${current_remaining.toFixed(2)}`), { status: 400 });
        }
        const new_remaining = money(current_remaining - paidAmount);

        const [paymentResult] = await connection.query(
            `INSERT INTO debt_payments
             (agreement_id, system_user_id, amount_paid, status, payment_method, account_id, reference_number)
             VALUES (?, ?, ?, 'posted', ?, ?, ?)`,
            [agreement_id, system_user_id, paidAmount, payment_method, payment_method === 'cash' ? null : account_id, reference_number]
        );

        const status = new_remaining <= 0 ? 'completed' : 'active';

        await connection.query(
            "UPDATE payment_agreements SET remaining_amount = ?, status = ? WHERE agreement_id = ?",
            [new_remaining < 0 ? 0 : new_remaining, status, agreement_id]
        );

        await connection.commit();
        return { success: true, new_remaining, debt_payment_id: paymentResult.insertId };
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
        LEFT JOIN system_users su ON dp.system_user_id = su.system_user_id
        LEFT JOIN users u ON su.user_id = u.user_id
        WHERE dp.agreement_id = ? AND dp.status = 'posted'
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
        WHERE dp.debt_payment_id = ? AND dp.status = 'posted'
    `, [paymentId]);
    return rows[0];
};

const updateAgreementStatus = async (agreement_id, status, systemUserId, reason) => {
    if (!['active', 'cancelled'].includes(status)) {
        throw Object.assign(new Error('El estado solicitado no es válido'), { status: 400 });
    }
    if (!reason || String(reason).trim().length < 5) {
        throw Object.assign(new Error('Debe indicar un motivo de al menos 5 caracteres'), { status: 400 });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);
        const [rows] = await connection.query('SELECT * FROM payment_agreements WHERE agreement_id=? FOR UPDATE', [agreement_id]);
        if (!rows.length) {
            await connection.commit();
            return 0;
        }
        const agreement = rows[0];
        if (status === 'cancelled') {
            const [uses] = await connection.query(`
                SELECT
                  (SELECT COUNT(*) FROM debt_payments WHERE agreement_id=? AND status='posted') +
                  (SELECT COUNT(*) FROM invoice_concept WHERE agreement_id=?) AS usage_count`,
                [agreement_id, agreement_id]
            );
            if (Number(uses[0].usage_count) > 0) {
                throw Object.assign(new Error('No se puede cancelar un convenio con pagos o cuotas facturadas; anule primero esos movimientos'), { status: 409 });
            }
        }
        const [result] = await connection.query('UPDATE payment_agreements SET status=? WHERE agreement_id=?', [status, agreement_id]);
        await connection.query(
            `INSERT INTO financial_audit_log
             (system_user_id, action, entity_type, entity_id, reason, before_json, after_json)
             VALUES (?, 'PAYMENT_AGREEMENT_STATUS_CHANGED', 'payment_agreement', ?, ?, ?, ?)`,
            [systemUserId, agreement_id, String(reason).trim(), JSON.stringify(agreement), JSON.stringify({ status })]
        );
        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Se ejecuta cada vez que se genera la facturación de un mes
const processActiveAgreementsForMonth = async (billing_month) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(billing_month || ''))) {
        throw Object.assign(new Error('El mes de facturación debe tener formato YYYY-MM'), { status: 400 });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await lockFinancialLedger(connection);

        // Obtener todos los convenios activos que aplican para este mes o antes
        const [agreements] = await connection.query(
            "SELECT * FROM payment_agreements WHERE status = 'active' AND start_month <= ? FOR UPDATE",
            [billing_month]
        );

        let processed = 0;

        for (const agreement of agreements) {
            if (!agreement.installment_amount || Number(agreement.installment_amount) <= 0) continue;
            const [reservedRows] = await connection.query(
                `SELECT COALESCE(SUM(COALESCE(ic.amount_snapshot, ac.amount)),0) AS reserved_amount
                 FROM invoice_concept ic
                 JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
                 JOIN invoices i ON i.invoice_id=ic.invoice_id
                 WHERE ic.agreement_id=? AND i.status='pending'`,
                [agreement.agreement_id]
            );
            const availableAmount = money(Number(agreement.remaining_amount) - Number(reservedRows[0].reserved_amount));
            if (availableAmount <= 0) continue;
            // Verificar si el usuario tiene una factura de agua generada para este billing_month
            const [invoices] = await connection.query(
                "SELECT invoice_id FROM invoices WHERE user_id = ? AND billing_month = ? AND invoice_type = 'water' AND status='pending' FOR UPDATE",
                [agreement.user_id, billing_month]
            );

            if (invoices.length > 0) {
                const invoiceId = invoices[0].invoice_id;

                const [alreadyProcessed] = await connection.query(
                    'SELECT id FROM invoice_concept WHERE invoice_id = ? AND agreement_id = ? LIMIT 1',
                    [invoiceId, agreement.agreement_id]
                );
                if (alreadyProcessed.length) continue;

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

                const installmentAmount = money(Math.min(Number(agreement.installment_amount), availableAmount));
                await connection.query(
                    `UPDATE additional_concepts SET amount = ? WHERE concept_id = ?`,
                    [installmentAmount, conceptId]
                );
                await connection.query(
                    `INSERT INTO invoice_concept
                     (invoice_id, concept_id, description_snapshot, amount_snapshot, concept_type_snapshot, agreement_id)
                     VALUES (?, ?, ?, ?, 'installment', ?)`,
                    [invoiceId, conceptId, `Cuota: ${agreement.description}`, installmentAmount, agreement.agreement_id]
                );

                // Sumar al total_amount de la factura
                await connection.query(
                    'UPDATE invoices SET total_amount = total_amount + ? WHERE invoice_id = ?',
                    [installmentAmount, invoiceId]
                );
                
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
