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

/**
 * Obtiene datos de un coin específico o la lista de coins por market cap.
 *
 * @param {string} [id] - ID del coin (e.g. "bitcoin"). Si se omite, retorna el top 10.
 * @returns {Promise<Coin[] | Coin | null>} Array de coins, un coin, o null si hay error.
 */
const getCoin = async (id) => {
  const url = id
    ? `${API_URL}/search?query=${id}`
    : `${API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1`;

  const options = {
    method: 'GET',
    headers: {
      'x-cg-demo-api-key': API_KEY,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};

export default getCoin;