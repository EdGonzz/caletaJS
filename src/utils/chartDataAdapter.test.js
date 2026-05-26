import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { buildPortfolioHistorySeries, buildAllocationData } from './chartDataAdapter.js';

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

    // Configurar API variables de entorno mock
    process.env.API_KEY = 'mock-key';
    process.env.API_URL = 'https://api.coingecko.com/api/v3';
  });

  afterEach(() => {
    delete globalThis.localStorage;
    globalThis.fetch = originalFetch;
  });

  describe('buildAllocationData()', () => {
    test('debe calcular porcentajes y montos ordenados de mayor a menor', () => {
      const holdings = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', value: 80000 },  // 80%
        { id: 'ethereum', name: 'Ethereum', symbol: 'eth', value: 20000 }  // 20%
      ];

      const res = buildAllocationData(holdings);
      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].id, 'bitcoin');
      assert.strictEqual(res[0].value, 80000);
      assert.strictEqual(res[0].pct, 80);
      assert.strictEqual(res[1].id, 'ethereum');
      assert.strictEqual(res[1].value, 20000);
      assert.strictEqual(res[1].pct, 20);
    });

    test('debe retornar array vacío si no hay holdings', () => {
      const res = buildAllocationData([]);
      assert.deepStrictEqual(res, []);
    });

    test('debe retornar array vacío si el valor total es 0', () => {
      const holdings = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', value: 0 }
      ];
      const res = buildAllocationData(holdings);
      assert.deepStrictEqual(res, []);
    });
  });

  describe('buildPortfolioHistorySeries()', () => {
    test('debe retornar historial del portafolio sumando los valores ponderados por día', async () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', balance: 2, type: 'buy' },
        { coinId: 'ethereum', name: 'Ethereum', symbol: 'eth', balance: 10, type: 'buy' }
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

    test('debe propagar AbortSignal a getCoinHistory', async () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', balance: 1, type: 'buy' }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      const controller = new AbortController();
      controller.abort(); // Abortar inmediatamente

      // fetch debe recibir el signal abortado
      let receivedSignal = null;
      globalThis.fetch = async (url, opts) => {
        receivedSignal = opts?.signal ?? null;
        // Simular error de abort
        if (opts?.signal?.aborted) {
          const err = new Error('AbortError');
          err.name = 'AbortError';
          throw err;
        }
        return { ok: true, json: async () => ({ prices: [] }) };
      };

      const res = await buildPortfolioHistorySeries(30, controller.signal);
      assert.deepStrictEqual(res, []);
      assert.ok(receivedSignal !== null, 'El signal debe haberse propagado al fetch');
    });

    test('debe filtrar fechas anteriores a la propiedad date de la transacción', async () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', balance: 1, type: 'buy', date: '2024-01-02T12:00:00' }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      globalThis.fetch = async (url) => {
        if (url.includes('bitcoin')) {
          return {
            ok: true,
            json: async () => ({
              prices: [
                [1704067200000, 40000], // 2024-01-01
                [1704153600000, 45000], // 2024-01-02
                [1704240000000, 50000]  // 2024-01-03
              ]
            })
          };
        }
        return { ok: false };
      };

      const res = await buildPortfolioHistorySeries(30);

      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].time, '2024-01-02');
      assert.strictEqual(res[0].value, 45000);
      assert.strictEqual(res[1].time, '2024-01-03');
      assert.strictEqual(res[1].value, 50000);
    });

    test('debe filtrar fechas anteriores a la propiedad createdAt de la transacción si date no existe', async () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', balance: 1, type: 'buy', createdAt: '2024-01-02T12:00:00.000Z' }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      globalThis.fetch = async (url) => {
        if (url.includes('bitcoin')) {
          return {
            ok: true,
            json: async () => ({
              prices: [
                [1704067200000, 40000], // 2024-01-01
                [1704153600000, 45000], // 2024-01-02
                [1704240000000, 50000]  // 2024-01-03
              ]
            })
          };
        }
        return { ok: false };
      };

      const res = await buildPortfolioHistorySeries(30);

      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].time, '2024-01-02');
      assert.strictEqual(res[0].value, 45000);
    });

    test('debe soportar periodos intradía (días <= 7) ordenando numéricamente por timestamp sin agrupar por fecha', async () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', balance: 1, type: 'buy' }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      globalThis.fetch = async (url) => {
        if (url.includes('bitcoin')) {
          return {
            ok: true,
            json: async () => ({
              prices: [
                [1704240000000, 42000], // 2024-01-03 00:00:00 (1704240000 segs)
                [1704067200000, 40000], // 2024-01-01 00:00:00 (1704067200 segs)
                [1704153600000, 41000]  // 2024-01-02 00:00:00 (1704153600 segs)
              ]
            })
          };
        }
        return { ok: false };
      };

      const res = await buildPortfolioHistorySeries(7);

      assert.strictEqual(res.length, 3);
      assert.strictEqual(res[0].time, 1704067200);
      assert.strictEqual(res[0].value, 40000);
      assert.strictEqual(res[1].time, 1704153600);
      assert.strictEqual(res[1].value, 41000);
      assert.strictEqual(res[2].time, 1704240000);
      assert.strictEqual(res[2].value, 42000);
    });

    test('debe alinear timestamps intradía desalineados entre diferentes monedas', async () => {
      const holdings = [
        { coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', balance: 1, type: 'buy' },
        { coinId: 'ethereum', name: 'Ethereum', symbol: 'eth', balance: 2, type: 'buy' }
      ];
      mockStorage.set('caleta_user_holdings', JSON.stringify(holdings));

      globalThis.fetch = async (url) => {
        if (url.includes('bitcoin')) {
          return {
            ok: true,
            json: async () => ({
              prices: [
                [1704067201000, 40000], // 2024-01-01 00:00:01 (redondea a 1704067200)
                [1704067502000, 41000]  // 2024-01-01 00:05:02 (redondea a 1704067500)
              ]
            })
          };
        }
        if (url.includes('ethereum')) {
          return {
            ok: true,
            json: async () => ({
              prices: [
                [1704067198000, 2000],  // 2024-01-01 23:59:58 (redondea a 1704067200)
                [1704067499000, 2100]   // 2024-01-01 00:04:59 (redondea a 1704067500)
              ]
            })
          };
        }
        return { ok: false };
      };

      const res = await buildPortfolioHistorySeries(1);

      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].time, 1704067200);
      assert.strictEqual(res[0].value, 44000);
      assert.strictEqual(res[1].time, 1704067500);
      assert.strictEqual(res[1].value, 45200);
    });

    test('debe retornar array vacío si no hay holdings', async () => {
      mockStorage.set('caleta_user_holdings', JSON.stringify([]));
      const res = await buildPortfolioHistorySeries(30);
      assert.deepStrictEqual(res, []);
    });
  });
});
