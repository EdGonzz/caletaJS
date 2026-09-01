import { test, describe } from 'node:test';
import assert from 'node:assert';
import { deleteTransaction, getBalanceDelta, getAvailableBalanceExcluding, getAvailableBalanceExcludingTransfer, updateTransaction, stripTransferNotesPrefix } from './transactionUtils.js';
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

  test('cascada: escribe una sola vez (batch atómico)', () => {
    setupHoldings([...transferHoldings]);
    let writeCount = 0;
    const originalSet = storage.set;
    storage.set = (...args) => { writeCount++; originalSet(...args); };

    deleteTransaction('tx-out');

    assert.strictEqual(writeCount, 1, 'storage.set debe llamarse exactamente 1 vez');
    storage.set = originalSet;
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

describe('getAvailableBalanceExcluding', () => {
  const HOLDINGS_KEY = 'caleta_user_holdings';

  const setupHoldings = (holdings) => {
    storage.set(HOLDINGS_KEY, holdings);
  };

  test('buy: retorna balance excluyendo la compra actual', () => {
    setupHoldings([
      { id: 'b1', coinId: 'bitcoin', source: 'Binance', type: 'buy', balance: 5 },
      { id: 'b2', coinId: 'bitcoin', source: 'Binance', type: 'buy', balance: 3 },
    ]);
    const tx = { id: 'b1', coinId: 'bitcoin', source: 'Binance', type: 'buy', balance: 5 };
    // Total net balance = 8. Excluyendo b1 (delta +5) -> 8 - 5 = 3
    assert.strictEqual(getAvailableBalanceExcluding(tx), 3);
  });

  test('sell: retorna balance disponible antes de la venta (base de oversell)', () => {
    setupHoldings([
      { id: 'b1', coinId: 'bitcoin', source: 'Binance', type: 'buy', balance: 5 },
      { id: 's1', coinId: 'bitcoin', source: 'Binance', type: 'sell', balance: 2 },
    ]);
    const tx = { id: 's1', coinId: 'bitcoin', source: 'Binance', type: 'sell', balance: 2 };
    // Total net balance = 3. Excluyendo s1 (delta -2) -> 3 - (-2) = 5
    assert.strictEqual(getAvailableBalanceExcluding(tx), 5);
  });

  test('transfer_out: retorna balance disponible en origen antes de transferir', () => {
    setupHoldings([
      { id: 'b1', coinId: 'bitcoin', source: 'Binance', type: 'buy', balance: 5 },
      { id: 't1', coinId: 'bitcoin', source: 'Binance', type: 'transfer_out', balance: 2 },
    ]);
    const tx = { id: 't1', coinId: 'bitcoin', source: 'Binance', type: 'transfer_out', balance: 2 };
    // Total net balance = 3. Excluyendo t1 (delta -2) -> 3 - (-2) = 5
    assert.strictEqual(getAvailableBalanceExcluding(tx), 5);
  });

  test('tx nulo o sin datos obligatorios: retorna 0', () => {
    assert.strictEqual(getAvailableBalanceExcluding(null), 0);
    assert.strictEqual(getAvailableBalanceExcluding({}), 0);
  });
});

describe('getAvailableBalanceExcludingTransfer', () => {
  const HOLDINGS_KEY = 'caleta_user_holdings';

  const setupHoldings = (holdings) => {
    storage.set(HOLDINGS_KEY, holdings);
  };

  test('transfer con pierna en el source: excluye la pierna del par (available = 0)', () => {
    setupHoldings([
      { id: 'out', coinId: 'bitcoin', source: 'Binance', type: 'transfer_out', balance: 0.5, transferId: 'T1' },
      { id: 'in', coinId: 'bitcoin', source: 'Coinbase', type: 'transfer_in', balance: 0.5, transferId: 'T1' },
    ]);
    // Coinbase solo contiene la pierna transfer_in (0.5). Al excluirla, available = 0.
    assert.strictEqual(getAvailableBalanceExcludingTransfer('bitcoin', 'Coinbase', 'T1'), 0);
  });

  test('transfer con pierna en el source: excluye solo la pierna, conserva otros holdings', () => {
    setupHoldings([
      { id: 'out', coinId: 'bitcoin', source: 'Binance', type: 'transfer_out', balance: 0.5, transferId: 'T1' },
      { id: 'in', coinId: 'bitcoin', source: 'Coinbase', type: 'transfer_in', balance: 0.5, transferId: 'T1' },
      { id: 'b1', coinId: 'bitcoin', source: 'Coinbase', type: 'buy', balance: 1 },
    ]);
    // Net balance Coinbase = 1.5. Excluyendo la pierna (0.5) -> 1.
    assert.strictEqual(getAvailableBalanceExcludingTransfer('bitcoin', 'Coinbase', 'T1'), 1);
  });

  test('source sin piernas del par: available = getNetBalance normal', () => {
    setupHoldings([
      { id: 'out', coinId: 'bitcoin', source: 'Binance', type: 'transfer_out', balance: 0.5, transferId: 'T1' },
      { id: 'in', coinId: 'bitcoin', source: 'Coinbase', type: 'transfer_in', balance: 0.5, transferId: 'T1' },
      { id: 'b1', coinId: 'bitcoin', source: 'Kraken', type: 'buy', balance: 2 },
    ]);
    assert.strictEqual(getAvailableBalanceExcludingTransfer('bitcoin', 'Kraken', 'T1'), 2);
  });

  test('no afecta otras monedas ni otras transferencias', () => {
    setupHoldings([
      { id: 'out', coinId: 'bitcoin', source: 'Binance', type: 'transfer_out', balance: 0.5, transferId: 'T1' },
      { id: 'in', coinId: 'bitcoin', source: 'Coinbase', type: 'transfer_in', balance: 0.5, transferId: 'T1' },
      { id: 'out2', coinId: 'ethereum', source: 'Coinbase', type: 'transfer_out', balance: 3, transferId: 'T2' },
      { id: 'in2', coinId: 'ethereum', source: 'Ledger', type: 'transfer_in', balance: 3, transferId: 'T2' },
    ]);
    // El filtro es por coinId + transferId + source: T1 es de bitcoin, no afecta ethereum.
    assert.strictEqual(getAvailableBalanceExcludingTransfer('ethereum', 'Ledger', 'T1'), 3);
    // T2 sí tiene la pierna transfer_in de ethereum en Ledger (3): excluida -> 0.
    assert.strictEqual(getAvailableBalanceExcludingTransfer('ethereum', 'Ledger', 'T2'), 0);
    // La pierna transfer_out de T2 está en Coinbase (ethereum): excluida -> 0.
    assert.strictEqual(getAvailableBalanceExcludingTransfer('ethereum', 'Coinbase', 'T2'), 0);
  });
});

describe('stripTransferNotesPrefix', () => {
  test('elimina formato entre corchetes [Recibido desde X]', () => {
    assert.strictEqual(stripTransferNotesPrefix('[Recibido desde Binance] Mi nota'), 'Mi nota');
    assert.strictEqual(stripTransferNotesPrefix('[Recibido desde Kraken]'), '');
  });

  test('elimina formato simple Recibido desde X', () => {
    assert.strictEqual(stripTransferNotesPrefix('Recibido desde Binance'), '');
    assert.strictEqual(stripTransferNotesPrefix('Recibido desde Binance - Mi nota'), 'Mi nota');
    assert.strictEqual(stripTransferNotesPrefix('Recibido desde Binance: Mi nota'), 'Mi nota');
  });

  test('elimina múltiples prefijos apilados', () => {
    assert.strictEqual(
      stripTransferNotesPrefix('[Recibido desde Kraken] [Recibido desde Binance] Mi nota'),
      'Mi nota'
    );
  });

  test('conserva notas normales sin prefijo', () => {
    assert.strictEqual(stripTransferNotesPrefix('Transferencia personal'), 'Transferencia personal');
    assert.strictEqual(stripTransferNotesPrefix(''), '');
  });
});

describe('updateTransaction', () => {
  const HOLDINGS_KEY = 'caleta_user_holdings';

  const setupHoldings = (holdings) => {
    storage.set(HOLDINGS_KEY, holdings);
  };

  const sampleHoldings = [
    {
      id: 'tx-1', coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc',
      logoUrl: '', balance: 1, price: 40000, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'buy',
      date: '2026-06-01T12:00', fees: 0, notes: 'Nota inicial',
    },
    {
      id: 'tx-2', coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc',
      logoUrl: '', balance: 0.5, price: 45000, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'sell',
      date: '2026-06-02T12:00', fees: 0, notes: '',
    },
  ];

  const transferHoldings = [
    {
      id: 'tx-out', coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc',
      logoUrl: '', balance: 1, price: 40000, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'transfer_out',
      transferId: 'transfer-123', date: '2026-06-05T12:00',
      fees: 0, networkFee: 0.001, notes: '',
    },
    {
      id: 'tx-in', coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc',
      logoUrl: '', balance: 0.999, price: 40000, source: 'Ledger',
      sourceIcon: 'wallet', sourceImage: '', type: 'transfer_in',
      transferId: 'transfer-123', date: '2026-06-05T12:00',
      fees: 0, networkFee: 0.001, notes: 'Recibido desde Binance',
    },
    {
      id: 'tx-other', coinId: 'ethereum', name: 'Ethereum', symbol: 'eth',
      logoUrl: '', balance: 2, price: 3000, source: 'Binance',
      sourceIcon: 'wallet', sourceImage: '', type: 'buy',
      date: '2026-06-03T12:00', fees: 0, notes: '',
    },
  ];

  test('update de buy/sell (registro único): actualiza campos y añade updatedAt', () => {
    setupHoldings([...sampleHoldings]);
    const result = updateTransaction('tx-1', {
      balance: 2.5,
      price: 42000,
      notes: 'Nota editada',
      date: '2026-06-10T15:00',
    });

    assert.strictEqual(result, true);
    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 2);
    assert.strictEqual(after[0].balance, 2.5);
    assert.strictEqual(after[0].price, 42000);
    assert.strictEqual(after[0].notes, 'Nota editada');
    assert.strictEqual(after[0].date, '2026-06-10T15:00');
    assert.ok(after[0].updatedAt);
    assert.strictEqual(after[1].balance, 0.5); // tx-2 sin tocar
  });

  test('update de buy/sell: mapea campo qty a balance si es provisto', () => {
    setupHoldings([...sampleHoldings]);
    const result = updateTransaction('tx-2', { qty: 0.8 });
    assert.strictEqual(result, true);
    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after[1].balance, 0.8);
  });

  test('update de transfer atómico: recalcula ambas piernas (transfer_in = qty - networkFee)', () => {
    setupHoldings([...transferHoldings]);
    const result = updateTransaction('tx-out', {
      qty: 2,
      networkFee: 0.005,
      price: 41000,
      date: '2026-06-08T18:00',
      source: 'Kraken',
      destSource: 'Trezor',
      notes: 'Transferencia actualizada',
    });

    assert.strictEqual(result, true);
    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    assert.strictEqual(after.length, 3);

    const outTx = after.find(h => h.id === 'tx-out');
    const inTx = after.find(h => h.id === 'tx-in');
    const otherTx = after.find(h => h.id === 'tx-other');

    // Pierna salida (transfer_out)
    assert.strictEqual(outTx.balance, 2);
    assert.strictEqual(outTx.source, 'Kraken');
    assert.strictEqual(outTx.price, 41000);
    assert.strictEqual(outTx.networkFee, 0.005);
    assert.strictEqual(outTx.date, '2026-06-08T18:00');
    assert.strictEqual(outTx.notes, 'Transferencia actualizada');
    assert.ok(outTx.updatedAt);

    // Pierna entrada (transfer_in)
    assert.strictEqual(inTx.balance, 1.995); // 2 - 0.005
    assert.strictEqual(inTx.source, 'Trezor');
    assert.strictEqual(inTx.price, 41000); // cost basis compartido
    assert.strictEqual(inTx.networkFee, 0.005);
    assert.strictEqual(inTx.date, '2026-06-08T18:00');
    assert.strictEqual(inTx.notes, '[Recibido desde Kraken] Transferencia actualizada');
    assert.ok(inTx.updatedAt);

    // Registro no relacionado permanece intacto
    assert.strictEqual(otherTx.id, 'tx-other');
    assert.strictEqual(otherTx.balance, 2);
  });

  test('update de transfer invocado desde tx-in actualiza ambas piernas', () => {
    setupHoldings([...transferHoldings]);
    const result = updateTransaction('tx-in', {
      qty: 1.5,
      networkFee: 0.002,
      source: 'Coinbase',
      destSource: 'Ledger',
    });

    assert.strictEqual(result, true);
    const after = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    const outTx = after.find(h => h.id === 'tx-out');
    const inTx = after.find(h => h.id === 'tx-in');

    assert.strictEqual(outTx.balance, 1.5);
    assert.strictEqual(outTx.source, 'Coinbase');
    assert.strictEqual(inTx.balance, 1.498);
    assert.strictEqual(inTx.source, 'Ledger');
  });

  test('batch atómico: una sola escritura a storage', () => {
    setupHoldings([...transferHoldings]);
    let writeCount = 0;
    const originalSet = storage.set;
    storage.set = (...args) => {
      writeCount++;
      originalSet(...args);
    };

    updateTransaction('tx-out', { qty: 3, networkFee: 0.01 });

    assert.strictEqual(writeCount, 1, 'storage.set debe llamarse exactamente 1 vez');
    storage.set = originalSet;
  });

  test('tx inexistente: retorna false y no modifica storage', () => {
    setupHoldings([...transferHoldings]);
    const before = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    const result = updateTransaction('id-inexistente', { balance: 10 });

    assert.strictEqual(result, false);
    const after = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    assert.strictEqual(after, before);
  });

  test('regeneración de notas: hace strip del prefijo existente para evitar apilado', () => {
    // Caso con prefijo previo 'Recibido desde Binance' sin notas de usuario adicionales
    setupHoldings([...transferHoldings]);
    updateTransaction('tx-out', {
      source: 'Kraken',
      destSource: 'Binance',
    });

    const after1 = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    const inTx1 = after1.find(h => h.id === 'tx-in');
    assert.strictEqual(inTx1.notes, 'Recibido desde Kraken');

    // Segunda edición cambiando fuente a Coinbase
    updateTransaction('tx-out', {
      source: 'Coinbase',
    });

    const after2 = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    const inTx2 = after2.find(h => h.id === 'tx-in');
    assert.strictEqual(inTx2.notes, 'Recibido desde Coinbase');

    // Edición con nota personalizada
    updateTransaction('tx-out', {
      source: 'Kraken',
      notes: '[Recibido desde Coinbase] Pago préstamo',
    });

    const after3 = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    const inTx3 = after3.find(h => h.id === 'tx-in');
    const outTx3 = after3.find(h => h.id === 'tx-out');
    assert.strictEqual(outTx3.notes, 'Pago préstamo');
    assert.strictEqual(inTx3.notes, '[Recibido desde Kraken] Pago préstamo');
  });

  test('validación defensiva: qty NaN o <= 0 retorna false y no modifica storage', () => {
    setupHoldings([...sampleHoldings]);
    const before = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));

    assert.strictEqual(updateTransaction('tx-1', { qty: NaN }), false);
    assert.strictEqual(updateTransaction('tx-1', { balance: NaN }), false);
    assert.strictEqual(updateTransaction('tx-1', { qty: 0 }), false);
    assert.strictEqual(updateTransaction('tx-1', { balance: -2 }), false);
    assert.strictEqual(updateTransaction('tx-1', { qty: -0.5 }), false);

    const afterSingle = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    assert.strictEqual(afterSingle, before);

    // Transfer con qty inválida
    setupHoldings([...transferHoldings]);
    const beforeTransfer = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    assert.strictEqual(updateTransaction('tx-out', { qty: NaN }), false);
    assert.strictEqual(updateTransaction('tx-out', { qty: 0 }), false);
    assert.strictEqual(updateTransaction('tx-out', { qty: -1 }), false);

    const afterTransfer = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    assert.strictEqual(afterTransfer, beforeTransfer);
  });

  test('validación defensiva de transfer: networkFee >= qty o negativo retorna false y no modifica storage', () => {
    setupHoldings([...transferHoldings]);
    const before = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));

    // networkFee igual a qty
    assert.strictEqual(updateTransaction('tx-out', { qty: 1, networkFee: 1 }), false);
    // networkFee mayor que qty
    assert.strictEqual(updateTransaction('tx-out', { qty: 1, networkFee: 1.5 }), false);
    // networkFee negativo
    assert.strictEqual(updateTransaction('tx-out', { qty: 1, networkFee: -0.01 }), false);
    // networkFee NaN
    assert.strictEqual(updateTransaction('tx-out', { qty: 1, networkFee: NaN }), false);

    const after = JSON.stringify(JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]'));
    assert.strictEqual(after, before);
  });

  test('updateTransaction individual no deja campo qty espurio (solo balance)', () => {
    setupHoldings([...sampleHoldings]);

    // Caso 1: solo qty provisto
    updateTransaction('tx-1', { qty: 3.5 });
    let stored = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    let tx1 = stored.find(h => h.id === 'tx-1');
    assert.strictEqual(tx1.balance, 3.5);
    assert.strictEqual('qty' in tx1, false);

    // Caso 2: qty Y balance provistos juntos
    updateTransaction('tx-1', { qty: 4, balance: 4.5 });
    stored = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || '[]');
    tx1 = stored.find(h => h.id === 'tx-1');
    assert.strictEqual(tx1.balance, 4.5);
    assert.strictEqual('qty' in tx1, false);
  });
});


