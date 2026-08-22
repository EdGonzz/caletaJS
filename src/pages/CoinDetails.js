// src/pages/CoinDetails.js
import { escapeHTML } from '../utils/helpers.js';
import { formatUsd, formatNumber, formatCryptoPrice } from '../utils/formatters.js';
import { getTransactionsByCoin, getNetBalance, getBalanceDelta, deleteTransaction, getCoinDistribution } from '../utils/transactionUtils.js';
import { getHoldings } from '../utils/holdingsStorage.js';
import ConfirmDeleteModal, { openConfirmDeleteModal, initConfirmDeleteModal, cleanupConfirmDeleteModal } from '../components/ConfirmDeleteModal.js';
import sprite from '../assets/sprite.svg';
import { apiFetch, ApiError, ErrorType } from '../utils/errors.js';

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

/**
 * @param {{ id?: string }} params
 * @returns {string}
 */
const CoinDetails = (params = {}) => {
  const coinId = escapeHTML(params.id ?? '');
  return `
    <main id="coin-details-root" class="min-h-screen" aria-label="Detalle de moneda">

      <!-- ── Hero Section ── -->
      <div class="coin-details-hero relative overflow-hidden">
        <!-- Ambient glow de fondo -->
        <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div class="coin-hero-glow"></div>
        </div>

        <div class="relative z-10 max-w-5xl mx-auto px-6 pt-6 pb-8">

          <!-- Back link -->
          <a href="#/" class="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-8 text-sm font-medium group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md" aria-label="Volver al portafolio">
            <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" aria-hidden="true">
              <use href="${sprite}#arrow-left"></use>
            </svg>
            Volver al portafolio
          </a>

          <!-- Coin Header -->
          <section id="coin-header" class="flex items-center gap-5" aria-live="polite">
            <!-- Logo con skeleton -->
            <div id="coin-logo-wrapper" class="relative shrink-0">
              <div class="w-12 h-12 rounded-full skeleton-shimmer flex items-center justify-center" aria-hidden="true">
                <span class="text-slate-500 text-xs">…</span>
              </div>
            </div>

            <!-- Name + Symbol -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 flex-wrap">
                <h1 id="coin-name" class="text-3xl font-bold text-white font-display tracking-tight">Cargando…</h1>
                <span id="coin-symbol" class="coin-symbol-badge"></span>
              </div>
              <p id="coin-rank" class="text-xs text-slate-500 mt-1"></p>
            </div>

            <!-- Price -->
            <div class="text-right shrink-0">
              <p id="coin-price" class="text-2xl font-bold text-white font-display tabular-nums">—</p>
              <p id="coin-change" class="text-sm font-semibold mt-1">24h —</p>
            </div>
          </section>
        </div>
      </div>

      <!-- ── Content ── -->
      <div class="max-w-5xl mx-auto px-6 py-8 space-y-8">

        <!-- Stats Grid -->
        <section aria-label="Estadísticas del activo">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <article class="coin-stat-card group" aria-label="Balance total">
              <div class="coin-stat-icon coin-stat-icon--neutral" aria-hidden="true">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p class="coin-stat-label">Balance total</p>
              <p id="stat-balance" class="coin-stat-value">—</p>
              <div class="coin-stat-bar" aria-hidden="true"></div>
            </article>

            <article class="coin-stat-card group" aria-label="Valor actual en USD">
              <div class="coin-stat-icon coin-stat-icon--primary" aria-hidden="true">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <p class="coin-stat-label">Valor actual</p>
              <p id="stat-value" class="coin-stat-value coin-stat-value--accent">—</p>
              <div class="coin-stat-bar coin-stat-bar--accent" aria-hidden="true"></div>
            </article>

            <article class="coin-stat-card group" aria-label="Total de entradas recibidas">
              <div class="coin-stat-icon coin-stat-icon--green" aria-hidden="true">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <p class="coin-stat-label">Total Entradas</p>
              <p id="stat-buys" class="coin-stat-value coin-stat-value--green">—</p>
              <p id="stat-buys-sub" class="text-[10px] text-slate-500 mt-1 hidden"></p>
              <div class="coin-stat-bar coin-stat-bar--green" aria-hidden="true"></div>
            </article>

            <article class="coin-stat-card group" aria-label="Total de salidas enviadas más comisiones">
              <div class="coin-stat-icon coin-stat-icon--red" aria-hidden="true">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
                </svg>
              </div>
              <p class="coin-stat-label">Total Salidas</p>
              <p id="stat-sells" class="coin-stat-value coin-stat-value--red">—</p>
              <p id="stat-sells-sub" class="text-[10px] text-slate-500 mt-1 hidden"></p>
              <div class="coin-stat-bar coin-stat-bar--red" aria-hidden="true"></div>
            </article>
          </div>
        </section>

        <!-- Distribution by exchange -->
        <section aria-label="Distribución por caleta" id="distribution-section" class="hidden">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-semibold text-white font-display flex items-center gap-2">
              <span class="w-1 h-5 rounded-full bg-primary inline-block" aria-hidden="true"></span>
              Distribución por caleta
            </h2>
          </div>
          <div id="distribution-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          </div>
        </section>

        <!-- Transaction History -->
        <section aria-label="Historial de transacciones">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold text-white font-display flex items-center gap-2">
              <span class="w-1 h-5 rounded-full bg-primary inline-block" aria-hidden="true"></span>
              Historial de transacciones
            </h2>
            <span id="tx-count" class="text-xs text-slate-500 tabular-nums"></span>
          </div>
          <div id="tx-list" class="space-y-3" aria-live="polite" aria-relevant="additions removals">
            ${_txSkeleton()}
          </div>
        </section>

      </div>

      ${ConfirmDeleteModal()}
      <span id="coin-id-data" data-coin-id="${coinId}" hidden></span>
    </main>
  `;
};

