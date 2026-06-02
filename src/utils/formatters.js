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
 * Formatea segundos transcurridos a un string relativo amigable en español.
 * Utiliza `Intl.RelativeTimeFormat` para internacionalización nativa.
 *
 * @param {number} elapsedSeconds - Segundos transcurridos desde el último evento.
 * @returns {string} Texto relativo (ej. "ahora mismo", "hace 2 minutos").
 */
export const formatRelativeTime = (elapsedSeconds) => {
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto', style: 'long' });

  if (elapsedSeconds < 5) return 'ahora mismo';
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