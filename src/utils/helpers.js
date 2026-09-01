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

/**
 * Sanitizes numeric input from an input element, allowing only numbers and decimal separators.
 * Handles both US (1,234.56) and European (1.234,56) number formats.
 * @param {HTMLInputElement} inputEl - The input element to sanitize
 * @returns {string} The sanitized value
 */
export const sanitizeNumericInput = (inputEl) => {
  let val = inputEl.value;
  const start = inputEl.selectionStart;
  const end = inputEl.selectionEnd;

  // Allow only numbers and decimal/thousand separators
  val = val.replace(/[^0-9.,]/g, "");

  // Resolve ambiguity if both commas and periods are used (thousands vs decimal)
  if (val.includes(",") && val.includes(".")) {
    const firstComma = val.indexOf(",");
    const firstPoint = val.indexOf(".");
    if (firstComma < firstPoint) {
      // US format (1,234.56): comma is thousands, remove it
      val = val.replace(/,/g, "");
    } else {
      // European format (1.234,56): period is thousands, remove it
      val = val.replace(/\./g, "");
    }
  }

  // Normalize remaining commas to periods (as decimal separator)
  val = val.replace(/,/g, ".");

  // Keep only the first decimal point and remove subsequent duplicates
  const firstPointIndex = val.indexOf(".");
  if (firstPointIndex !== -1) {
    val = val.substring(0, firstPointIndex + 1) +
      val.substring(firstPointIndex + 1).replace(/\./g, "");
  }

  inputEl.value = val;

  // Restore cursor position to prevent jumping to end while editing
  if (inputEl === document.activeElement && start !== null && end !== null) {
    inputEl.setSelectionRange(start, end);
  }

  return val;
};