/** Renders skeleton placeholders for tx list */
const _txSkeleton = () =>
  Array.from({ length: 3 }, () => `
    <div class="tx-row-skeleton" aria-hidden="true">
      <div class="skeleton-shimmer h-4 w-16 rounded-full"></div>
      <div class="flex flex-col gap-2 flex-1">
        <div class="skeleton-shimmer h-3 w-40 rounded"></div>
        <div class="skeleton-shimmer h-2.5 w-28 rounded"></div>
      </div>
      <div class="skeleton-shimmer h-4 w-20 rounded ml-auto"></div>
    </div>
  `).join('');

export default CoinDetails;

// ─── Init ──────────────────────────────────────────────────────────

export const initCoinDetails = async () => {
  cleanupConfirmDeleteModal();
  initConfirmDeleteModal();

  const coinIdEl = document.getElementById('coin-id-data');
  const coinId = coinIdEl?.dataset?.coinId;
  if (!coinId) return;

  _renderStats(coinId, null);
  _renderDistribution(coinId);
  _renderTransactions(coinId);

  try {
    const data = await apiFetch(
      `${API_URL}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coinId)}` +
      `&sparkline=false&price_change_percentage=24h`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-cg-demo-api-key': API_KEY || '',
        },
      }
    );
    // /coins/markets returns an array — extract first element
    const coin = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (coin) {
      _renderHeader(coin);
      _renderStats(coinId, coin.current_price ?? null);
      _renderDistribution(coinId);
      _applyHeroAccent(coin.image ?? null);
    }
  } catch (err) {
    if (err instanceof ApiError && err.type === ErrorType.ABORT) return;
    console.warn('CoinDetails: fallo en CoinGecko —', err);
    const nameEl = document.getElementById('coin-name');
    if (nameEl) nameEl.textContent = coinId;
  }
};

// ── Aplica color de acento del logo al glow de fondo ──────────────
const _applyHeroAccent = (imgSrc) => {
  if (!imgSrc) return;
  const glow = document.querySelector('.coin-hero-glow');
  if (glow) {
    // Usa la imagen como referencia visual para la intensidad del glow
    glow.style.backgroundImage = `radial-gradient(ellipse 600px 300px at 50% 0%, rgba(11, 213, 112, 0.12) 0%, transparent 70%)`;
  }
};

