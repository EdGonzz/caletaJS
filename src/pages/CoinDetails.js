// src/pages/CoinDetails.js
import { escapeHTML, formatCurrency, formatNumber } from '../utils/helpers.js';
import { getTransactionsByCoin, getNetBalance, deleteTransaction } from '../utils/transactionUtils.js';
import { getHoldings } from '../utils/holdingsStorage.js';
import ConfirmDeleteModal, { openConfirmDeleteModal, initConfirmDeleteModal, cleanupConfirmDeleteModal } from '../components/ConfirmDeleteModal.js';
import sprite from '../assets/sprite.svg';

/**
 * @param {{ id?: string }} params
 * @returns {string}
 */
const CoinDetails = (params = {}) => {
  const coinId = escapeHTML(params.id ?? '');
  return `
    <main id="coin-details-root" class="min-h-screen p-6 max-w-5xl mx-auto" aria-label="Detalle de moneda">

      <a href="#/" class="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium group">
        <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true">
          <use href="${sprite}#arrow-left"></use>
        </svg>
        Volver al portafolio
      </a>

      <!-- Header moneda -->
      <section id="coin-header" class="flex items-center gap-4 mb-8" aria-live="polite">
        <div id="coin-logo-wrapper" class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
          <span class="text-slate-500 text-xs" aria-hidden="true">…</span>
        </div>
        <div class="flex-1 min-w-0">
          <h1 id="coin-name" class="text-2xl font-bold text-white">Cargando…</h1>
          <span id="coin-symbol" class="text-sm text-slate-400 uppercase font-medium"></span>
        </div>
        <div class="text-right shrink-0">
          <p id="coin-price" class="text-xl font-semibold text-white">—</p>
          <p id="coin-change" class="text-sm text-slate-400">24h —</p>
        </div>
      </section>

      <!-- Stats rápidos -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-label="Estadísticas del activo">
        <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <p class="text-xs text-slate-400 mb-1">Balance total</p>
          <p id="stat-balance" class="text-lg font-bold text-white font-display">—</p>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <p class="text-xs text-slate-400 mb-1">Valor actual (USD)</p>
          <p id="stat-value" class="text-lg font-bold text-white font-display">—</p>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <p class="text-xs text-slate-400 mb-1">Compras + Recibidas</p>
          <p id="stat-buys" class="text-lg font-bold text-emerald-400">—</p>
        </div>
        <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <p class="text-xs text-slate-400 mb-1">Ventas + Enviadas</p>
          <p id="stat-sells" class="text-lg font-bold text-rose-400">—</p>
        </div>
      </section>

      <!-- Historial -->
      <section aria-label="Historial de transacciones">
        <h2 class="text-lg font-semibold text-white mb-4">Historial de transacciones</h2>
        <div id="tx-list" class="space-y-2" aria-live="polite">
          <p class="text-slate-500 text-sm">Cargando…</p>
        </div>
      </section>

      ${ConfirmDeleteModal()}
      <span id="coin-id-data" data-coin-id="${coinId}" hidden></span>
    </main>
  `;
};

export default CoinDetails;

// ─── Init ──────────────────────────────────────────────────────────

export const initCoinDetails = async () => {
  cleanupConfirmDeleteModal();
  initConfirmDeleteModal();

  const coinIdEl = document.getElementById('coin-id-data');
  const coinId = coinIdEl?.dataset?.coinId;
  if (!coinId) return;

  _renderStats(coinId, null);
  _renderTransactions(coinId);

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}` +
      `?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    _renderHeader(data);
    _renderStats(coinId, data.market_data?.current_price?.usd ?? null);
  } catch (err) {
    console.warn('CoinDetails: fallo en CoinGecko —', err);
    const nameEl = document.getElementById('coin-name');
    if (nameEl) nameEl.textContent = coinId;
  }
};

