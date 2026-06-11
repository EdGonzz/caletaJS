import { storage } from './storage.js';

export const DEFAULT_SOURCE = 'Caletas';
const SOURCE_KEY = 'caleta_user_sources';

/**
 * Gets all user-defined sources/exchanges.
 * @returns {Array}
 */
export const getSource = () => storage.get(SOURCE_KEY, [DEFAULT_SOURCE]); // 

/**
 * Adds a new source if it doesn't already exist.
 * @param {Object|string} source - The source to add.
 * @returns {Array}
 */
export const addSource = (source) => {
  const sources = getSource();
  const sourceName = typeof source === 'string' ? source : source.name;

  // Check if it already exists (handling both strings and objects)
  const exists = sources.some(s => {
    const name = typeof s === 'string' ? s : s.name;
    return name === sourceName;
  });

  if (!exists) {
    sources.push(source);
    storage.set(SOURCE_KEY, sources);
  }

  return sources;
};
