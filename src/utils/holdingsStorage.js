import { storage } from './storage.js';
import { DEFAULT_SOURCE } from './sources.js';

const HOLDINGS_KEY = 'caleta_user_holdings';

/**
 * Gets all stored holdings/transactions.
 * @returns {Array}
 */
export const getHoldings = () => storage.get(HOLDINGS_KEY, []);

/**
 * Adds a new holding record with a unique ID.
 * @param {Object} holding - The holding data to save.
 * @returns {Array} The updated holdings list.
 */
export const addHolding = (holding) => {
  const holdings = getHoldings();
  const newHolding = {
    ...holding,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  const updated = [...holdings, newHolding];
  storage.set(HOLDINGS_KEY, updated);
  return updated;
};

/**
 * Updates an existing holding record by ID.
 * @param {string} id - The unique ID of the record.
 * @param {Object} updates - The fields to update.
 * @returns {Array} The updated holdings list.
 */
export const updateHolding = (id, updates) => {
  const holdings = getHoldings();
  const updated = holdings.map(h =>
    h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
  );

  storage.set(HOLDINGS_KEY, updated);
  return updated;
};

/**
 * Removes a holding record by ID.
 * @param {string} id - The unique ID of the record.
 * @returns {Array} The updated holdings list.
 */
export const removeHolding = (id) => {
  const holdings = getHoldings();
  const updated = holdings.filter(h => h.id !== id);

  storage.set(HOLDINGS_KEY, updated);
  return updated;
};

/**
 * Removes all holding records associated with a specific source.
 * @param {string} sourceName - The name of the source/exchange.
 * @returns {Array} The updated holdings list.
 */
export const deleteHoldingsBySource = (sourceName) => {
  const holdings = getHoldings();
  const updated = holdings.filter(h => h.source !== sourceName);

  storage.set(HOLDINGS_KEY, updated);
  return updated;
};

/**
 * Removes all holding records associated with a specific coin ID, optionally filtered by source.
 * @param {string} coinId - The unique ID of the coin (e.g., "bitcoin").
 * @param {string|null} [sourceFilter] - The name of the source to filter by.
 * @returns {Array} The updated holdings list.
 */
export const deleteHoldingsByCoin = (coinId, sourceFilter = null) => {
  const holdings = getHoldings();
  const updated = holdings.filter(h => {
    const matchCoin = h.coinId === coinId;
    const matchSource = sourceFilter && sourceFilter !== DEFAULT_SOURCE ? h.source === sourceFilter : true;
    return !(matchCoin && matchSource);
  });

  storage.set(HOLDINGS_KEY, updated);
  return updated;
};


