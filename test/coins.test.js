import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/coins.js';

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

describe('api/coins handler', () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.API_KEY;
  const TEST_API_KEY = 'CG-test-key-12345';

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
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      const req = createMockReq({ method });
      const res = createMockRes();
      await handler(req, res);
      assert.equal(res.statusCode, 405);
      assert.equal(res.getHeader('allow'), 'GET');
      assert.deepEqual(res.body, { error: 'Method Not Allowed' });
    }
  });

  test('returns 500 when API_KEY is absent in environment', async () => {
    delete process.env.API_KEY;
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.error, /configuración interna/i);
  });

  test('validates query parameters strictly and returns 400 on invalid input', async () => {
    const invalidCases = [
      { query: { vs_currency: 'us' }, label: 'vs_currency too short' },
      { query: { vs_currency: 'toolong' }, label: 'vs_currency too long' },
      { query: { vs_currency: 'US$' }, label: 'vs_currency with non-alpha' },
      { query: { ids: 'bitcoin;' }, label: 'ids with semicolon' },
      { query: { sparkline: 'maybe' }, label: 'sparkline not true/false' },
      { query: { price_change_percentage: '1h,24h,7d,14d,30d,200d,1y,extra' }, label: 'price_change_percentage too long' },
      { query: { order: 'invalid-order!' }, label: 'order invalid chars' },
      { query: { per_page: '0' }, label: 'per_page zero' },
      { query: { per_page: '251' }, label: 'per_page exceeding 250' },
      { query: { per_page: 'notanumber' }, label: 'per_page NaN' },
      { query: { page: '0' }, label: 'page zero' },
      { query: { page: '-1' }, label: 'page negative' },
    ];

    for (const { query } of invalidCases) {
      const req = createMockReq({ method: 'GET', query });
      const res = createMockRes();
      await handler(req, res);
      assert.equal(res.statusCode, 400, `Expected 400 for query: ${JSON.stringify(query)}`);
      assert.ok(res.body?.error, 'Should return error property in body');
    }
  });

  test('accepts full 25-character price_change_percentage period set and returns 200', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => [{ id: 'bitcoin', current_price: 50000 }],
    });

    const fullPeriods = '1h,24h,7d,14d,30d,200d,1y';
    assert.equal(fullPeriods.length, 25);

    const req = createMockReq({
      method: 'GET',
      query: { price_change_percentage: fullPeriods },
    });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
  });

  test('proxies request with defaults, sets x-cg-demo-api-key, and sets cache header', async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => [{ id: 'bitcoin', current_price: 50000 }],
      };
    };

    const req = createMockReq({
      method: 'GET',
      query: {
        ids: 'bitcoin,ethereum',
        sparkline: 'true',
        price_change_percentage: '24h,7d',
      },
    });
    const res = createMockRes();

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.getHeader('cache-control'), 'public, s-maxage=60, stale-while-revalidate=120');
    assert.deepEqual(res.body, [{ id: 'bitcoin', current_price: 50000 }]);

    // Upstream URL verification
    assert.ok(capturedUrl.startsWith('https://api.coingecko.com/api/v3/coins/markets?'));
    const urlObj = new URL(capturedUrl);
    assert.equal(urlObj.searchParams.get('vs_currency'), 'usd');
    assert.equal(urlObj.searchParams.get('ids'), 'bitcoin,ethereum');
    assert.equal(urlObj.searchParams.get('sparkline'), 'true');
    assert.equal(urlObj.searchParams.get('price_change_percentage'), '24h,7d');
    assert.equal(urlObj.searchParams.get('order'), 'market_cap_desc');
    assert.equal(urlObj.searchParams.get('per_page'), '100');
    assert.equal(urlObj.searchParams.get('page'), '1');

    // API Key passed in upstream header, never returned to client
    assert.equal(capturedOptions.headers['x-cg-demo-api-key'], TEST_API_KEY);
    assert.equal(capturedOptions.headers['Accept'], 'application/json');
    assert.equal(JSON.stringify(res.body).includes(TEST_API_KEY), false);
  });

  test('forwards 429 status and sets Retry-After header', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '45' }),
      json: async () => ({ status: { error_code: 429 } }),
    });

    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.getHeader('retry-after'), '45');
    assert.match(res.body.error, /límite de tasa/i);
  });

  test('forwards upstream HTTP error status', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      headers: new Headers(),
      json: async () => ({ error: 'Forbidden' }),
    });

    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 403);
    assert.match(res.body.error, /HTTP 403/);
  });

  test('returns 504 on AbortError timeout', async () => {
    globalThis.fetch = async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    };

    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 504);
    assert.match(res.body.error, /timeout/i);
  });

  test('returns 504 when response body stream aborts (AbortError in json)', async () => {
    let clearedBeforeJson = false;
    const origClearTimeout = globalThis.clearTimeout;
    globalThis.clearTimeout = (id) => {
      clearedBeforeJson = true;
      origClearTimeout(id);
    };

    try {
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => {
          if (clearedBeforeJson) {
            throw new Error('clearTimeout was called before upstreamRes.json() completed');
          }
          const error = new Error('The operation was aborted');
          error.name = 'AbortError';
          throw error;
        },
      });

      const req = createMockReq({ method: 'GET' });
      const res = createMockRes();
      await handler(req, res);

      assert.equal(res.statusCode, 504);
      assert.match(res.body.error, /timeout/i);
    } finally {
      globalThis.clearTimeout = origClearTimeout;
    }
  });

  test('returns 502 on generic network failure', async () => {
    globalThis.fetch = async () => {
      throw new Error('ECONNRESET');
    };

    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 502);
    assert.match(res.body.error, /fallo al contactar/i);
  });
});
