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
