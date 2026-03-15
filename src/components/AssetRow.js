/**
 * @typedef {Object} Asset
 * @property {string} id          - Unique identifier (e.g. "btc")
 * @property {string} name        - Full name (e.g. "Bitcoin")
 * @property {string} symbol      - Ticker (e.g. "BTC")
 * @property {string} logoUrl     - URL to the asset's logo image
 * @property {string} source      - Custody type label (e.g. "Cold Storage")
 * @property {string} sourceIcon  - Material Symbol icon name for the source
 * @property {number} price       - Current USD price
 * @property {number} change24h   - 24-hour percentage change (signed)
 * @property {number} balance     - Amount held
 * @property {number} value       - Total USD value (price × balance)
 * @property {string} sparkPath   - SVG path `d` attribute for the 7-day sparkline
 * @property {string} sparkColor  - Stroke color for the sparkline (#hex)
 * @property {boolean} isFlat     - True for stablecoins — renders a flat dashed line
 */

import { formatUsd, formatBalance } from "../utils/formatters";

/**
 * Returns the markup for the 24h change badge.
 * @param {number} change
 * @returns {string}
 */
const changeBadge = (change) => {
  const absChange = Math.abs(change).toFixed(2);

  if (Math.abs(change) < 0.05) {
    return `
      <div class="inline-flex items-center gap-1 rounded bg-slate-700/30 px-2 py-0.5 text-xs font-bold text-slate-400">
        <svg class="h-4 w-4" aria-hidden="true">
          <use href="${sprite}#minus"></use>
        </svg>
        ${absChange}%
      </div>`;
  }

  if (change > 0) {
    return `
      <div class="text-primary bg-primary/10 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold">
        <svg class="h-4 w-4" aria-hidden="true">
          <use href="${sprite}#arrow-upward"></use>
        </svg>
        ${absChange}%
      </div>`;
  }

  return `
    <div class="text-accent-red bg-accent-red/10 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold">
      <svg class="h-4 w-4" aria-hidden="true">
        <use href="${sprite}#arrow-downward"></use>
      </svg>
      ${absChange}%
    </div>`;
};

/**
 * Builds the 7-day sparkline SVG.
 * @param {Asset} asset
 * @returns {string}
 */
const sparkline = ({ isFlat, sparkPath, sparkColor, name }) => {
  if (isFlat) {
    return `
      <svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 30" aria-label="${name} 7-day price chart — stable">
        <line x1="0" x2="100" y1="15" y2="15" stroke="#64748b" stroke-dasharray="4 4" stroke-width="2"></line>
      </svg>`;
  }
  return `
    <svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 30" aria-label="${name} 7-day price chart">
      <path d="${sparkPath}" fill="none" stroke="${sparkColor}" stroke-width="2"></path>
    </svg>`;
};

/**
 * AssetRow — renders a single <tr> for the Holdings table.
 * @param {Asset} asset
 * @returns {string}
 */

import sprite from "../assets/sprite.svg";

const AssetRow = (asset) => {
  const {
    id,
    name,
    symbol,
    logoUrl,
    source,
    sourceIcon,
    price,
    change24h,
    balance,
    value,
  } = asset;

  return `
    <tr class="group transition-colors hover:bg-white/5" id="asset-row-${id}">
      <!-- Asset -->
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <img
            src="${logoUrl}"
            alt="${name} logo"
            class="h-8 w-8 rounded-full object-cover"
            loading="lazy"
          />
          <div>
            <div class="font-bold text-white">${name}</div>
            <div class="text-xs text-slate-500">${symbol}</div>
          </div>
        </div>
      </td>

      <!-- Source -->
      <td class="px-6 py-4">
        <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-700/50 px-2.5 py-1 text-xs font-medium text-slate-300">
          <svg class="h-4 w-4" aria-hidden="true">
            <use href="${sprite}#${sourceIcon}"></use>
          </svg>
          ${source}
        </span>
      </td>

      <!-- Price -->
      <td class="px-6 py-4 text-right font-mono text-slate-300" id="price-${id}">
        ${formatUsd(price)}
      </td>

      <!-- 24h % -->
      <td class="px-6 py-4 text-right" id="change-${id}">
        ${changeBadge(change24h)}
      </td>

      <!-- Balance -->
      <td class="px-6 py-4 text-right">
        <div class="font-mono text-white">${formatBalance(balance)}</div>
        <div class="text-xs text-slate-500">${symbol}</div>
      </td>

      <!-- Value -->
      <td class="px-6 py-4 text-right">
        <div class="font-mono font-bold text-white" id="value-${id}">${formatUsd(value)}</div>
      </td>

      <!-- Last 7d sparkline -->
      <td class="w-32 px-6 py-4 text-center">
        <div class="mx-auto h-8 w-24">
          ${sparkline(asset)}
        </div>
      </td>

      <!-- Action -->
      <td class="px-6 py-4 text-right">
        <button
          class="rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="More actions for ${name}"
        >
          <svg class="h-4 w-4" aria-hidden="true">
            <use href="${sprite}#dots-vertical"></use>
          </svg>
        </button>
      </td>
    </tr>`;
};

export default AssetRow;
