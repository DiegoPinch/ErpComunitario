// Read metadata instead of assuming that a deployment migration has run.
const readSchema = async db => {
  const [rows] = await db.query(
    'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE()'
  );
  const columns = new Set(rows.map(row => `${row.TABLE_NAME}.${row.COLUMN_NAME}`));
  return { has: (table, column) => columns.has(`${table}.${column}`) };
};

const assertAccountingSchema = async db => {
  const schema = await readSchema(db);
  const required = {
    payment_collections: ['collection_id', 'idempotency_key', 'total_due', 'amount_tendered', 'change_amount', 'status'],
    financial_audit_log: ['audit_id', 'action', 'before_json', 'after_json'],
    accounting_ledger_lock: ['lock_id'],
    payments: ['collection_id', 'status', 'voided_at', 'voided_by', 'void_reason'],
    debt_payments: ['collection_id', 'status', 'voided_at', 'voided_by', 'void_reason'],
    expenses: ['status', 'voided_at', 'voided_by', 'void_reason'],
    other_incomes: ['status', 'voided_at', 'voided_by', 'void_reason'],
    invoice_concept: ['amount_snapshot', 'description_snapshot', 'concept_type_snapshot', 'agreement_id'],
    accounting_periods: ['previous_balance', 'snapshot_json', 'integrity_hash', 'closed_at']
  };
  const missing = Object.entries(required).flatMap(([table, columns]) =>
    columns.filter(column => !schema.has(table, column)).map(column => `${table}.${column}`));
  if (missing.length) throw new Error(`Migración contable pendiente. Consulte Back/ACCOUNTING_DEPLOYMENT.md. Faltan: ${missing.join(', ')}`);
  const [locks] = await db.query('SELECT lock_id FROM accounting_ledger_lock WHERE lock_id=1');
  if (!locks.length) throw new Error('Migración contable incompleta: falta la fila de accounting_ledger_lock');
};

module.exports = { readSchema, assertAccountingSchema };
