/**
 * Formats a number as USD currency.
 *
 * @param {number} n - The number to format
 * @returns {string} Formatted currency string
 */
export const formatUsd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/**
 * Returns the current local date and time formatted for an HTML <input type="datetime-local">.
 * Format: YYYY-MM-DDThh:mm
 *
 * @returns {string}
 */
export const now = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Formats a balance number — keeps trailing decimals meaningful.
 * @param {number} n
 * @returns {string}
 */
export const formatBalance = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });