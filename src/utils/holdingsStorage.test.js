import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { addHolding, getHoldings, updateHolding, removeHolding } from './holdingsStorage.js';

describe('holdingsStorage', () => {
  let mockStorage = new Map();

  beforeEach(() => {
    mockStorage = new Map();
    // Mock localStorage
    globalThis.localStorage = {
      getItem: (key) => mockStorage.get(key) || null,
      setItem: (key, value) => mockStorage.set(key, value),
      removeItem: (key) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    };
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  describe('getHoldings()', () => {
    test('should return an empty array if no holdings are stored', () => {
      const holdings = getHoldings();
      assert.deepStrictEqual(holdings, []);
    });

    test('should return stored holdings', () => {
      const data = [{ id: '1', symbol: 'BTC' }];
      mockStorage.set('caleta_user_holdings', JSON.stringify(data));
      const holdings = getHoldings();
      assert.deepStrictEqual(holdings, data);
    });
  });

  describe('addHolding()', () => {
    test('should add a new holding to an empty list', () => {
      const newHolding = { symbol: 'ETH', amount: 2 };
      const result = addHolding(newHolding);

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].symbol, 'ETH');
      assert.strictEqual(result[0].amount, 2);
      assert.ok(result[0].id, 'Should have an auto-generated id');
      assert.ok(result[0].createdAt, 'Should have an auto-generated createdAt');

      // Verify persistence
      const stored = JSON.parse(mockStorage.get('caleta_user_holdings'));
      assert.deepStrictEqual(stored, result);
    });

    test('should append a new holding to an existing list', () => {
      const existing = [{ id: 'old-id', symbol: 'BTC', amount: 1 }];
      mockStorage.set('caleta_user_holdings', JSON.stringify(existing));

      const newHolding = { symbol: 'SOL', amount: 10 };
      const result = addHolding(newHolding);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, 'old-id');
      assert.strictEqual(result[1].symbol, 'SOL');
      assert.ok(result[1].id);
      assert.notStrictEqual(result[1].id, 'old-id');
    });

    test('should generate a valid ISO string for createdAt', () => {
      const result = addHolding({ symbol: 'DOT' });
      const createdAt = result[0].createdAt;
      assert.doesNotThrow(() => new Date(createdAt).toISOString());
      assert.strictEqual(createdAt, new Date(createdAt).toISOString());
    });
  });

  describe('updateHolding()', () => {
    test('should update an existing holding', () => {
      const initial = [{ id: '123', symbol: 'BTC', amount: 1 }];
      mockStorage.set('caleta_user_holdings', JSON.stringify(initial));

      const result = updateHolding('123', { amount: 1.5 });
      assert.strictEqual(result[0].amount, 1.5);
      assert.strictEqual(result[0].symbol, 'BTC');
      assert.ok(result[0].updatedAt, 'Should have an updatedAt timestamp');
    });

    test('should not change other holdings when updating one', () => {
      const initial = [
        { id: '1', symbol: 'BTC', amount: 1 },
        { id: '2', symbol: 'ETH', amount: 10 }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(initial));

      const result = updateHolding('1', { amount: 2 });
      assert.strictEqual(result[0].amount, 2);
      assert.strictEqual(result[1].amount, 10);
      assert.strictEqual(result[1].id, '2');
    });

    test('should return same list if ID not found', () => {
      const initial = [{ id: '1', symbol: 'BTC' }];
      mockStorage.set('caleta_user_holdings', JSON.stringify(initial));

      const result = updateHolding('non-existent', { amount: 2 });
      assert.deepStrictEqual(result, initial);
    });
  });

  describe('removeHolding()', () => {
    test('should remove a holding by ID', () => {
      const initial = [
        { id: '1', symbol: 'BTC' },
        { id: '2', symbol: 'ETH' }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(initial));

      const result = removeHolding('1');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, '2');

      const stored = JSON.parse(mockStorage.get('caleta_user_holdings'));
      assert.strictEqual(stored.length, 1);
    });

    test('should return same list if ID not found for removal', () => {
      const initial = [{ id: '1', symbol: 'BTC' }];
      mockStorage.set('caleta_user_holdings', JSON.stringify(initial));

      const result = removeHolding('non-existent');
      assert.strictEqual(result.length, 1);
      assert.deepStrictEqual(result, initial);
    });
  });
});
