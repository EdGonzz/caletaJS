import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from './coin-history.js';

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = String(value);
      return this;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createMockReq(options = {}) {
  return {
    method: options.method ?? 'GET',
    query: options.query ?? {},
    headers: options.headers ?? {},
  };
}

describe('api/coin-history handler', () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.API_KEY;
  const TEST_API_KEY = 'CG-test-key-history';

  beforeEach(() => {
    process.env.API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = originalApiKey;
    }
  });

  test('returns 405 with Allow: GET for non-GET requests', async () => {
    const req = createMockReq({ method: 'POST' });
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.getHeader('allow'), 'GET');
    assert.deepEqual(res.body, { error: 'Method Not Allowed' });
  });

  test('returns 500 when API_KEY is absent', async () => {
    delete process.env.API_KEY;
    const req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.error, /configuración interna/i);
  });

  test('returns 400 when id is missing or invalid', async () => {
    const invalidIds = ['', ' ', 'btc/usd', 'bitcoin@123', 'a'.repeat(101)];
    for (const id of invalidIds) {
      const req = createMockReq({ method: 'GET', query: { id } });
      const res = createMockRes();
      await handler(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /'id' requerido/i);
    }
  });

  test('returns 400 on invalid days, interval, or vs_currency', async () => {
    const invalidCases = [
      { query: { id: 'bitcoin', days: 'invalid' } },
      { query: { id: 'bitcoin', days: '100000' } },
      { query: { id: 'bitcoin', interval: 'hourly' } },
      { query: { id: 'bitcoin', vs_currency: 'us' } },
      { query: { id: 'bitcoin', vs_currency: 'toolong' } },
    ];

    for (const { query } of invalidCases) {
      const req = createMockReq({ method: 'GET', query });
      const res = createMockRes();
      await handler(req, res);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body?.error);
    }
  });

  test('sets intraday cache (300s) for days <= 7 and passes interval daily when requested', async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ prices: [[1700000000000, 60000]] }),
      };
    };

    const req = createMockReq({
      method: 'GET',
      query: { id: 'ethereum', days: '7', interval: 'daily', vs_currency: 'eur' },
    });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.getHeader('cache-control'), 'public, s-maxage=300, stale-while-revalidate=600');
    assert.ok(capturedUrl.startsWith('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?'));
    const urlObj = new URL(capturedUrl);
    assert.equal(urlObj.searchParams.get('days'), '7');
    assert.equal(urlObj.searchParams.get('interval'), 'daily');
    assert.equal(urlObj.searchParams.get('vs_currency'), 'eur');
    assert.equal(capturedOptions.headers['x-cg-demo-api-key'], TEST_API_KEY);
    assert.equal(JSON.stringify(res.body).includes(TEST_API_KEY), false);
  });

  test('sets long period cache (3600s) for days > 7 or max', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ prices: [] }),
    });

    for (const days of ['30', '90', '365', 'max']) {
      const req = createMockReq({ method: 'GET', query: { id: 'bitcoin', days } });
      const res = createMockRes();
      await handler(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(
        res.getHeader('cache-control'),
        'public, s-maxage=3600, stale-while-revalidate=7200',
        `Expected 1h cache for days=${days}`,
      );
    }
  });

  test('forwards 429 status and sets Retry-After header', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '60' }),
      json: async () => ({ status: { error_code: 429 } }),
    });

    const req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.getHeader('retry-after'), '60');
    assert.match(res.body.error, /límite de tasa/i);
  });

  test('returns 504 on AbortError and 502 on general error', async () => {
    globalThis.fetch = async () => {
      const err = new Error('Timeout');
      err.name = 'AbortError';
      throw err;
    };

    let req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
    let res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 504);

    globalThis.fetch = async () => {
      throw new Error('Network failure');
    };
    req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
    res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 502);
  });
});
