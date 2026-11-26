import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/coin.js';

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

describe('api/coin handler', () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.API_KEY;
  const TEST_API_KEY = 'CG-test-key-coin';

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
    const req = createMockReq({ method: 'GET', query: { query: 'sol' } });
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.error, /configuración interna/i);
  });

  test('returns 400 when neither query nor id is provided', async () => {
    const req = createMockReq({ method: 'GET', query: {} });
    const res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /debe proveer el parámetro/i);
  });

  test('returns 400 on invalid query or id', async () => {
    const invalidCases = [
      { query: { query: '   ' }, label: 'whitespace query' },
      { query: { query: 'a'.repeat(101) }, label: 'query too long' },
      { query: { query: 'sol\nana' }, label: 'query with newline' },
      { query: { id: 'btc/usd' }, label: 'id with slash' },
      { query: { id: 'bitcoin!' }, label: 'id with invalid characters' },
    ];

    for (const { query } of invalidCases) {
      const req = createMockReq({ method: 'GET', query });
      const res = createMockRes();
      await handler(req, res);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body?.error);
    }
  });

  test('proxies search query with 1h cache and upstream header', async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ coins: [{ id: 'solana', name: 'Solana' }] }),
      };
    };

    const req = createMockReq({ method: 'GET', query: { query: 'solana' } });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.getHeader('cache-control'), 'public, s-maxage=3600, stale-while-revalidate=86400');
    assert.equal(capturedUrl, 'https://api.coingecko.com/api/v3/search?query=solana');
    assert.equal(capturedOptions.headers['x-cg-demo-api-key'], TEST_API_KEY);
    assert.deepEqual(res.body, { coins: [{ id: 'solana', name: 'Solana' }] });
    assert.equal(JSON.stringify(res.body).includes(TEST_API_KEY), false);
  });

  test('proxies coin details by id with 2m cache and upstream header', async () => {
    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ id: 'bitcoin', name: 'Bitcoin' }),
      };
    };

    const req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.getHeader('cache-control'), 'public, s-maxage=120, stale-while-revalidate=300');
    assert.equal(capturedUrl, 'https://api.coingecko.com/api/v3/coins/bitcoin');
    assert.equal(capturedOptions.headers['x-cg-demo-api-key'], TEST_API_KEY);
    assert.deepEqual(res.body, { id: 'bitcoin', name: 'Bitcoin' });
    assert.equal(JSON.stringify(res.body).includes(TEST_API_KEY), false);
  });

  test('forwards 429 status and sets Retry-After header', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '30' }),
      json: async () => ({ status: { error_code: 429 } }),
    });

    const req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
    const res = createMockRes();
    await handler(req, res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.getHeader('retry-after'), '30');
    assert.match(res.body.error, /límite de tasa/i);
  });

  test('returns 504 on AbortError and 502 on other failures', async () => {
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
      throw new Error('Connection failed');
    };
    req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
    res = createMockRes();
    await handler(req, res);
    assert.equal(res.statusCode, 502);
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

      const req = createMockReq({ method: 'GET', query: { id: 'bitcoin' } });
      const res = createMockRes();
      await handler(req, res);

      assert.equal(res.statusCode, 504);
      assert.match(res.body.error, /timeout/i);
    } finally {
      globalThis.clearTimeout = origClearTimeout;
    }
  });
});