const _renderHeader = (data) => {
  const name = data.name ?? '';
  const symbol = data.symbol?.toUpperCase() ?? '';
  const price = data.current_price ?? null;
  const change = data.price_change_percentage_24h ?? null;
  const rank = data.market_cap_rank ?? null;

  const logoWrapper = document.getElementById('coin-logo-wrapper');
  // /coins/markets devuelve `image` como string directamente.
  const imgSrc = data.image ?? null;
  if (logoWrapper && imgSrc) {
    logoWrapper.innerHTML = `
      <div class="coin-logo-ring">
        <img src="${escapeHTML(imgSrc)}"
             alt="${escapeHTML(name)} logo"
             class="w-12 h-12 rounded-full object-contain"
             loading="eager" width="48" height="48" />
      </div>
    `;
  }

  const nameEl = document.getElementById('coin-name');
  if (nameEl) nameEl.textContent = name;

  const symbolEl = document.getElementById('coin-symbol');
  if (symbolEl) {
    symbolEl.textContent = symbol;
    symbolEl.className = 'coin-symbol-badge';
  }

  const rankEl = document.getElementById('coin-rank');
  if (rankEl && rank) {
    rankEl.textContent = `Rank #${rank}`;
  }

  const priceEl = document.getElementById('coin-price');
  if (priceEl) priceEl.textContent = price != null ? formatCryptoPrice(price) : '—';

  const changeEl = document.getElementById('coin-change');
  if (changeEl && change != null) {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    changeEl.textContent = `24h ${sign}${change.toFixed(2)}%`;
    changeEl.className = `text-sm font-semibold mt-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`;
  }
};

/** @param {string} coinId @param {number|null} currentPrice */
const _renderStats = (coinId, currentPrice) => {
  const txs = getTransactionsByCoin(coinId);
  const balance = getNetBalance(coinId);
  const symbol = txs[0]?.symbol?.toUpperCase() ?? '';

  const totalIns = txs
    .filter((t) => t.type === 'buy')
    .reduce((sum, t) => sum + (t.balance ?? 0), 0);
  const totalOuts = txs
    .filter((t) => t.type === 'sell')
    .reduce((sum, t) => sum + (t.balance ?? 0), 0);
  const totalFees = txs.reduce((sum, t) => {
    const fee = t.type === 'sell' ? (t.fees ?? 0) : 0;
    const netFee = t.type === 'transfer_out' ? (t.networkFee ?? 0) : 0;
    return sum + fee + netFee;
  }, 0);

  const el = (id) => document.getElementById(id);
  if (el('stat-balance')) {
    el('stat-balance').textContent = `${formatNumber(balance, 8)} ${symbol}`.trim();
  }
  if (el('stat-value')) {
    el('stat-value').textContent = currentPrice != null ? formatCryptoPrice(balance * currentPrice) : '—';
  }
  if (el('stat-buys')) {
    el('stat-buys').textContent = `+${formatNumber(totalIns, 8)} ${symbol}`.trim();
  }
  if (el('stat-sells')) {
    el('stat-sells').textContent = `−${formatNumber(totalOuts + totalFees, 8)} ${symbol}`.trim();
  }

  const sellsSubEl = el('stat-sells-sub');
  if (sellsSubEl) {
    if (totalFees > 0) {
      sellsSubEl.textContent = `Comisión: ${formatNumber(totalFees, 8)} ${symbol}`.trim();
      sellsSubEl.classList.remove('hidden');
    } else {
      sellsSubEl.classList.add('hidden');
    }
  }

  _renderDistribution(coinId);
};

