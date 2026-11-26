// api/exchange.js
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT_MS = 8000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('[api/exchange] Error crítico: Variable de entorno API_KEY no configurada.');
    return res.status(500).json({ error: 'Error de configuración interna del servidor.' });
  }

  const { id, per_page = '15', page = '1' } = req.query;

  let targetUrl = '';

  if (id) {
    const cleanId = String(id).trim().toLowerCase();
    if (!/^[a-z0-9-_]{1,100}$/.test(cleanId)) {
      return res.status(400).json({ error: "Parámetro 'id' con formato inválido." });
    }
    targetUrl = `${COINGECKO_BASE}/exchanges/${encodeURIComponent(cleanId)}`;
  } else {
    const parsedPerPage = parseInt(per_page, 10);
    const parsedPage = parseInt(page, 10);
    if (Number.isNaN(parsedPerPage) || parsedPerPage < 1 || parsedPerPage > 250) {
      return res.status(400).json({ error: "Parámetro 'per_page' fuera de rango (1-250)." });
    }
    if (Number.isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({ error: "Parámetro 'page' inválido." });
    }
    targetUrl = `${COINGECKO_BASE}/exchanges?per_page=${parsedPerPage}&page=${parsedPage}`;
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

    // Los datos de exchanges son prácticamente estáticos: caché de 1 hora
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout al conectar con el servicio upstream.' });
    }
    console.error('[api/exchange] Error en fetch:', error);
    return res.status(502).json({ error: 'Fallo al contactar el servicio de CoinGecko.' });
  }
}
