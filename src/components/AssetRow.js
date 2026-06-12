/**
 * @typedef {Object} Asset
 * @property {string}   id          - Unique identifier (e.g. "btc")
 * @property {string}   name        - Full name (e.g. "Bitcoin")
 * @property {string}   symbol      - Ticker (e.g. "BTC")
 * @property {string}   logoUrl     - URL to the asset's logo image
 * @property {string|null} source   - Exchange name. Null in all-view (use `sources` instead).
 * @property {string[]} sources     - All exchanges holding this asset (populated in all-view).
 * @property {string}   sourceIcon  - Material Symbol icon name for the source
 * @property {number}   price       - Current USD price
 * @property {number}   change24h   - 24-hour percentage change (signed)
 * @property {number}   balance     - Amount held
 * @property {number}   value       - Total USD value (price × balance)
 * @property {string}   sparkPath   - SVG path `d` attribute for the 7-day sparkline
 * @property {string}   sparkColor  - Stroke color for the sparkline (#hex)
 * @property {boolean}  isFlat      - True for stablecoin — renders a flat dashed line
 */

import sprite from "../assets/sprite.svg";
import { escapeHTML } from "../utils/helpers";
import { formatUsd, formatBalance, formatPercent } from "../utils/formatters";

/**
 * Returns the markup for the 24h change badge.
 * Uses color + icon + aria-label to differentiate positive/negative/neutral states.
 * Colors chosen to meet WCAG AA 4.5:1 contrast ratio on dark backgrounds.
 * @param {number} change
 * @returns {string}
 */
const changeBadge = (change) => {
  const absChange = Math.abs(change).toFixed(2);

  if (Math.abs(change) < 0.05) {
    return `
      <div class="inline-flex items-center gap-1 rounded bg-slate-700/30 px-2 py-0.5 text-xs font-bold text-slate-400 border border-slate-600/30" aria-label="Sin cambio: ${absChange}%" role="status">
        <svg class="h-4 w-4" aria-hidden="true">
          <use href="${sprite}#minus"></use>
        </svg>
        ${absChange}%
      </div>`;
  }

  if (change > 0) {
    return `
      <div class="text-primary-glow bg-primary-glow/10 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold border border-primary-glow/20" aria-label="Subió ${absChange}%" role="status">
        <svg class="h-4 w-4" aria-hidden="true">
          <use href="${sprite}#arrow-upward"></use>
        </svg>
        ${absChange}%
      </div>`;
  }

  return `
    <div class="text-red-400 bg-red-400/10 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold border border-red-400/20" aria-label="Bajó ${absChange}%" role="status">
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
  const safeName = escapeHTML(name);
  if (isFlat) {
    return `
      <svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 30" aria-label="${safeName} 7-day price chart — stable">
        <line x1="0" x2="100" y1="15" y2="15" stroke="#64748b" stroke-dasharray="4 4" stroke-width="2"></line>
      </svg>`;
  }
  return `
    <svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 30" aria-label="${safeName} 7-day price chart">
      <path d="${escapeHTML(sparkPath)}" fill="none" stroke="${sparkColor}" stroke-width="2"></path>
    </svg>`;
};

/**
 * Renders the Source cell content based on the current view mode.
 *
 * - All-view (asset.sources populated): shows up to 2 exchange badges + overflow count.
 * - Exchange-view (asset.source populated): shows the single exchange badge.
 *
 * @param {Asset} asset
 * @returns {string}
 */
const renderSource = (asset) => {
  const { source, sourceImage, sources = [], sourceIcon } = asset;

  // Exchange-view: single source badge
  if (source) {
    const iconHtml = sourceImage
      ? `<img src="${escapeHTML(sourceImage)}" alt="${escapeHTML(source)}" class="h-4 w-4 rounded-sm object-contain" width="16" height="16" loading="lazy">`
      : `<svg class="h-4 w-4" aria-hidden="true"><use href="${sprite}#${escapeHTML(sourceIcon)}"></use></svg>`;

    return `
      <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-700/50 px-2.5 py-1 text-xs font-medium text-slate-300">
        ${iconHtml}
        ${escapeHTML(source)}
      </span>`;
  }

  // All-view: show first exchange + overflow badge if needed
  if (sources.length === 0) {
    return `<span class="text-xs text-slate-500 italic">—</span>`;
  }

  const visible = sources.slice(0, 2);
  const overflow = sources.length - visible.length;

  const badges = visible.map(s => {
    const iconHtml = s.image
      ? `<img src="${escapeHTML(s.image)}" alt="${escapeHTML(s.name)}" class="h-3.5 w-3.5 rounded-sm object-contain" width="14" height="14" loading="lazy">`
      : `<svg class="h-3.5 w-3.5" aria-hidden="true"><use href="${sprite}#wallet"></use></svg>`;

    return `
      <span class="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-300">
        ${iconHtml}
        ${escapeHTML(s.name)}
      </span>`;
  }).join('');

  const overflowBadge = overflow > 0
    ? `<span class="inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-400" title="${escapeHTML(sources.slice(2).map(s => s.name).join(', '))}">+${overflow}</span>`
    : '';

  return `<div class="flex flex-wrap gap-1">${badges}${overflowBadge}</div>`;
};

/**
 * AssetRow — renders a single <tr> for the Holdings table.
 * @param {Asset} asset
 * @returns {string}
 */

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

  const safeId = escapeHTML(id);
  const safeName = escapeHTML(name);
  const safeSymbol = escapeHTML(symbol);
  const safeLogoUrl = escapeHTML(logoUrl);

  return `
    <tr class="group transition-colors hover:bg-white/5" id="asset-row-${safeId}">
      <!-- Asset -->
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <img
            src="${safeLogoUrl}"
            alt="${safeName} logo"
            class="h-8 w-8 rounded-full object-cover"
            width="32"
            height="32"
            loading="lazy"
          />
          <div>
            <div class="font-bold text-white">${safeName}</div>
            <div class="text-xs text-slate-500">${safeSymbol}</div>
          </div>
        </div>
      </td>

      <!-- Source -->
      <td class="px-6 py-4">
        ${renderSource(asset)}
      </td>

      <!-- Price -->
      <td class="px-6 py-4 text-right font-mono text-slate-300" id="price-${safeId}">
        ${formatUsd(price)}
      </td>

      <!-- 24h % -->
      <td class="px-6 py-4 text-right" id="change-${safeId}">
        ${changeBadge(change24h)}
      </td>

      <!-- Balance -->
      <td class="px-6 py-4 text-right">
        <div class="font-mono text-white">${formatBalance(balance)}</div>
        <div class="text-xs text-slate-500">${safeSymbol}</div>
      </td>

      <!-- Value -->
      <td class="px-6 py-4 text-right">
        <div class="font-mono font-bold text-white" id="value-${safeId}">${formatUsd(value)}</div>
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
          class="asset-action-btn rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Acciones para ${safeName}"
          data-state="normal"
          data-asset-id="${safeId}"
          data-asset-name="${safeName}"
        >
          <svg class="h-4 w-4" aria-hidden="true">
            <use href="${sprite}#dots-vertical"></use>
          </svg>
        </button>
      </td>
    </tr>`;
};

export default AssetRow;
