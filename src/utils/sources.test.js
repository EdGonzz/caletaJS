import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { getSource, addSource, deleteSource, DEFAULT_SOURCE } from './sources.js';

describe('sources', () => {
  let mockStorage = new Map();

  beforeEach(() => {
    mockStorage = new Map();
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

  describe('getSource()', () => {
    test('should return default source list if empty', () => {
      const sources = getSource();
      assert.deepStrictEqual(sources, [DEFAULT_SOURCE]);
    });
  });

  describe('addSource()', () => {
    test('should add new source to storage', () => {
      const newSource = { name: 'Binance', image: 'binance.png' };
      const result = addSource(newSource);
      assert.strictEqual(result.length, 2);
      assert.deepStrictEqual(result[1], newSource);

      const stored = JSON.parse(mockStorage.get('caleta_user_sources'));
      assert.deepStrictEqual(stored, result);
    });

    test('should not add duplicate source', () => {
      const source = { name: 'Binance', image: 'binance.png' };
      addSource(source);
      const result = addSource(source);
      assert.strictEqual(result.length, 2);
    });
  });

  describe('deleteSource()', () => {
    test('should delete source by name', () => {
      const source1 = { name: 'Binance', image: 'binance.png' };
      const source2 = { name: 'Kraken', image: 'kraken.png' };
      addSource(source1);
      addSource(source2);

      const result = deleteSource('Binance');
      assert.strictEqual(result.length, 2); // DEFAULT_SOURCE y Kraken
      const exists = result.some(s => (typeof s === 'string' ? s : s.name) === 'Binance');
      assert.strictEqual(exists, false);

      const stored = JSON.parse(mockStorage.get('caleta_user_sources'));
      assert.strictEqual(stored.length, 2);
    });

    // Fix #6: DEFAULT_SOURCE debe ser indestructible
    test('should throw when attempting to delete DEFAULT_SOURCE', () => {
      assert.throws(
        () => deleteSource(DEFAULT_SOURCE),
        (err) => {
          assert.ok(err instanceof Error);
          assert.ok(err.message.includes(DEFAULT_SOURCE));
          return true;
        }
      );
    });

    test('should not modify storage when DEFAULT_SOURCE deletion is attempted', () => {
      const source = { name: 'Binance', image: 'binance.png' };
      addSource(source);
      const before = JSON.stringify(mockStorage.get('caleta_user_sources'));

      try { deleteSource(DEFAULT_SOURCE); } catch (_) { /* esperado */ }

      const after = JSON.stringify(mockStorage.get('caleta_user_sources'));
      assert.strictEqual(before, after);
    });
  });
});
