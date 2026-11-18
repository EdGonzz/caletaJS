import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from './exchange.js';

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

describe('api/exchange handler', () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.API_KEY;
  const TEST_API_KEY = 'CG-test-key-exchange';

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
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.error, /configuración interna/i);
  });

  test('returns 400 on invalid id, per_page, or page', async () => {
    const invalidCases = [
      { query: { id: 'binance/us' } },
      { query: { id: 'binance@123' } },
      { query: { per_page: '0' } },
      { query: { per_page: '251' } },
      { query: { per_page: 'abc' } },
      { query: { page: '0' } },
      { query: { page: '-2' } },
      { query: { page: 'xyz' } },
    ];

    for (const { query } of invalidCases) {
      const req = createMockReq({ method: 'GET', query });
      const res = createMockRes();
      await handler(req, res);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body?.error);
    }
  });

  test('proxies exchange list with defaults, cache header, and x-cg-demo-api-key', async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => [{ id: 'binance', name: 'Binance' }],
      };
    };

    const req = createMockReq({ method: 'GET', query: {} });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.getHeader('cache-control'), 'public, s-maxage=3600, stale-while-revalidate=86400');
    assert.equal(capturedUrl, 'https://api.coingecko.com/api/v3/exchanges?per_page=15&page=1');
    assert.equal(capturedOptions.headers['x-cg-demo-api-key'], TEST_API_KEY);
    assert.deepEqual(res.body, [{ id: 'binance', name: 'Binance' }]);
    assert.equal(JSON.stringify(res.body).includes(TEST_API_KEY), false);
  });

  test('proxies exchange by id with cache header and x-cg-demo-api-key', async () => {
    let capturedUrl = null;

    globalThis.fetch = async (url) => {
      capturedUrl = String(url);
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ id: 'gdax', name: 'Coinbase Exchange' }),
      };
    };

    const req = createMockReq({ method: 'GET', query: { id: 'gdax' } });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.getHeader('cache-control'), 'public, s-maxage=3600, stale-while-revalidate=86400');
    assert.equal(capturedUrl, 'https://api.coingecko.com/api/v3/exchanges/gdax');
  });

  test('forwards 429 status and sets Retry-After header', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '60' }),
      json: async () => ({ status: { error_code: 429 } }),
    });

    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.getHeader('retry-after'), '60');
    assert.match(res.body.error, /límite de tasa/i);
  });

  test('returns 504 on AbortError and 502 on other failures', async () => {
    globalThis.fetch = async () => {
      const err = new Error('Timeout');
      err.name = 'AbortError';
      throw err;
    };

    let req = createMockReq({ method: 'GET' });
    let res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 504);

    globalThis.fetch = async () => {
      throw new Error('Network error');
    };
    req = createMockReq({ method: 'GET' });
    res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 502);
  });
});
