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
 * @returns {Promise<{ time: string, value: number }[]>}
 */
export const buildPortfolioHistorySeries = async (days = 30, signal = null) => {
  const aggregated = aggregateForHistory();
  if (aggregated.length === 0) return [];

  const histories = await Promise.all(
    aggregated.map(({ coinId }) => getCoinHistory(coinId, days, signal))
  );

  /** @type {Map<string, number>} */
  const portfolioByDate = new Map();

  aggregated.forEach(({ balance }, i) => {
    for (const { time, value } of histories[i]) {
      portfolioByDate.set(time, (portfolioByDate.get(time) ?? 0) + balance * value);
    }
  });

  return [...portfolioByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
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
