import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getBalanceDelta } from './transactionUtils.js';


describe('getBalanceDelta', () => {
  test('buy: retorna balance positivo', () => {
    assert.strictEqual(getBalanceDelta({ type: 'buy', balance: 10 }), 10);
  });

  test('transfer_in: retorna balance positivo', () => {
    assert.strictEqual(getBalanceDelta({ type: 'transfer_in', balance: 3.5 }), 3.5);
  });

  test('sell: retorna balance negativo', () => {
    assert.strictEqual(getBalanceDelta({ type: 'sell', balance: 5 }), -5);
  });

  test('transfer_out: retorna balance negativo', () => {
    assert.strictEqual(getBalanceDelta({ type: 'transfer_out', balance: 2 }), -2);
  });

  test('tipo desconocido: retorna 0', () => {
    assert.strictEqual(getBalanceDelta({ type: 'stake', balance: 100 }), 0);
  });

  test('balance undefined: retorna 0', () => {
    assert.strictEqual(getBalanceDelta({ type: 'buy' }), 0);
  });

  describe('con fees', () => {
    test('resta fees en sell', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'sell', balance: 5, fees: 1 }),
        -6,
      );
    });

    test('resta fees en transfer_out', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'transfer_out', balance: 5, fees: 0.5 }),
        -5.5,
      );
    });

    test('resta fees en sell con balance 0', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'sell', balance: 0, fees: 0.25 }),
        -0.25,
      );
    });

    test('no descuenta fees en buy', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'buy', balance: 10, fees: 1 }),
        10,
      );
    });

    test('no descuenta fees en transfer_in', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'transfer_in', balance: 3, fees: 0.1 }),
        3,
      );
    });

    test('fees undefined en sell: no resta', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'sell', balance: 5 }),
        -5,
      );
    });

    test('fees 0 en sell: no afecta', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'sell', balance: 5, fees: 0 }),
        -5,
      );
    });
  });
});
