// api/coin.js
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT_MS = 8000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('[api/coin] Error crítico: Variable de entorno API_KEY no configurada.');
    return res.status(500).json({ error: 'Error de configuración interna del servidor.' });
  }

  const { query, id } = req.query;

  if (!query && !id) {
    return res.status(400).json({ error: "Debe proveer el parámetro 'query' (para búsqueda) o 'id' (para moneda)." });
  }

  let targetUrl = '';
  let cacheHeader = '';

  if (query) {
    const trimmedQuery = String(query).trim();
    if (trimmedQuery.length === 0 || trimmedQuery.length > 100 || /[\r\n\0]/.test(trimmedQuery)) {
      return res.status(400).json({ error: "Parámetro 'query' inválido." });
    }
    targetUrl = `${COINGECKO_BASE}/search?query=${encodeURIComponent(trimmedQuery)}`;
    // Búsquedas cambian raramente: caché edge de 1 hora
    cacheHeader = 'public, s-maxage=3600, stale-while-revalidate=86400';
  } else {
    const trimmedId = String(id).trim().toLowerCase();
    if (!/^[a-z0-9-_]{1,100}$/.test(trimmedId)) {
      return res.status(400).json({ error: "Parámetro 'id' con formato inválido." });
    }
    targetUrl = `${COINGECKO_BASE}/coins/${encodeURIComponent(trimmedId)}`;
    cacheHeader = 'public, s-maxage=120, stale-while-revalidate=300';
  }

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
    res.setHeader('Cache-Control', cacheHeader);
    return res.status(200).json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout al conectar con el servicio upstream.' });
    }
    console.error('[api/coin] Error en fetch:', error);
    return res.status(502).json({ error: 'Fallo al contactar el servicio de CoinGecko.' });
  }
}
