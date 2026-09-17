const crypto = require('crypto');
const pool = require('../config/db');
const { readSchema } = require('../utils/databaseSchema');
const { money, validatePaymentMethod, calculateTender, assertUniqueIds } = require('../utils/accountingRules');
const { assertAccountingDateOpen, lockFinancialLedger } = require('../utils/periodLock');

const httpError = (message, status = 400) => Object.assign(new Error(message), { status });

const refreshCollectionStatus = async (connection, collectionId) => {
  if (!collectionId) return;
  const [activeRows] = await connection.query(
    `SELECT
       (SELECT COUNT(*) FROM payments WHERE collection_id=? AND status='posted') +
       (SELECT COUNT(*) FROM debt_payments WHERE collection_id=? AND status='posted') AS active_count,
       (SELECT COUNT(*) FROM payments WHERE collection_id=?) +
       (SELECT COUNT(*) FROM debt_payments WHERE collection_id=?) AS total_count`,
    [collectionId, collectionId, collectionId, collectionId]
  );
  const activeCount = Number(activeRows[0].active_count);
  const totalCount = Number(activeRows[0].total_count);
  const status = activeCount === 0 ? 'voided' : activeCount < totalCount ? 'partially_voided' : 'posted';
  await connection.query('UPDATE payment_collections SET status=? WHERE collection_id=?', [status, collectionId]);
};

