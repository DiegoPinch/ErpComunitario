const test = require('node:test');
const assert = require('node:assert/strict');
const { assertAccountingSchema } = require('../src/utils/databaseSchema');

test('detecta migración ausente antes de aceptar operaciones', async () => {
  const db = { query: async () => [[]] };
  await assert.rejects(assertAccountingSchema(db), /Migración contable pendiente.*payment_collections/);
});

test('ticket funciona con esquema antiguo y conserva filtro de anulados al migrar', async () => {
  const pool = require('../src/config/db');
  const original = pool.query;
  const model = require('../src/models/paymentsModel');
  try {
    for (const migrated of [false, true]) {
      pool.query = async sql => {
        if (sql.includes('information_schema.columns')) return [migrated ? [
          ...['collection_id', 'status'].map(COLUMN_NAME => ({ TABLE_NAME: 'payments', COLUMN_NAME })),
          ...['collection_id', 'amount_tendered', 'change_amount', 'total_due'].map(COLUMN_NAME => ({ TABLE_NAME: 'payment_collections', COLUMN_NAME })),
          ...['amount_snapshot', 'description_snapshot'].map(COLUMN_NAME => ({ TABLE_NAME: 'invoice_concept', COLUMN_NAME }))
        ] : []];
        assert.equal(sql.includes('LEFT JOIN payment_collections'), migrated);
        assert.equal(sql.includes("p.status = 'posted'"), migrated);
        assert.equal(sql.includes('ic.amount_snapshot'), migrated);
        return [[{ invoice_id: 512 }]];
      };
      assert.equal((await model.getPaymentReceiptData([512]))[0].invoice_id, 512);
    }
  } finally { pool.query = original; await pool.end(); }
});
