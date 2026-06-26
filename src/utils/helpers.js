export const debounce = (func, delay) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Escapes special characters for HTML to prevent XSS.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export const escapeHTML = (str) => {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
};

/** @param {number} n @returns {string} */
export const formatCurrency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

/** @param {number} n @param {number} [decimals=8] @returns {string} */
export const formatNumber = (n, decimals = 8) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n);
