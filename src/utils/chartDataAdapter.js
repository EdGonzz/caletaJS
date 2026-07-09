/**
 * @fileoverview Adapta datos de la API a los formatos requeridos por los gráficos.
 */

import { getHoldings } from './holdingsStorage.js';
import { getCoinHistory } from './getCoinHistory.js';
import { DEFAULT_SOURCE } from './sources.js';
import { ApiError, ErrorType } from './errors.js';
import { getBalanceDelta } from './transactionUtils.js';

/**
 * Agrega holdings crudos por coinId, sumando balances cross-exchange.
 * Usa getBalanceDelta() como regla centralizada de balance (ADR-028) para
 * que los tipos 'buy', 'sell', 'transfer_in', 'transfer_out' se manejen
 * de forma consistente con el resto de la aplicación.
 *
 * @param {Array} holdings - Array de holdings crudos
 * @returns {{ coinId: string, name: string, symbol: string, balance: number }[]}
 */
const aggregateForHistory = (holdings = []) => {
  /** @type {Map<string, { coinId: string, name: string, symbol: string, balance: number }>} */
  const map = new Map();

  for (const h of holdings) {
    const delta = getBalanceDelta(h);
    if (delta === 0) continue;

    const existing = map.get(h.coinId);
    if (existing) {
      existing.balance += delta;
    } else {
      map.set(h.coinId, {
        coinId: h.coinId,
        name: h.name ?? h.coinId,
        symbol: h.symbol ?? '',
        balance: delta,
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
 * Usa Promise.allSettled para resiliencia parcial: si una coin falla (ej. 404),
 * el chart se renderiza con las coins restantes. Solo lanza ApiError si TODAS
 * las coins fallan, propagando el error más severo. Los ABORT se propagan siempre.
 *
 * @param {number} [days=30] - Período en días (1, 7, 30, 90, 365)
 * @param {AbortSignal|null} [signal] - Señal para abortar peticiones en vuelo
 * @param {string} [filterSource] - Filter by source (DEFAULT_SOURCE = "Caletas" = all)
 * @returns {Promise<{ time: string|number, value: number }[]>}
 * @throws {ApiError} si todas las coins fallan o si se produce un ABORT
 */
export const buildPortfolioHistorySeries = async (days = 30, signal = null, filterSource = DEFAULT_SOURCE) => {
  const rawHoldings = getHoldings();
  const isAllView = filterSource === DEFAULT_SOURCE;
  const holdings = isAllView
    ? rawHoldings
    : rawHoldings.filter(h => h.source === filterSource);

  const aggregated = aggregateForHistory(holdings);
  if (aggregated.length === 0) return [];

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

  // Obtener historial de precios para cada coin con resiliencia parcial.
  // Promise.allSettled garantiza que un 404 de una coin oscura no cancele el chart entero.
  const settled = await Promise.allSettled(
    aggregated.map(({ coinId }) => getCoinHistory(coinId, days, signal))
  );

  // Clasificación de prioridad de errores (mayor número = más severo)
  /** @type {Record<string, number>} */
  const ERROR_PRIORITY = {
    [ErrorType.ABORT]: 100,
    [ErrorType.RATE_LIMIT]: 50,
    [ErrorType.SERVER]: 40,
    [ErrorType.NETWORK]: 30,
    [ErrorType.PARSE]: 20,
    [ErrorType.NOT_FOUND]: 10,
    [ErrorType.UNKNOWN]: 5,
  };

  /** @type {ApiError[]} */
  const failures = [];

  /** @type {Array<{ time: string|number, value: number }[]>} */
  const histories = settled.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;

    const err = result.reason;

    // ABORT: propagar inmediatamente — es una cancelación intencional
    if (err instanceof ApiError && err.type === ErrorType.ABORT) throw err;

    failures.push(err instanceof ApiError ? err : new ApiError(ErrorType.UNKNOWN, String(err)));
    return []; // coin fallida contribuye con [] (no suma al portafolio)
  });

  // Si TODAS las coins fallaron, lanzar el error más severo
  if (failures.length === aggregated.length) {
    const worst = failures.reduce((prev, cur) => {
      const prevPri = ERROR_PRIORITY[prev.type] ?? 0;
      const curPri = ERROR_PRIORITY[cur.type] ?? 0;
      return curPri > prevPri ? cur : prev;
    });
    throw worst;
  }

  /** @type {Map<string, number>} */
  const portfolioByDate = new Map();

  aggregated.forEach(({ coinId }, i) => {
    // 1. Filtrar y ordenar transacciones de esta moneda cronológicamente
    const coinTx = holdings.filter(h => h.coinId === coinId);
    const sortedTx = [...coinTx].sort((a, b) => {
      const dateA = a.date || a.createdAt || '';
      const dateB = b.date || b.createdAt || '';
      return dateA.localeCompare(dateB);
    });

    // 2. Helper para obtener el balance acumulado de esta moneda a un tiempo dado
    const getBalanceAt = (timeKey) => {
      let accum = 0;
      for (const tx of sortedTx) {
        const txTime = tx.date || tx.createdAt || '';
        if (isIntraday) {
          const txTs = Math.floor(new Date(txTime).getTime() / 1000);
          if (txTs <= timeKey) accum += getBalanceDelta(tx);
        } else {
          const txDateStr = txTime.split('T')[0];
          if (txDateStr <= timeKey) accum += getBalanceDelta(tx);
        }
      }
      return accum;
    };

    // 3. Agrupar y deduplicar precios de CoinGecko por fecha/hora
    /** @type {Map<string|number, number>} */
    const priceByDate = new Map();
    for (const { time, value } of histories[i]) {
      let alignedTime = time;
      if (isIntraday) {
        const interval = days <= 1 ? 300 : 3600;
        alignedTime = Math.round(time / interval) * interval;
      }
      priceByDate.set(alignedTime, value);
    }

    // 4. Determinar la primera fecha/punto en el que la moneda tuvo balance > 0
    const sortedTimeKeys = [...priceByDate.keys()].sort((a, b) => 
      isIntraday ? Number(a) - Number(b) : String(a).localeCompare(String(b))
    );

    let firstActiveTimeKey = null;
    for (const tk of sortedTimeKeys) {
      if (getBalanceAt(tk) > 0) {
        firstActiveTimeKey = tk;
        break;
      }
    }

    // 5. Calcular el precio ponderado de compra del primer día para alineación
    let firstDayOverridePrice = null;
    if (firstActiveTimeKey !== null) {
      const targetDateStr = isIntraday
        ? new Date(Number(firstActiveTimeKey) * 1000).toISOString().split('T')[0]
        : String(firstActiveTimeKey);

      const dayBuyTxs = sortedTx.filter(tx => {
        const txTime = tx.date || tx.createdAt || '';
        const txDateStr = txTime.split('T')[0];
        return txDateStr === targetDateStr && getBalanceDelta(tx) > 0;
      });

      if (dayBuyTxs.length > 0) {
        const totalInvested = dayBuyTxs.reduce((sum, tx) => sum + (tx.balance ?? 0) * (tx.price ?? 0), 0);
        const totalQty = dayBuyTxs.reduce((sum, tx) => sum + (tx.balance ?? 0), 0);
        if (totalQty > 0) {
          firstDayOverridePrice = totalInvested / totalQty;
        }
      }
    }

    // 6. Sumar al valor total del portafolio por cada punto del tiempo
    for (const [timeKey, marketPrice] of priceByDate) {
      const currentBal = getBalanceAt(timeKey);
      if (currentBal <= 0) continue; // Si no tenía balance en este punto, no aporta valor

      let finalPrice = marketPrice;
      if (timeKey === firstActiveTimeKey && firstDayOverridePrice !== null) {
        finalPrice = firstDayOverridePrice;
      }

      portfolioByDate.set(timeKey, (portfolioByDate.get(timeKey) ?? 0) + currentBal * finalPrice);
    }
  });

  return [...portfolioByDate.entries()]
    .sort(([a], [b]) => isIntraday ? Number(a) - Number(b) : String(a).localeCompare(String(b)))
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
      pct: ((value ?? 0) / totalValue) * 100,
    }))
    .sort((a, b) => b.value - a.value);
};
