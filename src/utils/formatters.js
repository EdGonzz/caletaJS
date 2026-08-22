/**
 * Formats a number as USD currency.
 *
 * @param {number} n - The number to format
 * @returns {string} Formatted currency string
 */
export const formatUsd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

/**
 * Formats a number as USD currency with up to 8 decimals to preserve small fractions.
 *
 * @param {number} n - The number to format
 * @returns {string} Formatted currency string
 */
export const formatPreciseUsd = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 8 }).format(n);

/**
 * Formats a number as a generic string with variable decimals.
 * 
 * @param {number} n 
 * @param {number} [decimals=8] 
 * @returns {string}
 */
export const formatNumber = (n, decimals = 8) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n);

/**
 * Formatea un precio de criptomoneda con decimales dinámicos según su valor.
 * Útil para memecoins y tokens de bajo precio donde formatUsd ($0.00) es insuficiente.
 * @param {number} n - El precio a formatear
 * @returns {string}
 */
export const formatCryptoPrice = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  if (n >= 0.01) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);
  if (n >= 0.0001) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 6 }).format(n);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 8 }).format(n);
};

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
 * Formats elapsed seconds into a human-friendly relative time string (English).
 * Uses native `Intl.RelativeTimeFormat` for i18n-safe output.
 *
 * @param {number} elapsedSeconds - Seconds elapsed since the last event.
 * @returns {string} Relative string (e.g. "just now", "2 minutes ago").
 */
export const formatRelativeTime = (elapsedSeconds) => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'long' });

  if (elapsedSeconds < 5) return 'just now';
  if (elapsedSeconds < 60) return rtf.format(-Math.floor(elapsedSeconds), 'second');

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');

  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
};

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