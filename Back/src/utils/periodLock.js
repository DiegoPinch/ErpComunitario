const assertAccountingDateOpen = async (connection, dateValue) => {
  const [rows] = await connection.query(
    `SELECT period_id, title FROM accounting_periods
     WHERE DATE(?) BETWEEN DATE(start_date) AND DATE(end_date)
     LIMIT 1`,
    [dateValue]
  );
  if (rows.length) {
    const error = new Error(`La fecha pertenece al período contable cerrado: ${rows[0].title}`);
    error.status = 409;
    throw error;
  }
};

const lockFinancialLedger = async connection => {
  const [rows] = await connection.query(
    'SELECT lock_id FROM accounting_ledger_lock WHERE lock_id=1 FOR UPDATE'
  );
  if (!rows.length) {
    const error = new Error('Falta inicializar la migración contable (accounting_ledger_lock)');
    error.status = 409;
    throw error;
  }
};

module.exports = { assertAccountingDateOpen, lockFinancialLedger };
