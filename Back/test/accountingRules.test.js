const test = require('node:test');
const assert = require('node:assert/strict');
const { money, calculateTender, validatePaymentMethod, assertUniqueIds } = require('../src/utils/accountingRules');

test('redondea dinero a centavos sin acumular fracciones', () => {
  assert.equal(money(0.1 + 0.2), 0.3);
  assert.equal(money('15.678'), 15.68);
});

test('calcula efectivo, cambio e ingreso neto', () => {
  assert.deepEqual(calculateTender(27.35, 30, 'cash'), {
    totalDue: 27.35,
    amountTendered: 30,
    changeAmount: 2.65,
    netReceived: 27.35
  });
});

test('rechaza efectivo insuficiente', () => {
  assert.throws(() => calculateTender(30, 29.99, 'cash'), /Monto insuficiente/);
});

test('un movimiento bancario requiere cuenta y uno en efectivo no la acepta', () => {
  assert.throws(() => validatePaymentMethod('transfer', null), /cuenta bancaria/);
  assert.throws(() => validatePaymentMethod('cash', 1), /efectivo/);
  assert.doesNotThrow(() => validatePaymentMethod('deposit', 1));
});

test('rechaza identificadores repetidos o inválidos', () => {
  assert.throws(() => assertUniqueIds([1, 1], 'ids'), /repetidos/);
  assert.throws(() => assertUniqueIds([0], 'ids'), /inválidos/);
  assert.deepEqual(assertUniqueIds([1, '2'], 'ids'), [1, 2]);
});
