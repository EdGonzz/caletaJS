// src/utils/transactionUtils.js
import { getHoldings, updateHoldingsBatch } from './holdingsStorage.js';
import { storage } from './storage.js';
import { getSource } from './sources.js';


/**
 * Retorna el cambio neto en balance que produce una transacción.
 * Positivo para entradas (buy, transfer_in), negativo para salidas (sell, transfer_out).
 * Sirve como regla centralizada de balance — todos los consumidores la usan (ver ADR-028).
 * @param {Object} tx - Transacción con { type, balance }
 * @returns {number}
 */
export const getBalanceDelta = (tx) => {
  const delta = tx.type === 'buy' || tx.type === 'transfer_in'
    ? (tx.balance ?? 0)
    : tx.type === 'sell' || tx.type === 'transfer_out'
      ? -(tx.balance ?? 0)
      : 0;

  return delta === 0 ? 0 : delta;
};

/**
 * Calcula el balance disponible en un exchange excluyendo una transacción específica.
 * Sirve como base para validaciones de oversell al editar transacciones.
 * @param {Object} tx - Transacción a excluir
 * @returns {number}
 */
export const getAvailableBalanceExcluding = (tx) => {
  if (!tx || !tx.coinId || !tx.source) return 0;
  return getNetBalance(tx.coinId, tx.source) - getBalanceDelta(tx);
};

/**
 * Balance disponible en un source excluyendo AMBAS piernas de una transferencia.
 * Útil para validar oversell al cambiar el source de una transferencia: la pierna
 * (transfer_in/transfer_out) que vive en el source nuevo también se va a mover,
 * por lo que no debe contar como balance disponible.
 * @param {string} coinId
 * @param {string} source
 * @param {string} transferId
 * @returns {number}
 */
export const getAvailableBalanceExcludingTransfer = (coinId, source, transferId) => {
  const holdings = getHoldings();
  const legsDelta = holdings.reduce((acc, tx) => {
    if (tx.coinId !== coinId || tx.transferId !== transferId || tx.source !== source) return acc;
    return acc + getBalanceDelta(tx);
  }, 0);
  return getNetBalance(coinId, source) - legsDelta;
};

/**
 * Devuelve las transacciones de un coinId, de más reciente a más antigua.
 * @param {string} coinId
 * @returns {Array<Object>}
 */
export const getTransactionsByCoin = (coinId) =>
  getHoldings()
    .filter((tx) => tx.coinId === coinId)
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      if (a.type === 'transfer_in' && b.type === 'transfer_out') return -1;
      if (a.type === 'transfer_out' && b.type === 'transfer_in') return 1;
      return 0;
    });

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
 * @returns {number|null} Precio promedio ponderado, o null si no hay entradas
 */
export const getAverageCostBasis = (coinId, source) => {
  const entries = getHoldings().filter((tx) => {
    if (tx.coinId !== coinId) return false;
    if (source && tx.source !== source) return false;
    return tx.type === 'buy' || tx.type === 'transfer_in';
  });

  if (entries.length === 0) return null;

  const totalCost = entries.reduce((sum, tx) => {
    const bal = Number(tx.balance);
    const px = Number(tx.price);
    return sum + (Number.isFinite(bal) ? bal : 0) * (Number.isFinite(px) ? px : 0);
  }, 0);
  const totalQty = entries.reduce((sum, tx) => {
    const bal = Number(tx.balance);
    return sum + (Number.isFinite(bal) ? bal : 0);
  }, 0);

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
 * Elimina transacciones por ID, con cascada para transferencias.
 * Usa una operación batch atómica (una sola escritura a localStorage).
 * Si la transacción tiene 'transferId', también elimina todas las entradas con ese transferId (ADR-027).
 * @param {string} txId
 * @returns {boolean}
 */
export const deleteTransaction = (txId) => {
  const holdings = getHoldings();
  const tx = holdings.find(h => h.id === txId);
  if (!tx) return false;

  const idsToRemove = new Set([txId]);

  // Cascade: si es parte de una transferencia, eliminar todas las entradas con el mismo transferId
  if (tx.transferId) {
    holdings.forEach(h => {
      if (h.transferId === tx.transferId) idsToRemove.add(h.id);
    });
  }

  const updated = holdings.filter(h => !idsToRemove.has(h.id));
  storage.set('caleta_user_holdings', updated);
  return true;
};

/**
 * Elimina prefijos 'Recibido desde X' o '[Recibido desde X]' de una cadena de notas.
 * @param {string} notes
 * @returns {string}
 */
export const stripTransferNotesPrefix = (notes) => {
  if (typeof notes !== 'string') return '';
  let clean = notes.trim();
  let prev;
  do {
    prev = clean;
    // 1. Bracketed: [Recibido desde ...]
    clean = clean.replace(/^\[Recibido desde [^\]\n]+\]\s*[-.:]?\s*/i, '');
    // 2. Unbracketed with separator (-, :, .)
    clean = clean.replace(/^Recibido desde\s+[^:.\-\n]+(?:\s*[:.-]\s*)/i, '');
    // 3. Just "Recibido desde ..." with no subsequent notes
    clean = clean.replace(/^Recibido desde(?:\s+[^\n]+)?$/i, '');
  } while (clean !== prev && clean.length > 0);

  return clean.trim();
};