/** @param {string} coinId */
const _renderDistribution = (coinId) => {
  const section = document.getElementById('distribution-section');
  const list = document.getElementById('distribution-list');
  if (!section || !list) return;

  const dist = getCoinDistribution(coinId);

  if (dist.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  list.innerHTML = dist.map(d => `
    <div class="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
      <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
        ${d.sourceImage
      ? `<img src="${escapeHTML(d.sourceImage)}" alt="${escapeHTML(d.source)}" class="w-6 h-6 rounded-full object-contain" loading="lazy" />`
      : `<span class="text-[10px] font-bold text-white uppercase">${escapeHTML(d.source.charAt(0))}</span>`
    }
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white">${escapeHTML(d.source)}</p>
        <p class="text-xs text-slate-400 tabular-nums">${formatNumber(d.balance, 8)}</p>
      </div>
    </div>
  `).join('');
};

/** @param {string} coinId */
const _renderTransactions = (coinId) => {
  const txList = document.getElementById('tx-list');
  if (!txList) return;

  const txs = getTransactionsByCoin(coinId);
  const countEl = document.getElementById('tx-count');

  if (txs.length === 0) {
    if (countEl) countEl.textContent = '';
    txList.innerHTML = `
      <div class="tx-empty-state" role="status">
        <svg class="w-8 h-8 text-slate-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7l-5-5H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
        <p class="text-slate-400 text-sm font-medium">Sin transacciones</p>
        <p class="text-slate-600 text-xs mt-1">Aún no hay movimientos registrados para esta moneda.</p>
      </div>
    `;
    return;
  }

  // Sort chronologically to compute running balance per source
  const chronological = [...txs].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA - dateB !== 0) {
      return dateA - dateB;
    }
    if (a.type === 'transfer_out' && b.type === 'transfer_in') return -1;
    if (a.type === 'transfer_in' && b.type === 'transfer_out') return 1;
    return 0;
  });

  const runningBalances = new Map();
  const sourceBalances = new Map();
  for (const tx of chronological) {
    const src = tx.source;
    const currentSrcBal = sourceBalances.get(src) || 0;
    const delta = getBalanceDelta(tx);
    const newSrcBal = currentSrcBal + delta;
    sourceBalances.set(src, newSrcBal);
    runningBalances.set(tx.id, newSrcBal);
  }

  const symbol = txs[0]?.symbol?.toUpperCase() ?? '';

  if (countEl) countEl.textContent = `${txs.length} transacción${txs.length !== 1 ? 'es' : ''}`;

  txList.innerHTML = txs.map((tx, i) => _txRow(tx, i, runningBalances.get(tx.id), symbol)).join('');

  txList.querySelectorAll('[data-delete-tx]').forEach((btn) => {
    btn.addEventListener('click', () => _handleDeleteTx(btn.dataset.deleteTx, coinId));
  });
};

