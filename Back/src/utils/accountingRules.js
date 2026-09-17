const MONEY_TOLERANCE = 0.005;
const ALLOWED_PAYMENT_METHODS = new Set(['cash', 'transfer', 'deposit', 'card']);

const money = (value, fieldName = 'monto') => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    const error = new Error(`${fieldName} inválido`);
    error.status = 400;
    throw error;
  }
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
};

const validatePaymentMethod = (method, accountId) => {
  if (!ALLOWED_PAYMENT_METHODS.has(method)) {
    const error = new Error('Método de pago inválido');
    error.status = 400;
    throw error;
  }
  if (method !== 'cash' && (accountId === null || accountId === undefined || accountId === '' ||
      !Number.isInteger(Number(accountId)) || Number(accountId) <= 0)) {
    const error = new Error('Los pagos no realizados en efectivo requieren una cuenta bancaria');
    error.status = 400;
    throw error;
  }
  if (method === 'cash' && accountId !== null && accountId !== undefined && accountId !== '') {
    const error = new Error('Un cobro en efectivo no debe indicar una cuenta bancaria');
    error.status = 400;
    throw error;
  }
};

const calculateTender = (totalDue, amountTendered, method) => {
  const due = money(totalDue, 'Total a pagar');
  if (due <= 0) {
    const error = new Error('El total a pagar debe ser mayor que cero');
    error.status = 400;
    throw error;
  }
  const tendered = method === 'cash' ? money(amountTendered, 'Monto recibido') : due;
  if (tendered + MONEY_TOLERANCE < due) {
    const error = new Error(`Monto insuficiente. Total calculado: $${due.toFixed(2)}`);
    error.status = 400;
    throw error;
  }
  return { totalDue: due, amountTendered: tendered, changeAmount: money(tendered - due), netReceived: due };
};

const assertUniqueIds = (ids, fieldName) => {
  if (!Array.isArray(ids)) {
    const error = new Error(`${fieldName} debe ser un arreglo`);
    error.status = 400;
    throw error;
  }
  const normalized = ids.map(Number);
  if (normalized.some(id => !Number.isInteger(id) || id <= 0) || new Set(normalized).size !== normalized.length) {
    const error = new Error(`${fieldName} contiene identificadores inválidos o repetidos`);
    error.status = 400;
    throw error;
  }
  return normalized;
};

module.exports = { money, validatePaymentMethod, calculateTender, assertUniqueIds };