const _renderHeader = (data) => {
  const name = data.name ?? '';
  const symbol = data.symbol?.toUpperCase() ?? '';
  const price = data.market_data?.current_price?.usd ?? null;
  const change = data.market_data?.price_change_percentage_24h ?? null;

  const logoWrapper = document.getElementById('coin-logo-wrapper');
  if (logoWrapper && data.image?.small) {
    logoWrapper.innerHTML = `
      <img src="${escapeHTML(data.image.small)}" alt="${escapeHTML(name)} logo"
           class="w-10 h-10 rounded-full" loading="lazy" width="40" height="40" />
    `;
  }

  const nameEl = document.getElementById('coin-name');
  if (nameEl) nameEl.textContent = name;

  const symbolEl = document.getElementById('coin-symbol');
  if (symbolEl) symbolEl.textContent = symbol;

  const priceEl = document.getElementById('coin-price');
  if (priceEl) priceEl.textContent = price != null ? formatCurrency(price) : '—';

  const changeEl = document.getElementById('coin-change');
  if (changeEl && change != null) {
    const sign = change >= 0 ? '+' : '';
    changeEl.textContent = `24h ${sign}${change.toFixed(2)}%`;
    changeEl.className = `text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
  }
};

/** @param {string} coinId @param {number|null} currentPrice */
const _renderStats = (coinId, currentPrice) => {
  const txs = getTransactionsByCoin(coinId);
  const balance = getNetBalance(coinId);
  const buys = txs.filter((t) => t.type === 'buy' || t.type === 'transfer_in').length;
  const sells = txs.filter((t) => t.type === 'sell' || t.type === 'transfer_out').length;

  const el = (id) => document.getElementById(id);
  if (el('stat-balance')) el('stat-balance').textContent = formatNumber(balance, 8);
  if (el('stat-value')) el('stat-value').textContent = currentPrice != null ? formatCurrency(balance * currentPrice) : '—';
  if (el('stat-buys')) el('stat-buys').textContent = String(buys);
  if (el('stat-sells')) el('stat-sells').textContent = String(sells);
};

/** @param {string} coinId */
const _renderTransactions = (coinId) => {
  const txList = document.getElementById('tx-list');
  if (!txList) return;

  const txs = getTransactionsByCoin(coinId);

  if (txs.length === 0) {
    txList.innerHTML = '<p class="text-slate-500 text-sm">Sin transacciones registradas para esta moneda.</p>';
    return;
  }

  txList.innerHTML = txs.map(_txRow).join('');

  txList.querySelectorAll('[data-delete-tx]').forEach((btn) => {
    btn.addEventListener('click', () => _handleDeleteTx(btn.dataset.deleteTx, coinId));
  });
};

/** @param {Object} tx @returns {string} */
const _txRow = (tx) => {
  const typeColors = {
    buy: 'text-emerald-400 bg-emerald-400/10',
    sell: 'text-rose-400 bg-rose-400/10',
    transfer_in: 'text-sky-400 bg-sky-400/10',
    transfer_out: 'text-amber-400 bg-amber-400/10',
  };
  const typeLabels = {
    buy: 'Compra',
    sell: 'Venta',
    transfer_in: 'Recibida',
    transfer_out: 'Enviada',
  };
  const colorClass = typeColors[tx.type] ?? 'text-slate-400 bg-slate-400/10';
  const label = escapeHTML(typeLabels[tx.type] ?? tx.type);
  const date = tx.date
    ? new Date(tx.date).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  return `
    <article class="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700/40 transition-colors rounded-xl p-4 border border-slate-700/30"
             aria-label="${label} de ${escapeHTML(String(tx.balance ?? 0))} ${escapeHTML(tx.symbol ?? '')}">
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${colorClass}">${label}</span>
      <div class="flex-1 min-w-0">
        <p class="text-white font-medium text-sm">
          ${escapeHTML(formatNumber(tx.balance ?? 0, 8))} ${escapeHTML(tx.symbol?.toUpperCase() ?? '')}
        </p>
        <p class="text-slate-400 text-xs mt-0.5 truncate">
          ${escapeHTML(tx.source ?? '—')} · ${escapeHTML(date)}${tx.fees ? ` · Fees: $${escapeHTML(String(tx.fees))}` : ''}
        </p>
        ${tx.notes ? `<p class="text-slate-500 text-xs mt-0.5 italic truncate">${escapeHTML(tx.notes)}</p>` : ''}
      </div>
      <div class="text-right shrink-0">
        <p class="text-white text-sm font-medium">${tx.price ? formatCurrency(tx.price) : '—'}</p>
        <p class="text-slate-400 text-xs">precio/unidad</p>
      </div>
      <button data-delete-tx="${escapeHTML(tx.id)}"
              aria-label="Eliminar transacción del ${escapeHTML(date)}"
              class="text-slate-600 hover:text-rose-400 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 rounded p-1 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
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
