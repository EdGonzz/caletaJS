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
/** Caracteres que rompen atributos HTML y abren vectores XSS. */
const UNSAFE_NAME_RE = /[&<>"'`]/;

export const addSource = (source) => {
  const sources = getSource();
  const sourceName = typeof source === 'string' ? source : source.name;

  if (UNSAFE_NAME_RE.test(sourceName)) {
    throw new Error(`[addSource] El nombre "${sourceName}" contiene caracteres no permitidos (& < > " ' \`).`);
  }

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

/**
 * Removes a source by name.
 * @param {string} sourceName - The name of the source to delete.
 * @returns {Array} The updated sources list.
 */
export const deleteSource = (sourceName) => {
  if (sourceName === DEFAULT_SOURCE) {
    throw new Error(`[deleteSource] No se puede eliminar la fuente predeterminada "${DEFAULT_SOURCE}".`);
  }

  const sources = getSource();
  const updated = sources.filter(s => {
    const name = typeof s === 'string' ? s : s.name;
    return name !== sourceName;
  });
  storage.set(SOURCE_KEY, updated);
  return updated;
};