/**
 * Actualiza una transacción por ID.
 * Si es una transferencia (tiene transferId), recalcula ambas piernas (transfer_out y transfer_in)
 * atómicamente en un solo batch.
 * @param {string} txId - ID de la transacción a actualizar
 * @param {Object} updates - Campos canónicos de actualización
 * @returns {boolean} true si se actualizó, false si no se encontró el txId
 */
export const updateTransaction = (txId, updates = {}) => {
  const holdings = getHoldings();
  const tx = holdings.find(h => h.id === txId);
  if (!tx) return false;

  // Caso 1: Transacción individual (sin transferId)
  if (!tx.transferId) {
    const singleUpdates = { ...updates };
    if (singleUpdates.qty !== undefined) {
      if (singleUpdates.balance === undefined) {
        singleUpdates.balance = singleUpdates.qty;
      }
      delete singleUpdates.qty;
    }

    if (singleUpdates.balance !== undefined) {
      const parsedBalance = Number(singleUpdates.balance);
      if (!Number.isFinite(parsedBalance) || parsedBalance <= 0) return false;
      singleUpdates.balance = parsedBalance;
    }

    if (singleUpdates.price !== undefined) {
      const parsedPrice = Number(singleUpdates.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return false;
      singleUpdates.price = parsedPrice;
    }

    updateHoldingsBatch([{ id: txId, updates: singleUpdates }]);
    return true;
  }

  // Caso 2: Transferencia (ambas piernas enlazadas por transferId)
  const transferLegs = holdings.filter(h => h.transferId === tx.transferId);
  const outTx = transferLegs.find(h => h.type === 'transfer_out') || (tx.type === 'transfer_out' ? tx : null);
  const inTx = transferLegs.find(h => h.type === 'transfer_in') || (tx.type === 'transfer_in' ? tx : null);

  const rawQty = updates.qty !== undefined
    ? updates.qty
    : (updates.balance !== undefined ? updates.balance : (outTx?.balance ?? tx.balance ?? 0));
  const qty = Number(rawQty);

  const rawFee = updates.networkFee !== undefined
    ? updates.networkFee
    : (outTx?.networkFee ?? inTx?.networkFee ?? 0);
  const networkFee = Number(rawFee);

  // Validación defensiva de rangos (ADR-029)
  if (!Number.isFinite(qty) || qty <= 0) return false;
  if (!Number.isFinite(networkFee) || networkFee < 0 || networkFee >= qty) return false;

  const date = updates.date !== undefined ? updates.date : (outTx?.date ?? inTx?.date ?? tx.date);

  const rawPrice = updates.price !== undefined
    ? updates.price
    : (outTx?.price ?? inTx?.price ?? tx.price ?? 0);
  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price < 0) return false;

  const source = updates.source !== undefined
    ? updates.source
    : (outTx?.source ?? (tx.type === 'transfer_out' ? tx.source : ''));

  const destSource = updates.destSource !== undefined
    ? updates.destSource
    : (inTx?.source ?? (tx.type === 'transfer_in' ? tx.source : ''));

  // Determinar notas del usuario haciendo strip del prefijo existente
  const rawNotesInput = updates.notes !== undefined
    ? updates.notes
    : (outTx?.notes || inTx?.notes || tx.notes || '');
  const cleanNotes = stripTransferNotesPrefix(rawNotesInput);

  const outNotes = cleanNotes;
  const inNotes = cleanNotes
    ? `[Recibido desde ${source}] ${cleanNotes}`
    : `Recibido desde ${source}`;

  const commonUpdates = {};
  if (updates.coinId !== undefined) commonUpdates.coinId = updates.coinId;
  if (updates.name !== undefined) commonUpdates.name = updates.name;
  if (updates.symbol !== undefined) commonUpdates.symbol = updates.symbol;
  if (updates.logoUrl !== undefined) commonUpdates.logoUrl = updates.logoUrl;

  const batch = [];
  if (outTx) {
    batch.push({
      id: outTx.id,
      updates: {
        ...commonUpdates,
        balance: qty,
        source,
        date,
        price,
        networkFee,
        notes: outNotes,
        ...(updates.sourceImage !== undefined && { sourceImage: updates.sourceImage }),
        ...(updates.sourceIcon !== undefined && { sourceIcon: updates.sourceIcon }),
        ...(updates.fees !== undefined && { fees: updates.fees }),
      },
    });
  }

  if (inTx) {
    batch.push({
      id: inTx.id,
      updates: {
        ...commonUpdates,
        balance: qty - networkFee,
        source: destSource,
        date,
        price,
        networkFee,
        notes: inNotes,
        ...(updates.destSourceImage !== undefined && { sourceImage: updates.destSourceImage }),
        ...(updates.destSourceIcon !== undefined && { sourceIcon: updates.destSourceIcon }),
        ...(updates.fees !== undefined && { fees: updates.fees }),
      },
    });
  }

  updateHoldingsBatch(batch);
  return true;
};