const collectCombinedPayment = async ({
  invoiceIds = [], debtPayments = [], amountTendered, paymentMethod = 'cash',
  accountId = null, referenceNumber = null, systemUserId, idempotencyKey
}) => {
  const invoices = assertUniqueIds(invoiceIds, 'invoice_ids');
  if (!Array.isArray(debtPayments)) throw httpError('debt_payments debe ser un arreglo');
  const agreementIds = assertUniqueIds(debtPayments.map(item => item.agreement_id), 'agreement_ids');
  if (!invoices.length && !agreementIds.length) throw httpError('Debe seleccionar al menos una factura o convenio');
  validatePaymentMethod(paymentMethod, accountId);

  const normalizedDebtPayments = debtPayments.map(item => ({
    agreement_id: Number(item.agreement_id),
    amount: money(item.amount, 'Monto de abono')
  }));
  if (normalizedDebtPayments.some(item => item.amount <= 0)) throw httpError('Los abonos deben ser mayores que cero');

  const key = String(idempotencyKey || crypto.randomUUID()).slice(0, 100);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    const [existing] = await connection.query(
      'SELECT collection_id, total_due, amount_tendered, change_amount FROM payment_collections WHERE idempotency_key = ? FOR UPDATE',
      [key]
    );
    if (existing.length) {
      const [existingDebts] = await connection.query(
        `SELECT dp.debt_payment_id, dp.agreement_id, pa.remaining_amount AS remaining
         FROM debt_payments dp JOIN payment_agreements pa ON pa.agreement_id=dp.agreement_id
         WHERE dp.collection_id=? AND dp.status='posted' ORDER BY dp.debt_payment_id`,
        [existing[0].collection_id]
      );
      await connection.commit();
      return {
        collection_id: existing[0].collection_id,
        totalDue: money(existing[0].total_due),
        amountTendered: money(existing[0].amount_tendered),
        changeAmount: money(existing[0].change_amount),
        netReceived: money(existing[0].total_due),
        idempotent: true,
        debt_payment_ids: existingDebts.map(item => item.debt_payment_id),
        debt_payments: existingDebts
      };
    }

    if (paymentMethod !== 'cash') {
      const [accounts] = await connection.query(
        "SELECT account_id FROM bank_accounts WHERE account_id = ? AND status = 'active' FOR UPDATE", [Number(accountId)]
      );
      if (!accounts.length) throw httpError('Cuenta bancaria inexistente o inactiva');
    }

    let invoiceRows = [];
    if (invoices.length) {
      [invoiceRows] = await connection.query(
        `SELECT invoice_id, user_id, total_amount, status FROM invoices
         WHERE invoice_id IN (?) ORDER BY invoice_id FOR UPDATE`, [invoices]
      );
      if (invoiceRows.length !== invoices.length) throw httpError('Una o más facturas no existen');
      if (invoiceRows.some(row => row.status !== 'pending')) throw httpError('Todas las facturas deben estar pendientes');
      if (invoiceRows.some(row => money(row.total_amount) <= 0)) throw httpError('No se pueden cobrar facturas con valor cero o negativo');
    }

    let agreementRows = [];
    if (agreementIds.length) {
      [agreementRows] = await connection.query(
        `SELECT pa.agreement_id, pa.user_id, pa.remaining_amount, pa.status,
           pa.remaining_amount - COALESCE((
             SELECT SUM(COALESCE(ic.amount_snapshot, ac.amount))
             FROM invoice_concept ic
             JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
             JOIN invoices i ON i.invoice_id=ic.invoice_id
             WHERE ic.agreement_id=pa.agreement_id AND i.status='pending'
           ),0) AS available_direct_amount
         FROM payment_agreements pa
         WHERE pa.agreement_id IN (?) ORDER BY pa.agreement_id FOR UPDATE`, [agreementIds]
      );
      if (agreementRows.length !== agreementIds.length) throw httpError('Uno o más convenios no existen');
      if (agreementRows.some(row => row.status !== 'active')) throw httpError('Todos los convenios deben estar activos');
    }

    const userIds = new Set([...invoiceRows, ...agreementRows].map(row => Number(row.user_id)));
    if (userIds.size !== 1) throw httpError('Todos los documentos del cobro deben pertenecer al mismo usuario');

    let invoicedInstallments = [];
    if (invoices.length) {
      [invoicedInstallments] = await connection.query(
        `SELECT ic.agreement_id, SUM(COALESCE(ic.amount_snapshot, ac.amount)) AS amount
         FROM invoice_concept ic JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
         WHERE ic.invoice_id IN (?) AND ic.agreement_id IS NOT NULL GROUP BY ic.agreement_id`, [invoices]
      );
      if (invoicedInstallments.some(item => agreementIds.includes(Number(item.agreement_id)))) {
        throw httpError('Un convenio no puede cobrarse directamente y también como cuota dentro de la factura');
      }
      for (const installment of invoicedInstallments) {
        const [locked] = await connection.query(
          'SELECT agreement_id, user_id, remaining_amount, status FROM payment_agreements WHERE agreement_id=? FOR UPDATE',
          [installment.agreement_id]
        );
        if (!locked.length || Number(locked[0].user_id) !== [...userIds][0] || locked[0].status !== 'active' || money(installment.amount) > money(locked[0].remaining_amount)) {
          throw httpError(`La cuota facturada del convenio ${installment.agreement_id} no coincide con su saldo actual`);
        }
        installment.remaining_amount = money(locked[0].remaining_amount);
      }
    }
    for (const item of normalizedDebtPayments) {
      const agreement = agreementRows.find(row => Number(row.agreement_id) === item.agreement_id);
      if (!agreement || item.amount > money(agreement.available_direct_amount)) {
        throw httpError(`El abono del convenio ${item.agreement_id} supera el saldo libre; existen cuotas pendientes en facturas`);
      }
    }

    const invoiceTotal = invoiceRows.reduce((sum, row) => sum + money(row.total_amount), 0);
    const debtTotal = normalizedDebtPayments.reduce((sum, item) => sum + item.amount, 0);
    const tender = calculateTender(money(invoiceTotal + debtTotal), amountTendered, paymentMethod);
    const paymentDate = new Date();
    await assertAccountingDateOpen(connection, paymentDate);

    const [collectionResult] = await connection.query(
      `INSERT INTO payment_collections
       (user_id, system_user_id, payment_date, total_due, amount_tendered, change_amount,
        net_received, payment_method, account_id, reference_number, idempotency_key, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted')`,
      [[...userIds][0], systemUserId, paymentDate, tender.totalDue, tender.amountTendered,
        tender.changeAmount, tender.netReceived, paymentMethod,
        paymentMethod === 'cash' ? null : Number(accountId), referenceNumber || null, key]
    );
    const collectionId = collectionResult.insertId;

    for (const invoice of invoiceRows) {
      const invoiceAmount = money(invoice.total_amount);
      await connection.query(
        `INSERT INTO payments
         (collection_id, invoice_id, system_user_id, payment_date, invoice_amount, amount_paid,
          change_amount, movement_type, status, payment_method, account_id, reference_number)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'payment', 'posted', ?, ?, ?)`,
        [collectionId, invoice.invoice_id, systemUserId, paymentDate, invoiceAmount, invoiceAmount,
          paymentMethod, paymentMethod === 'cash' ? null : Number(accountId), referenceNumber || null]
      );
      await connection.query("UPDATE invoices SET status = 'paid' WHERE invoice_id = ?", [invoice.invoice_id]);
    }

    for (const installment of invoicedInstallments) {
      const remaining = money(installment.remaining_amount - money(installment.amount));
      await connection.query(
        'UPDATE payment_agreements SET remaining_amount=?, status=? WHERE agreement_id=?',
        [remaining, remaining === 0 ? 'completed' : 'active', installment.agreement_id]
      );
    }

    const debtPaymentIds = [];
    const debtPaymentResults = [];
    for (const item of normalizedDebtPayments) {
      const agreement = agreementRows.find(row => Number(row.agreement_id) === item.agreement_id);
      const remaining = money(money(agreement.remaining_amount) - item.amount);
      const [debtResult] = await connection.query(
        `INSERT INTO debt_payments
         (collection_id, agreement_id, system_user_id, amount_paid, status, payment_date,
          payment_method, account_id, reference_number)
         VALUES (?, ?, ?, ?, 'posted', ?, ?, ?, ?)`,
        [collectionId, item.agreement_id, systemUserId, item.amount, paymentDate, paymentMethod,
          paymentMethod === 'cash' ? null : Number(accountId), referenceNumber || null]
      );
      debtPaymentIds.push(debtResult.insertId);
      debtPaymentResults.push({ debt_payment_id: debtResult.insertId, agreement_id: item.agreement_id, remaining });
      await connection.query(
        'UPDATE payment_agreements SET remaining_amount = ?, status = ? WHERE agreement_id = ?',
        [remaining, remaining === 0 ? 'completed' : 'active', item.agreement_id]
      );
    }

    await connection.query(
      `INSERT INTO financial_audit_log
       (system_user_id, action, entity_type, entity_id, after_json)
       VALUES (?, 'COLLECTION_POSTED', 'payment_collection', ?, ?)`,
      [systemUserId, collectionId, JSON.stringify({ invoiceIds: invoices, debtPayments: normalizedDebtPayments, ...tender })]
    );
    await connection.commit();
    return { collection_id: collectionId, ...tender, debt_payment_ids: debtPaymentIds,
      debt_payments: debtPaymentResults, idempotency_key: key };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const collectPayments = (invoiceIds, amountPaid, _changeAmount, systemUserId, paymentMethod, accountId, referenceNumber, idempotencyKey) =>
  collectCombinedPayment({ invoiceIds, debtPayments: [], amountTendered: amountPaid, systemUserId,
    paymentMethod, accountId, referenceNumber, idempotencyKey });

const getPaymentReceiptData = async (invoiceIds) => {
  const ids = assertUniqueIds(invoiceIds, 'invoiceIds');
  if (!ids.length) throw httpError('Seleccione al menos una factura');
  const schema = await readSchema(pool);
  const hasCollection = schema.has('payments', 'collection_id') &&
    ['collection_id', 'amount_tendered', 'change_amount', 'total_due'].every(column => schema.has('payment_collections', column));
  const description = schema.has('invoice_concept', 'description_snapshot')
    ? 'COALESCE(ic.description_snapshot, ac.description)' : 'ac.description';
  const amount = schema.has('invoice_concept', 'amount_snapshot')
    ? 'COALESCE(ic.amount_snapshot, ac.amount)' : 'ac.amount';
  const [rows] = await pool.query(`
    SELECT i.invoice_id, i.billing_month, p.invoice_amount, p.payment_date,
      ${hasCollection ? 'COALESCE(pc.amount_tendered, p.amount_paid)' : 'p.amount_paid'} AS amount_paid,
      ${hasCollection ? 'COALESCE(pc.change_amount, p.change_amount)' : 'p.change_amount'} AS change_amount,
      ${hasCollection ? 'pc.collection_id, pc.total_due' : 'NULL AS collection_id, NULL'} AS collection_total, u.first_name, u.last_name, u.national_id,
      m.code AS meter_code, m.type AS meter_type, r.previous_reading, r.current_reading,
      r.consumption, r.amount AS reading_amount, ec.extra_concepts
    FROM invoices i
    JOIN payments p ON i.invoice_id = p.invoice_id ${schema.has('payments', 'status') ? "AND p.status = 'posted'" : ''}
    ${hasCollection ? 'LEFT JOIN payment_collections pc ON pc.collection_id = p.collection_id' : ''}
    JOIN users u ON i.user_id = u.user_id
    LEFT JOIN (
      SELECT ic.invoice_id,
        GROUP_CONCAT(CONCAT(${description}, ': $', ${amount}) SEPARATOR ' | ') AS extra_concepts
      FROM invoice_concept ic JOIN additional_concepts ac ON ic.concept_id = ac.concept_id
      GROUP BY ic.invoice_id
    ) ec ON i.invoice_id = ec.invoice_id
    LEFT JOIN readings r ON i.invoice_id = r.invoice_id
    LEFT JOIN meters m ON r.meter_id = m.meter_id
    WHERE i.invoice_id IN (?) ORDER BY i.billing_month ASC`, [ids]);
  return rows;
};

const voidPayment = async (invoiceId, systemUserId, reason) => {
  if (!reason || String(reason).trim().length < 5) throw httpError('Debe indicar un motivo de anulación');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    const [rows] = await connection.query(
      `SELECT p.*, i.status AS invoice_status FROM payments p JOIN invoices i ON i.invoice_id=p.invoice_id
       WHERE p.invoice_id=? AND p.status='posted' ORDER BY p.payment_id DESC LIMIT 1 FOR UPDATE`,
      [Number(invoiceId)]
    );
    if (!rows.length) throw httpError('No existe un pago activo para esta factura', 404);
    const payment = rows[0];
    await assertAccountingDateOpen(connection, payment.payment_date);
    await connection.query(
      "UPDATE payments SET status='voided', voided_at=NOW(), voided_by=?, void_reason=? WHERE payment_id=?",
      [systemUserId, String(reason).trim(), payment.payment_id]
    );

    const [installments] = await connection.query(
      `SELECT ic.agreement_id, SUM(COALESCE(ic.amount_snapshot, ac.amount)) AS amount
       FROM invoice_concept ic
       JOIN additional_concepts ac ON ac.concept_id=ic.concept_id
       WHERE ic.invoice_id=? AND ic.agreement_id IS NOT NULL
       GROUP BY ic.agreement_id`,
      [Number(invoiceId)]
    );
    for (const installment of installments) {
      const [agreements] = await connection.query(
        'SELECT remaining_amount FROM payment_agreements WHERE agreement_id=? FOR UPDATE',
        [installment.agreement_id]
      );
      if (!agreements.length) throw httpError(`No existe el convenio ${installment.agreement_id}`, 409);
      const restoredRemaining = money(money(agreements[0].remaining_amount) + money(installment.amount));
      await connection.query(
        "UPDATE payment_agreements SET remaining_amount=?, status='active' WHERE agreement_id=?",
        [restoredRemaining, installment.agreement_id]
      );
    }
    await connection.query("UPDATE invoices SET status='pending' WHERE invoice_id=?", [Number(invoiceId)]);
    await refreshCollectionStatus(connection, payment.collection_id);
    await connection.query(
      `INSERT INTO financial_audit_log
       (system_user_id, action, entity_type, entity_id, reason, before_json, after_json)
       VALUES (?, 'PAYMENT_VOIDED', 'payment', ?, ?, ?, ?)`,
      [systemUserId, payment.payment_id, String(reason).trim(), JSON.stringify(payment), JSON.stringify({ status: 'voided' })]
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const voidDebtPayment = async (debtPaymentId, systemUserId, reason) => {
  if (!reason || String(reason).trim().length < 5) throw httpError('Debe indicar un motivo de anulación');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await lockFinancialLedger(connection);
    const [rows] = await connection.query(
      `SELECT dp.*, pa.remaining_amount
       FROM debt_payments dp
       JOIN payment_agreements pa ON pa.agreement_id=dp.agreement_id
       WHERE dp.debt_payment_id=? AND dp.status='posted' FOR UPDATE`,
      [Number(debtPaymentId)]
    );
    if (!rows.length) throw httpError('No existe un abono activo con ese identificador', 404);
    const payment = rows[0];
    await assertAccountingDateOpen(connection, payment.payment_date);
    const restoredRemaining = money(money(payment.remaining_amount) + money(payment.amount_paid));

    await connection.query(
      `UPDATE debt_payments
       SET status='voided', voided_at=NOW(), voided_by=?, void_reason=?
       WHERE debt_payment_id=?`,
      [systemUserId, String(reason).trim(), payment.debt_payment_id]
    );
    await connection.query(
      "UPDATE payment_agreements SET remaining_amount=?, status='active' WHERE agreement_id=?",
      [restoredRemaining, payment.agreement_id]
    );
    await refreshCollectionStatus(connection, payment.collection_id);
    await connection.query(
      `INSERT INTO financial_audit_log
       (system_user_id, action, entity_type, entity_id, reason, before_json, after_json)
       VALUES (?, 'DEBT_PAYMENT_VOIDED', 'debt_payment', ?, ?, ?, ?)`,
      [systemUserId, payment.debt_payment_id, String(reason).trim(),
        JSON.stringify(payment), JSON.stringify({ status: 'voided', restored_remaining: restoredRemaining })]
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { collectPayments, collectCombinedPayment, getPaymentReceiptData, voidPayment, voidDebtPayment };
