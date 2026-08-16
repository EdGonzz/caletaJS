import { test, describe } from 'node:test';
import assert from 'node:assert';
import { deleteTransaction, getBalanceDelta } from './transactionUtils.js';
import { storage } from './storage.js';

// Mock mínimo de localStorage para el runner de Node.js
if (typeof localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    clear: () => { store.clear(); },
  };
}


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
    test('no descuenta fees en sell (fees es USD, no la moneda)', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'sell', balance: 5, fees: 1 }),
        -5,
      );
    });

    test('no descuenta fees en transfer_out', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'transfer_out', balance: 5, fees: 0.5 }),
        -5,
      );
    });

    test('sell con balance 0: retorna 0', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'sell', balance: 0, fees: 0.25 }),
        0,
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

    test('sell con networkFee no afecta delta (campo distinto)', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'sell', balance: 3, networkFee: 0.001 }),
        -3,
      );
    });

    test('transfer_out con networkFee no afecta delta (fee ya está en transfer_in.balance)', () => {
      assert.strictEqual(
        getBalanceDelta({ type: 'transfer_out', balance: 1, networkFee: 0.001 }),
        -1,
      );
    });
  });
});

describe('deleteTransaction', () => {
  const HOLDINGS_KEY = 'caleta_user_holdings';

  // Helper para configurar el estado inicial de localStorage
  const setupHoldings = (holdings) => {
    storage.set(HOLDINGS_KEY, holdings);
  };

  const sampleHoldings = [
    {
      id: 'tx-1', coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc',
      logoUrl: '', balance: 1, price: 40000, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'buy',
      date: '2026-06-01T12:00', fees: 0, notes: '',
    },
    {
      id: 'tx-2', coinId: 'ethereum', name: 'Ethereum', symbol: 'eth',
      logoUrl: '', balance: 2, price: 3000, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'buy',
      date: '2026-06-02T12:00', fees: 0, notes: '',
    },
  ];

  const transferHoldings = [
    {
      id: 'tx-out', coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc',
      logoUrl: '', balance: 1, price: 40000, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'transfer_out',
      transferId: 'transfer-123', date: '2026-06-05T12:00',
      fees: 0, networkFee: 0, notes: '',
    },
    {
      id: 'tx-in', coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc',
      logoUrl: '', balance: 1, price: 40000, source: 'Ledger',
      sourceIcon: 'wallet', sourceImage: '', type: 'transfer_in',
      transferId: 'transfer-123', date: '2026-06-05T12:00',
      fees: 0, networkFee: 0, notes: 'Recibido desde Binance',
    },
    {
      id: 'tx-3', coinId: 'solana', name: 'Solana', symbol: 'sol',
      logoUrl: '', balance: 10, price: 100, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'buy',
      date: '2026-06-03T12:00', fees: 0, notes: '',
    },
  ];

  test('borrado individual: elimina la transacción y retorna true', () => {
    setupHoldings([...sampleHoldings]);
    const result = deleteTransaction('tx-1');
    assert.strictEqual(result, true);

    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 1);
    assert.strictEqual(after[0].id, 'tx-2');
  });

  test('borrado individual: conserva transacciones no relacionadas', () => {
    setupHoldings([...sampleHoldings]);
    deleteTransaction('tx-1');
    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 1);
    assert.strictEqual(after[0].coinId, 'ethereum');
  });

  test('cascada: elimina todas las entradas con el mismo transferId', () => {
    setupHoldings([...transferHoldings]);
    const result = deleteTransaction('tx-out');
    assert.strictEqual(result, true);

    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 1);
    assert.strictEqual(after[0].id, 'tx-3');
  });

  test('cascada: eliminar desde transfer_in también elimina transfer_out', () => {
    setupHoldings([...transferHoldings]);
    const result = deleteTransaction('tx-in');
    assert.strictEqual(result, true);

    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 1);
    assert.strictEqual(after[0].id, 'tx-3');
  });

  test('cascada: conserva transacciones no relacionadas en el mismo transfer', () => {
    setupHoldings([...transferHoldings]);
    deleteTransaction('tx-out');
    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 1);
    assert.strictEqual(after[0].coinId, 'solana');
  });

  test('ID no encontrado: retorna false', () => {
    setupHoldings([...sampleHoldings]);
    const result = deleteTransaction('no-existe');
    assert.strictEqual(result, false);

    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 2); // Nada se eliminó
  });

  test('ID no encontrado: no modifica localStorage', () => {
    setupHoldings([...transferHoldings]);
    const before = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    deleteTransaction('no-existe');
    const after = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    assert.strictEqual(after, before);
  });
});
