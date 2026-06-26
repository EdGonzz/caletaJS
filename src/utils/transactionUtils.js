// src/utils/transactionUtils.js
import { getHoldings, removeHolding } from './holdingsStorage.js';

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
 * @returns {Array<{ coinId: string, name: string, symbol: string, logoUrl: string, netBalance: number }>}
 */
export const getPortfolioCoins = (source) => {
  const map = new Map();

  for (const tx of getHoldings()) {
    if (source && tx.source !== source) continue;
    if (!map.has(tx.coinId)) {
      map.set(tx.coinId, {
        coinId: tx.coinId,
        name: tx.name,
        symbol: tx.symbol,
        logoUrl: tx.logoUrl,
        netBalance: 0,
      });
    }
    map.get(tx.coinId).netBalance += getBalanceDelta(tx);
  }

  return Array.from(map.values()).filter((c) => c.netBalance > 0);
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
