// src/utils/transactionUtils.js
import { getHoldings, removeHolding } from './holdingsStorage.js';
import { getSource } from './sources.js';


/**
 * Retorna el cambio neto en balance que produce una transacción.
 * Positivo para entradas (buy, transfer_in), negativo para salidas (sell, transfer_out).
 * Sirve como regla centralizada de balance — todos los consumidores la usan (ver ADR-028).
 * @param {Object} tx - Transacción con { type, balance }
 * @returns {number}
 */
export const getBalanceDelta = (tx) => {
  if (tx.type === 'buy' || tx.type === 'transfer_in') return tx.balance ?? 0;
  if (tx.type === 'sell' || tx.type === 'transfer_out') return -(tx.balance ?? 0);
  return 0;
};

/**
 * Devuelve las transacciones de un coinId, de más reciente a más antigua.
 * @param {string} coinId
 * @returns {Array<Object>}
 */
export const getTransactionsByCoin = (coinId) =>
  getHoldings()
    .filter((tx) => tx.coinId === coinId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

/**
 * Calcula el balance neto de una moneda, filtrable por source.
 * Usa getBalanceDelta() como regla centralizada de balance (ADR-028).
 * @param {string} coinId
 * @param {string} [source] - Opcional, filtra por caleta específica
 * @returns {number}
 */
export const getNetBalance = (coinId, source) =>
  getHoldings().reduce((acc, tx) => {
    if (tx.coinId !== coinId) return acc;
    if (source && tx.source !== source) return acc;
    return acc + getBalanceDelta(tx);
  }, 0);

/**
 * Devuelve las monedas con balance neto > 0, agrupadas y con metadata.
 * Sirve para popular el PortfolioPicker. Filtrable por source.
 * @param {string} [source] - Opcional, filtra por caleta específica
 * @returns {Array<{ coinId: string, name: string, symbol: string, logoUrl: string, netBalance: number, sources: Array<{name: string, image: string, balance: number}> }>}
 */
export const getPortfolioCoins = (source) => {
  const map = new Map();
  const allSources = getSource();

  for (const tx of getHoldings()) {
    if (source && tx.source !== source) continue;
    if (!map.has(tx.coinId)) {
      map.set(tx.coinId, {
        coinId: tx.coinId,
        name: tx.name,
        symbol: tx.symbol,
        logoUrl: tx.logoUrl,
        netBalance: 0,
        sources: [],
      });
    }
    const entry = map.get(tx.coinId);
    entry.netBalance += getBalanceDelta(tx);

    // Track per-source balance
    const srcIndex = entry.sources.findIndex(s => s.name === tx.source);
    if (srcIndex >= 0) {
      entry.sources[srcIndex].balance += getBalanceDelta(tx);
    } else {
      const foundSource = allSources.find(s => (typeof s === 'string' ? s : s.name) === tx.source);
      const sourceImage = (foundSource && typeof foundSource !== 'string' ? foundSource.image : '') || '';
      entry.sources.push({ name: tx.source, image: sourceImage, balance: getBalanceDelta(tx) });
    }
  }

  // Filter out sources with 0 balance and coins with net balance <= 0
  return Array.from(map.values())
    .filter((c) => c.netBalance > 0)
    .map(c => ({
      ...c,
      sources: c.sources.filter(s => s.balance > 0),
    }));
};

/**
 * Calcula el precio promedio ponderado de compra de una moneda, filtrable por source.
 * Considera solo transacciones de tipo buy y transfer_in (entradas que aumentan el balance).
 * Si no se especifica source, busca en todas las fuentes.
 * Sirve para pre-fill el precio en Transfer (cost basis heredado).
 * @param {string} coinId
 * @param {string} [source] - Opcional, filtra por caleta específica
 * @returns {number} Precio promedio ponderado, o 0 si no hay entradas
 */
export const getAverageCostBasis = (coinId, source) => {
  const entries = getHoldings().filter((tx) => {
    if (tx.coinId !== coinId) return false;
    if (source && tx.source !== source) return false;
    return tx.type === 'buy' || tx.type === 'transfer_in';
  });

  if (entries.length === 0) return 0;

  const totalCost = entries.reduce((sum, tx) => sum + (tx.balance ?? 0) * (tx.price ?? 0), 0);
  const totalQty = entries.reduce((sum, tx) => sum + (tx.balance ?? 0), 0);

  return totalQty > 0 ? totalCost / totalQty : 0;
};

/**
 * Devuelve la distribución de una moneda por exchange.
 * @param {string} coinId
 * @returns {Array<{ source: string, sourceImage: string, balance: number }>}
 */
export const getCoinDistribution = (coinId) => {
  const map = new Map();

  for (const tx of getHoldings()) {
    if (tx.coinId !== coinId) continue;
    const delta = getBalanceDelta(tx);
    if (delta === 0) continue;

    if (!map.has(tx.source)) {
      map.set(tx.source, { source: tx.source, sourceImage: tx.sourceImage || tx.logoUrl || '', balance: 0 });
    }
    map.get(tx.source).balance += delta;
  }

  return Array.from(map.values()).filter(s => s.balance > 0);
};

/**
 * Elimina una transacción por ID, con cascada para transferencias.
 * Si la transacción tiene 'transferId', también elimina la entrada emparejada (ADR-027).
 * @param {string} txId
 * @returns {boolean}
 */
export const deleteTransaction = (txId) => {
  const holdings = getHoldings();
  const tx = holdings.find(h => h.id === txId);
  if (!tx) return false;

  let idsToRemove = [txId];

  // Cascade: si es parte de una transferencia, eliminar la pareja
  if (tx.transferId) {
    const paired = holdings.find(
      h => h.transferId === tx.transferId && h.id !== txId
    );
    if (paired) idsToRemove.push(paired.id);
  }

  idsToRemove.forEach(id => removeHolding(id));
  return true;
};
