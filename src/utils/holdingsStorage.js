import { storage } from './storage.js';

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
