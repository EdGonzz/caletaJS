// api/coin-history.js
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT_MS = 8000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('[api/coin-history] Error crítico: Variable de entorno API_KEY no configurada.');
    return res.status(500).json({ error: 'Error de configuración interna del servidor.' });
  }

  const { id, days = '30', interval, vs_currency = 'usd' } = req.query;

  if (!id || !/^[a-z0-9-_]{1,100}$/.test(String(id).trim().toLowerCase())) {
    return res.status(400).json({ error: "Parámetro 'id' requerido y con formato válido." });
  }

  if (!/^(1|7|30|90|365|max|[0-9]{1,4})$/.test(String(days))) {
    return res.status(400).json({ error: "Parámetro 'days' inválido." });
  }

  if (interval && interval !== 'daily') {
    return res.status(400).json({ error: "Parámetro 'interval' solo puede ser 'daily'." });
  }

  if (!/^[a-z]{3,4}$/.test(vs_currency)) {
    return res.status(400).json({ error: "Parámetro 'vs_currency' inválido." });
  }

  const searchParams = new URLSearchParams({
    vs_currency,
    days: String(days),
  });

  if (interval === 'daily') {
    searchParams.set('interval', 'daily');
  }

  const cleanId = encodeURIComponent(String(id).trim().toLowerCase());
  const targetUrl = `${COINGECKO_BASE}/coins/${cleanId}/market_chart?${searchParams.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-cg-demo-api-key': apiKey,
      },
      signal: controller.signal,
    });

    if (!upstreamRes.ok) {
      clearTimeout(timeoutId);
      if (upstreamRes.status === 429) {
        res.setHeader('Retry-After', upstreamRes.headers.get('retry-after') || '60');
        return res.status(429).json({ error: 'Límite de tasa de CoinGecko alcanzado.' });
      }
      return res.status(upstreamRes.status).json({
        error: `Error upstream CoinGecko: HTTP ${upstreamRes.status}`,
      });
    }

    const data = await upstreamRes.json();
    clearTimeout(timeoutId);

    // Caché según granularidad (ADR-018):
    // Períodos intradía (<=7 días): 5 min en CDN
    // Períodos largos (>7 días): 1 hora en CDN (datos diarios históricos)
    const numDays = parseInt(days, 10);
    const isIntraday = numDays <= 7;
    const cacheHeader = isIntraday
      ? 'public, s-maxage=300, stale-while-revalidate=600'
      : 'public, s-maxage=3600, stale-while-revalidate=7200';

    res.setHeader('Cache-Control', cacheHeader);
    return res.status(200).json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout al conectar con el servicio upstream.' });
    }
    console.error('[api/coin-history] Error en fetch:', error);
    return res.status(502).json({ error: 'Fallo al contactar el servicio de CoinGecko.' });
  }
}
