/**
 * Generic wrapper for localStorage with error handling.
 */
export const storage = {
  /**
   * Reads and parses a JSON value from localStorage.
   * @param {string} key - The key to read.
   * @param {*} fallback - The value to return if key is missing or invalid.
   * @returns {*}
   */
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return fallback;
    }
  },

  /**
   * Stringifies and saves a value to localStorage.
   * @param {string} key - The key to save.
   * @param {*} value - The value to save.
   */
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
    }
  }
};
