import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import getCoin, { searchCoins, getTopCoins } from './getCoin.js';
import { getCoinHistory } from './getCoinHistory.js';
import getExchange from './getExchange.js';

/**
 * Regression tests for the Vercel serverless proxy migration.
 * The browser must call same-origin /api/* routes and must never send the
 * CoinGecko API key as a request header.
 */
describe('frontend API proxy routes', () => {
  const originalFetch = globalThis.fetch;
  let calls;

  const jsonResponse = (payload) => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => payload,
  });

  beforeEach(() => {
    calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      if (url.startsWith('/api/coin?')) return jsonResponse({ coins: [] });
      if (url.startsWith('/api/coin-history?')) return jsonResponse({ prices: [[1000, 1]] });
      if (url.startsWith('/api/coins?')) return jsonResponse([{ id: 'bitcoin' }]);
      return jsonResponse([]);
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const assertProxied = (call, expectedPrefix) => {
    assert.ok(
      call.url.startsWith(expectedPrefix),
      `expected ${expectedPrefix}, got ${call.url}`,
    );
    const headers = call.options?.headers ?? {};
    assert.ok(
      !Object.keys(headers).some((name) => name.toLowerCase() === 'x-cg-demo-api-key'),
      'the browser must never send x-cg-demo-api-key',
    );
  };

  test('searchCoins uses the /api/coin route', async () => {
    await searchCoins('solana');
    assert.strictEqual(calls.length, 1);
    assertProxied(calls[0], '/api/coin?query=solana');
  });

  test('getTopCoins uses the /api/coins route', async () => {
    await getTopCoins(10);
    assert.strictEqual(calls.length, 1);
    assertProxied(calls[0], '/api/coins?');
  });

  test('getCoin uses the /api/coins route', async () => {
    await getCoin('bitcoin');
    assert.strictEqual(calls.length, 1);
    assertProxied(calls[0], '/api/coins?ids=bitcoin');
  });

  test('getCoinHistory uses the /api/coin-history route', async () => {
    await getCoinHistory('bitcoin', 30);
    assert.strictEqual(calls.length, 1);
    assertProxied(calls[0], '/api/coin-history?id=bitcoin&days=30');
  });

  test('getExchange list uses the /api/exchange route', async () => {
    await getExchange();
    assert.strictEqual(calls.length, 1);
    assertProxied(calls[0], '/api/exchange?per_page=15&page=1');
  });

  test('getExchange by id uses the /api/exchange route', async () => {
    await getExchange('binance');
    assert.strictEqual(calls.length, 1);
    assertProxied(calls[0], '/api/exchange?id=binance');
  });
});