/** @param {Object} tx @param {number} index @param {number} [runningBalance] @param {string} [coinSymbol] @returns {string} */
const _txRow = (tx, index, runningBalance, coinSymbol) => {
  const typeConfig = {
    buy: { label: 'Compra', cls: 'tx-badge--buy', dot: 'tx-dot--green' },
    sell: { label: 'Venta', cls: 'tx-badge--sell', dot: 'tx-dot--red' },
    transfer_in: { label: 'Recibida', cls: 'tx-badge--transfer-in', dot: 'tx-dot--sky' },
    transfer_out: { label: 'Enviada', cls: 'tx-badge--transfer-out', dot: 'tx-dot--amber' },
  };

  const config = typeConfig[tx.type] ?? { label: tx.type, cls: 'tx-badge--default', dot: 'tx-dot--default' };
  const label = escapeHTML(config.label);
  const symbol = escapeHTML(coinSymbol ?? tx.symbol?.toUpperCase() ?? '');
  const date = tx.date
    ? new Date(tx.date).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
  const animDelay = `animation-delay: ${index * 40}ms`;

  // Delta neto
  const delta = getBalanceDelta(tx);
  const deltaSign = delta >= 0 ? '+' : '';
  const deltaCls = delta >= 0 ? 'tx-delta--positive' : 'tx-delta--negative';

  // Resolver origen/destino y logos para la visualización del flujo
  let sourceText = '';
  if (tx.type === 'transfer_in' || tx.type === 'transfer_out') {
    let sourceName = tx.source;
    let sourceImg = tx.sourceImage;
    let targetName = 'Destino';
    let targetImg = null;

    if (tx.transferId) {
      const paired = getHoldings().find(h => h.transferId === tx.transferId && h.id !== tx.id);
      if (paired) {
        if (tx.type === 'transfer_out') {
          targetName = paired.source;
          targetImg = paired.sourceImage;
        } else {
          sourceName = paired.source;
          sourceImg = paired.sourceImage;
          targetName = tx.source;
          targetImg = tx.sourceImage;
        }
      }
    }

    const renderExchangeBadge = (name, img, isTarget) => {
      const textCls = isTarget ? 'text-sky-400 font-medium' : 'text-amber-400 font-medium';
      const logoHtml = img 
        ? `<img src="${escapeHTML(img)}" alt="${escapeHTML(name)}" class="w-3.5 h-3.5 rounded-full object-contain inline shrink-0" loading="lazy" />` 
        : '';
      return `
        <span class="inline-flex items-center gap-1">
          ${logoHtml}
          <span class="${textCls}">${escapeHTML(name)}</span>
        </span>
      `;
    };

    sourceText = `
      <span class="inline-flex items-center gap-1.5 text-slate-400">
        ${renderExchangeBadge(sourceName, sourceImg, false)}
        <svg class="w-3 h-3 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M5 12h14M13 18l6-6-6-6"/>
        </svg>
        ${renderExchangeBadge(targetName, targetImg, true)}
      </span>
    `;
  } else {
    // Transacción normal (Compra/Venta)
    const logoHtml = tx.sourceImage 
      ? `<img src="${escapeHTML(tx.sourceImage)}" alt="${escapeHTML(tx.source)}" class="w-3.5 h-3.5 rounded-full object-contain inline mr-1 shrink-0" loading="lazy" />` 
      : '';
    sourceText = `<span class="text-slate-400 font-medium inline-flex items-center">${logoHtml}${escapeHTML(tx.source ?? '—')}</span>`;
  }

  return `
    <article class="tx-row group"
             style="${animDelay}"
             aria-label="${label} de ${escapeHTML(String(tx.balance ?? 0))} ${symbol}">

      <!-- Type badge + delta -->
      <div class="tx-badge-col">
        <span class="tx-badge ${config.cls}" aria-label="Tipo: ${label}">${label}</span>
        <span class="tx-delta ${deltaCls}" aria-label="Impacto neto: ${deltaSign}${formatNumber(delta, 8)} ${symbol}">
          ${deltaSign}${formatNumber(delta, 8)}
        </span>
      </div>

      <!-- Main info -->
      <div class="flex-1 min-w-0">
        <p class="text-white font-semibold text-sm tabular-nums">
          ${escapeHTML(formatNumber(tx.balance ?? 0, 8))}
          <span class="text-slate-400 font-normal">${symbol}</span>
        </p>
        <p class="text-slate-500 text-xs mt-1 truncate flex items-center gap-1.5 flex-wrap">
          ${sourceText}
          <span class="text-slate-700" aria-hidden="true">·</span>
          <time datetime="${escapeHTML(tx.date ?? '')}">${escapeHTML(date)}</time>
          ${tx.fees ? `<span class="text-slate-700" aria-hidden="true">·</span><span class="tx-fee-currency">Fee: ${escapeHTML(String(tx.fees))} ${symbol} <span class="tx-fee-tooltip" title="Esta comisión se deduce del balance de la moneda" aria-label="Ayuda sobre la comisión" tabindex="0" role="tooltip">?</span></span>` : ''}
          ${tx.networkFee ? `<span class="text-slate-700" aria-hidden="true">·</span><span class="text-slate-500">Network: ${escapeHTML(String(tx.networkFee))}</span>` : ''}
        </p>
        ${tx.notes ? `<p class="text-slate-600 text-xs mt-1 italic truncate">${escapeHTML(tx.notes)}</p>` : ''}
      </div>

      <!-- Price per unit -->
      <div class="text-right shrink-0">
        <p class="text-white text-sm font-semibold tabular-nums">${tx.price != null && tx.price > 0 ? formatCryptoPrice(tx.price) : '—'}</p>
        <p class="text-slate-600 text-xs mt-0.5">precio/u</p>
      </div>

      <!-- Running balance (Fase 2.3) -->
      ${runningBalance != null ? `
      <div class="tx-balance-column text-right shrink-0">
        <p class="text-white text-sm font-semibold tabular-nums font-mono">${formatNumber(runningBalance, 8)}</p>
        <p class="text-slate-600 text-xs mt-0.5">en ${escapeHTML(tx.source)}</p>
      </div>
      ` : ''}

      <!-- Delete button -->
      <button data-delete-tx="${escapeHTML(tx.id)}"
              aria-label="Eliminar transacción del ${escapeHTML(date)}"
              class="tx-delete-btn focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      </button>
    </article>
  `;
};

/** @param {string} txId @param {string} coinId */
const _handleDeleteTx = (txId, coinId) => {
  const tx = getHoldings().find(h => h.id === txId);
  const isTransfer = tx?.transferId != null;
  const msg = isTransfer
    ? 'Esta transacción es parte de una transferencia. Se eliminarán ambas entradas (origen y destino). Esta acción no se puede deshacer.'
    : '¿Eliminar esta transacción? Esta acción no se puede deshacer.';

  openConfirmDeleteModal({
    title: 'Eliminar transacción',
    message: msg,
    onConfirm: () => {
      deleteTransaction(txId);
      _renderTransactions(coinId);
      _renderStats(coinId, null);
      window.dispatchEvent(new CustomEvent('holdings-updated'));
    }
  });
};
