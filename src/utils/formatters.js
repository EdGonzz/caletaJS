/**
 * Formats a number as USD currency.
 *
 * @param {number} n - The number to format
 * @returns {string} Formatted currency string
 */
export const formatUsd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/**
 * Formats a balance number — keeps trailing decimals meaningful.
 * @param {number} n
 * @returns {string}
 */
export const formatBalance = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });

/**
 * Formats a number as a signed percentage string.
 * Always shows sign (+/-), always shows 2 decimal places.
 *
 * @param {number} n - The percentage value (e.g. 12.5 for 12.5%)
 * @returns {string} Formatted string (e.g. "+12.50%")
 */
export const formatPercent = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

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