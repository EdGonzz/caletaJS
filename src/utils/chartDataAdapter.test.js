import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { getAggregatedHoldings, buildPortfolioHistorySeries, buildAllocationData } from './chartDataAdapter.js';

describe('chartDataAdapter', () => {
  let mockStorage = new Map();
  let originalFetch = globalThis.fetch;

  beforeEach(() => {
    mockStorage = new Map();
    // Mock localStorage
    globalThis.localStorage = {
      getItem: (key) => mockStorage.get(key) || null,
      setItem: (key, value) => mockStorage.set(key, value),
      removeItem: (key) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    };

    // Configurar API variables de entorno mock si no existen
    process.env.API_KEY = 'mock-key';
    process.env.API_URL = 'https://api.coingecko.com/api/v3';
  });

  afterEach(() => {
    delete globalThis.localStorage;
    globalThis.fetch = originalFetch;
  });

  describe('getAggregatedHoldings()', () => {
    test('debe retornar array vacío si no hay holdings', () => {
      mockStorage.set('caleta_user_holdings', JSON.stringify([]));
      const res = getAggregatedHoldings();
      assert.deepStrictEqual(res, []);
    });

    test('debe agrupar holdings con el mismo coinId sumando sus montos', () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', amount: 1.5, currentPrice: 50000 },
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', amount: 0.5, currentPrice: 50000 },
        { coinId: 'ethereum', name: 'Ethereum', symbol: 'eth', amount: 10, currentPrice: 3000 }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      const res = getAggregatedHoldings();
      assert.strictEqual(res.length, 2);
      
      const btc = res.find(h => h.coinId === 'bitcoin');
      const eth = res.find(h => h.coinId === 'ethereum');

      assert.strictEqual(btc.totalAmount, 2.0);
      assert.strictEqual(eth.totalAmount, 10);
    });
  });

  describe('buildAllocationData()', () => {
    test('debe calcular porcentajes y montos ordenados de mayor a menor', () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', amount: 2, currentPrice: 40000 }, // Value = 80000 (80%)
        { coinId: 'ethereum', name: 'Ethereum', symbol: 'eth', amount: 5, currentPrice: 4000 }  // Value = 20000 (20%)
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      const res = buildAllocationData();
      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].coinId, 'bitcoin'); // El más grande primero
      assert.strictEqual(res[0].pct, 80);
      assert.strictEqual(res[1].pct, 20);
    });

    test('debe retornar array vacío si el valor total es 0', () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', amount: 0, currentPrice: 40000 }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      const res = buildAllocationData();
      assert.deepStrictEqual(res, []);
    });
  });

  describe('buildPortfolioHistorySeries()', () => {
    test('debe retornar historial del portafolio sumando los valores ponderados por día', async () => {
      const holdings = [
        { coinId: 'bitcoin', amount: 2, currentPrice: 50000 },
        { coinId: 'ethereum', amount: 10, currentPrice: 3000 }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      // Mock de fetch para simular respuestas de CoinGecko
      globalThis.fetch = async (url) => {
        if (url.includes('bitcoin')) {
          return {
            ok: true,
            json: async () => ({
              prices: [
                [1704067200000, 40000], // 2024-01-01
                [1704153600000, 45000]  // 2024-01-02
              ]
            })
          };
        }
        if (url.includes('ethereum')) {
          return {
            ok: true,
            json: async () => ({
              prices: [
                [1704067200000, 2000],  // 2024-01-01
                [1704153600000, 2500]   // 2024-01-02
              ]
            })
          };
        }
        return { ok: false };
      };

      const res = await buildPortfolioHistorySeries(30);

      // Total 2024-01-01: (2 * 40000) + (10 * 2000) = 80000 + 20000 = 100000
      // Total 2024-01-02: (2 * 45000) + (10 * 2500) = 90000 + 25000 = 115000
      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].time, '2024-01-01');
      assert.strictEqual(res[0].value, 100000);
      assert.strictEqual(res[1].time, '2024-01-02');
      assert.strictEqual(res[1].value, 115000);
    });

    test('debe retornar array vacío si no hay holdings', async () => {
      mockStorage.set('caleta_user_holdings', JSON.stringify([]));
      const res = await buildPortfolioHistorySeries(30);
      assert.deepStrictEqual(res, []);
    });
  });
});
