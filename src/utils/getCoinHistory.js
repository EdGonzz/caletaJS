const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

const options = {
  method: 'GET',
  headers: {
    'x-cg-demo-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
};

/**
 * @typedef {Object} PricePoint
 * @property {string} time - La fecha en formato YYYY-MM-DD
 * @property {number} value - El precio en USD
 */

/**
 * Obtiene el historial de precios de una coin en USD.
 *
 * @param {string} coinId - CoinGecko coin ID (ej: "bitcoin")
 * @param {number} days   - Número de días (1, 7, 30, 90, 365)
 * @param {AbortSignal} [signal] - Señal para abortar la petición
 * @returns {Promise<PricePoint[]>}
 */
export const getCoinHistory = async (coinId, days = 30, signal = null) => {
  if (!coinId) return [];
  // Para períodos <= 7 días omitimos interval=daily para obtener granularidad intradía
  const intervalParam = days <= 7 ? '' : '&interval=daily';
  const url = `${API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}${intervalParam}`;
  try {
    const fetchOptions = signal ? { ...options, signal } : options;
    const res = await fetch(url, fetchOptions);
    if (!res.ok) throw new Error(`market_chart error: ${res.status}`);
    const { prices } = await res.json();
    
    if (!prices || !Array.isArray(prices)) return [];

    return prices.map(([ts, price]) => ({
      time: new Date(ts).toISOString().split('T')[0], // "YYYY-MM-DD"
      value: price
    }));
  } catch (err) {
    // Suprimir logs de cancelaciones intencionales (AbortController)
    if (err.name !== 'AbortError') {
      console.error(`getCoinHistory(${coinId}, ${days}):`, err);
    }
    return [];
  }
};
