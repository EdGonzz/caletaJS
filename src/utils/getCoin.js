const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

/**
 * @typedef {Object} Coin
 * @property {string}      id                                 - Identificador único (e.g. "bitcoin")
 * @property {string}      symbol                             - Ticker en minúsculas (e.g. "btc")
 * @property {string}      name                               - Nombre legible (e.g. "Bitcoin")
 * @property {string}      image                              - URL de la imagen del coin
 * @property {number}      current_price                      - Precio actual en USD
 * @property {number}      market_cap                         - Capitalización de mercado en USD
 * @property {number}      market_cap_rank                    - Ranking por market cap
 * @property {number|null} fully_diluted_valuation            - Valoración fully diluted en USD
 * @property {number}      total_volume                       - Volumen total en 24h (USD)
 * @property {number}      high_24h                           - Precio máximo en las últimas 24h
 * @property {number}      low_24h                            - Precio mínimo en las últimas 24h
 * @property {number}      price_change_24h                   - Cambio absoluto de precio en 24h
 * @property {number}      price_change_percentage_24h        - Cambio porcentual de precio en 24h
 * @property {number}      market_cap_change_24h              - Cambio absoluto de market cap en 24h
 * @property {number}      market_cap_change_percentage_24h   - Cambio porcentual de market cap en 24h
 * @property {number}      circulating_supply                 - Oferta circulante actual
 * @property {number}      total_supply                       - Oferta total
 * @property {number|null} max_supply                         - Oferta máxima (null si ilimitada)
 * @property {number}      ath                                - All-time high en USD
 * @property {number}      ath_change_percentage              - Diferencia porcentual vs ATH
 * @property {string}      ath_date                           - Fecha ISO 8601 del ATH
 * @property {number}      atl                                - All-time low en USD
 * @property {number}      atl_change_percentage              - Diferencia porcentual vs ATL
 * @property {string}      atl_date                           - Fecha ISO 8601 del ATL
 * @property {null}        roi                                - Return on investment (null para BTC)
 * @property {string}      last_updated                       - Última actualización en ISO 8601
 */

const options = {
  method: 'GET',
  headers: {
    'x-cg-demo-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
};

/**
 * Busca monedas de forma global.
 * @param {string} query
 * @returns {Promise<{coins: Array}>}
 */
export const searchCoins = async (query) => {
  try {
    const response = await fetch(`${API_URL}/search?query=${query}`, options);
    if (!response.ok) throw new Error(`Search API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error searching coins:', error);
    return { coins: [] };
  }
};

/**
 * Obtiene el top de monedas por market cap.
 * @param {number} limit
 * @returns {Promise<Coin[]>}
 */
export const getTopCoins = async (limit = 10) => {
  try {
    const response = await fetch(`${API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`, options);
    if (!response.ok) throw new Error(`Markets API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching top coins:', error);
    return [];
  }
};

/**
 * Obtiene datos detallados de una moneda por su ID.
 * @param {string} id - ID de CoinGecko (e.g. "bitcoin")
 * @returns {Promise<Coin | null>}
 */
const getCoin = async (id) => {
  if (!id) return null;
  try {
    const response = await fetch(`${API_URL}/coins/markets?vs_currency=usd&ids=${id}`, options);
    if (!response.ok) throw new Error(`Coin Detail API Error: ${response.status}`);
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching coin detail:', error);
    return null;
  }
};

export default getCoin;