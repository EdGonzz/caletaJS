import { getHoldings } from './holdingsStorage.js';
import { getCoinHistory } from './getCoinHistory.js';

/**
 * Agrega holdings crudos por coinId, sumando balances cross-exchange.
 * Replica la lógica de buy/sell de HoldingsTable.aggregateHoldings().
 *
 * @returns {{ coinId: string, name: string, symbol: string, balance: number }[]}
 */
const aggregateForHistory = () => {
  const holdings = getHoldings();
  /** @type {Map<string, { coinId: string, name: string, symbol: string, balance: number }>} */
  const map = new Map();

  for (const h of holdings) {
    const existing = map.get(h.coinId);
    if (existing) {
      if (h.type === 'buy' || h.type === 'transfer') existing.balance += h.balance ?? 0;
      if (h.type === 'sell') existing.balance -= h.balance ?? 0;
    } else {
      const initialBalance = (h.type === 'buy' || h.type === 'transfer') ? (h.balance ?? 0) : -(h.balance ?? 0);
      map.set(h.coinId, {
        coinId: h.coinId,
        name: h.name ?? h.coinId,
        symbol: h.symbol ?? '',
        balance: initialBalance
      });
    }
  }

  return [...map.values()].filter(h => h.balance > 0);
};

/**
 * Construye la serie histórica del valor total del portafolio.
 * Para cada día: portfolioValue[día] = Σ(balance_coin × price_coin[día])
 *
 * Realiza 1 llamada API por coinId único.
 *
 * @param {number} days - Período en días (1, 7, 30, 90, 365)
 * @param {AbortSignal} [signal] - Señal para abortar peticiones en vuelo
 * @returns {Promise<{ time: string|number, value: number }[]>}
 */
export const buildPortfolioHistorySeries = async (days = 30, signal = null) => {
  const aggregated = aggregateForHistory();
  if (aggregated.length === 0) return [];

  const holdings = getHoldings();
  const isIntraday = days <= 7;

  // Para cada coin, calcular la fecha más temprana de transacción.
  // Así evitamos proyectar el balance actual hacia fechas en que el usuario
  // todavía no tenía esa posición.
  /** @type {Map<string, string>} coinId → 'YYYY-MM-DD' */
  const startDateByCoin = new Map();
  for (const h of holdings) {
    const rawDate = h.date || h.createdAt;
    if (!rawDate) continue;
    const date = rawDate.split('T')[0];
    const current = startDateByCoin.get(h.coinId);
    if (!current || date < current) startDateByCoin.set(h.coinId, date);
  }

  const histories = await Promise.all(
    aggregated.map(({ coinId }) => getCoinHistory(coinId, days, signal))
  );

  /** @type {Map<string, number>} */
  const portfolioByDate = new Map();

  aggregated.forEach(({ coinId, balance }, i) => {
    const startDate = startDateByCoin.get(coinId);

    // Deduplicar precios por fecha (el último punto del día gana)
    // y omitir fechas anteriores a cuando el usuario adquirió la coin.
    // Para intradía (timestamps UNIX), agrupar por fecha YYYY-MM-DD.
    // Para diario (YYYY-MM-DD), usar la fecha como clave directamente.
    /** @type {Map<string, number>} */
    const priceByDate = new Map();
    for (const { time, value } of histories[i]) {
      const dateStr = isIntraday
        ? new Date(time * 1000).toISOString().split('T')[0]
        : time;

      if (startDate && dateStr < startDate) continue;
      priceByDate.set(time, value);
    }

    for (const [timeKey, price] of priceByDate) {
      portfolioByDate.set(timeKey, (portfolioByDate.get(timeKey) ?? 0) + balance * price);
    }
  });

  return [...portfolioByDate.entries()]
    .sort(([a], [b]) => isIntraday ? a - b : a.localeCompare(b))
    .map(([time, value]) => ({ time, value }));
};


/**
 * Construye datos de allocation a partir de holdings ya procesados por HoldingsTable.
 * Recibe el array del evento `prices-updated` (estructura de aggregateHoldings):
 *   { id, name, symbol, logoUrl, balance, price, value, change24h, ... }
 *
 * No llama a la API — los precios ya vienen actualizados del evento.
 *
 * @param {Array} processedHoldings - Array del evento prices-updated
 * @returns {{ id: string, name: string, symbol: string, pct: number, value: number }[]}
 */
export const buildAllocationData = (processedHoldings = []) => {
  const totalValue = processedHoldings.reduce((sum, h) => sum + (h.value ?? 0), 0);
  if (totalValue === 0) return [];

  return processedHoldings
    .map(({ id, name, symbol, value }) => ({
      id, name, symbol,
      value: value ?? 0,
      pct: ((value ?? 0) / totalValue) * 100
    }))
    .sort((a, b) => b.value - a.value);
};
