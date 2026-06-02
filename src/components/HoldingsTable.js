import AssetRow from "./AssetRow";
import Pagination from "./Pagination";
import { getHoldings } from "../utils/holdingsStorage";
import { getSource, DEFAULT_SOURCE } from "../utils/sources";
import sprite from "../assets/sprite.svg";
import { currentFilter } from "./ActionToolbar";
import { apiFetch, ApiError, ErrorType, getErrorMessage } from "../utils/errors.js";
import { showWarning } from "./ErrorToast.js";

const PAGE_SIZE = 4;

/**
 * Aggregates individual transactions into a list of unique assets.
 *
 * - When `filter` is DEFAULT_SOURCE ("Caletas" / all-view): groups by coinId only,
 *   consolidating balances cross-exchange and collecting all source names.
 * - When `filter` is a specific exchange: groups by coinId-source, showing one
 *   row per coin per exchange.
 *
 * @param {Array}  transactions - Raw holding records from storage.
 * @param {string} filter       - Active filter key (DEFAULT_SOURCE or exchange name).
 * @returns {Array}
 */
const aggregateHoldings = (transactions, filter = DEFAULT_SOURCE) => {
  const isAllView = filter === DEFAULT_SOURCE;
  const userSources = getSource();
  const sourceImageMap = userSources.reduce((map, s) => {
    if (typeof s === 'object') map[s.name] = s.image;
    return map;
  }, {});

  const aggregated = transactions.reduce((acc, tx) => {
    // All-view: consolidate by coin; exchange-view: separate by coin+source
    const key = isAllView ? tx.coinId : `${tx.coinId}-${tx.source}`;

    if (!acc[key]) {
      acc[key] = {
        id: tx.coinId,
        name: tx.name,
        symbol: tx.symbol,
        logoUrl: tx.logoUrl,
        // In all-view, source is null — we'll populate `sources` array instead
        source: isAllView ? null : tx.source,
        sourceImage: isAllView ? null : sourceImageMap[tx.source],
        sources: [],
        sourceIcon: isAllView ? 'wallet' : (tx.sourceIcon || 'wallet'),
        balance: 0,
        price: tx.price,
        change24h: 0,
        value: 0,
        sparkPath: "M0,15 Q25,25 50,10 T100,5",
        sparkColor: "#64748b",
        isFlat: (tx.symbol ?? '').toLowerCase().includes("usd") || (tx.symbol ?? '').toLowerCase().includes("eur"),
      };
    }

    // Track distinct sources (for all-view badge list)
    if (isAllView && !acc[key].sources.some(s => s.name === tx.source)) {
      acc[key].sources.push({
        name: tx.source,
        image: sourceImageMap[tx.source]
      });
    }

    // Balance calculation
    if (tx.type === 'buy' || tx.type === 'transfer') acc[key].balance += tx.balance;
    if (tx.type === 'sell') acc[key].balance -= tx.balance;

    return acc;
  }, {});

  // Return only assets with a positive balance
  return Object.values(aggregated).filter(h => h.balance > 0);
};

/**
 * Placeholder for empty state when no holdings are found.
 * @returns {string}
 */
const EmptyState = () => `
  <tr>
    <td colspan="8" class="px-6 py-20 text-center">
      <div class="flex flex-col items-center justify-center space-y-4">
        <div class="relative">
          <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          <div class="relative rounded-full bg-slate-800/50 p-6 border border-slate-700/50">
            <svg class="h-10 w-10 text-slate-500" aria-hidden="true">
              <use href="${sprite}#wallet" />
            </svg>
          </div>
        </div>
        <div class="space-y-1">
          <h4 class="text-lg font-bold text-white">No assets found</h4>
          <p class="text-sm text-slate-400 max-w-xs mx-auto">Your portfolio is empty. Add your first transaction to start tracking your investments.</p>
        </div>
        <button 
          id="empty-state-add-btn"
          class="inline-flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg border border-primary/20 transition-all btn-press"
        >
          <svg class="w-4 h-4 mr-2"><use href="${sprite}#plus" /></svg>
          Add First Asset
        </button>
      </div>
    </td>
  </tr>
`;

/**
 * HoldingsTable — the full Holdings section with table structure + pagination.
 */
const HoldingsTable = () => {
  const view = `
    <section class="glass-panel overflow-hidden rounded-xl" aria-label="Holdings">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-700/50 px-6 py-5">
        <h3 class="text-lg font-bold text-white">Holdings</h3>
        <div class="flex gap-2">
          <button
            id="search-btn"
            class="text-slate-400 transition-colors hover:text-white group"
            aria-label="Search"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="${sprite}#search" />
            </svg>
          </button>
          <button
            class="text-slate-400 transition-colors hover:text-white"
            aria-label="Filter holdings"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="${sprite}#filter-2" />
            </svg>
          </button>
          <button
            id="refresh-prices-btn"
            class="text-slate-400 transition-colors hover:text-white group"
            aria-label="Refresh prices"
          >
            <svg class="w-5 h-5 transition-transform group-active:rotate-180 duration-500" aria-hidden="true">
              <use href="${sprite}#refresh" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable table wrapper -->
      <div id="holdings-scroll-wrapper" class="scroll-fade-container custom-scrollbar overflow-x-auto min-h-[200px]">
        <table
          class="w-full border-collapse text-left"
          aria-label="Asset holdings list"
          id="holdings-table"
          data-current-page="1"
          data-total-pages="1"
          data-total-items="0"
          data-page-size="${PAGE_SIZE}"
        >
          <thead>
            <tr class="border-b border-slate-700/50 bg-slate-800/30 text-xs tracking-wider text-slate-400 uppercase">
              <th class="px-6 py-4 font-semibold" scope="col">Asset</th>
              <th class="px-6 py-4 font-semibold" scope="col">Source</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Price</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">24h %</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Balance</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Value</th>
              <th class="w-32 px-6 py-4 text-center font-semibold" scope="col">Last 7d</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Action</th>
            </tr>
          </thead>
          <tbody
            class="divide-y divide-slate-700/30 text-sm"
            id="holdings-tbody"
          >
            <!-- Content injected by initHoldingsTable -->
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div id="holdings-pagination"></div>
    </section>`;

  return view;
};

/** @type {((e: Event) => void) | null} */
let _filterHandler = null;
/** @type {((e: Event) => void) | null} */
let _holdingsHandler = null;
/** @type {(() => void) | null} */
let _refreshHandler = null;
/** @type {(() => void) | null} */
let _scrollFadeHandler = null;

/**
 * Wires up dynamic data, pagination, and real-time updates.
 */
export const initHoldingsTable = () => {
  cleanupHoldingsTable();

  const table = document.getElementById("holdings-table");
  const tbody = document.getElementById("holdings-tbody");
  const paginationEl = document.getElementById("holdings-pagination");

  if (!table || !tbody || !paginationEl) return;

  const pageSize = Number(table.dataset.pageSize);
  let currentData = [];
  let activeFilter = currentFilter; // Default source

  _filterHandler = (e) => {
    activeFilter = e.detail.source;
    fetchPricesAndUpdate();
  };

  window.addEventListener('caleta-filter-changed', _filterHandler);

  const updateDisplay = (page = 1) => {
    if (currentData.length === 0) {
      tbody.innerHTML = EmptyState();
      paginationEl.innerHTML = '';

      // Wire up the empty state button
      document.getElementById("empty-state-add-btn")?.addEventListener("click", () => {
        document.getElementById("add-funds")?.click();
      });
      return;
    }

    const totalPages = Math.ceil(currentData.length / pageSize);
    const start = (page - 1) * pageSize;

    tbody.innerHTML = currentData
      .slice(start, start + pageSize)
      .map((asset) => AssetRow(asset))
      .join("");

    paginationEl.innerHTML = Pagination({
      currentPage: page,
      totalPages,
      totalItems: currentData.length,
      pageSize,
    });

    table.dataset.totalPages = String(totalPages);
    table.dataset.totalItems = String(currentData.length);
    table.dataset.currentPage = String(page);

    bindPaginationEvents();
    bindScrollFade();
  };

  const bindPaginationEvents = () => {
    paginationEl.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        const currentPage = Number(table.dataset.currentPage);
        if (!btn.disabled && page !== currentPage) updateDisplay(page);
      });
    });
  };


  const bindScrollFade = () => {
    const wrapper = document.getElementById("holdings-scroll-wrapper");
    if (!wrapper) return;

    if (_scrollFadeHandler) {
      wrapper.removeEventListener("scroll", _scrollFadeHandler);
    }

    _scrollFadeHandler = () => {
      const isEnd = wrapper.scrollWidth - wrapper.scrollLeft <= wrapper.clientWidth + 5;
      wrapper.classList.toggle('scroll-end', isEnd);
    };

    wrapper.addEventListener("scroll", _scrollFadeHandler, { passive: true });
    _scrollFadeHandler(); // initial check
  };

  const fetchPricesAndUpdate = async () => {
    const rawHoldings = getHoldings();
    const filteredHoldings = activeFilter === 'Caletas'
      ? rawHoldings
      : rawHoldings.filter(h => h.source === activeFilter);

    let data = aggregateHoldings(filteredHoldings, activeFilter);

    if (data.length === 0) {
      currentData = [];
      updateDisplay(1);
      // Still notify StatsGrid so it shows zeros
      window.dispatchEvent(new CustomEvent('prices-updated', { detail: { holdings: [], usingCachedPrices: false } }));
      return;
    }

    const coinIds = [...new Set(data.map(h => h.id))].join(',');

    /** @type {boolean} */
    let usingCachedPrices = false;

    try {
      const url = `${process.env.API_URL}/coins/markets?vs_currency=usd&ids=${coinIds}&sparkline=true`;
      const fetchOptions = {
        headers: {
          'Content-Type': 'application/json',
          'x-cg-demo-api-key': process.env.API_KEY || ''
        }
      };

      const markets = await apiFetch(url, fetchOptions);

      if (Array.isArray(markets)) {
        data = data.map(asset => {
          const market = markets.find(m => m.id === asset.id);
          if (market) {
            return {
              ...asset,
              price: market.current_price,
              change24h: market.price_change_percentage_24h,
              value: asset.balance * market.current_price,
              sparkColor: market.price_change_percentage_24h >= 0 ? "#0bd570" : "#ef4444",
              // In a more advanced version, we would parse market.sparkline_in_7d.price to SVG path
            };
          }
          // Recalculate value with stored price if API fails for this specific coin
          return { ...asset, value: asset.balance * asset.price };
        });
      } else {
        throw new ApiError(ErrorType.PARSE, "La respuesta de la API no es un listado válido.");
      }
    } catch (err) {
      usingCachedPrices = true;

      // Fallback: calculate value using the last known price
      data = data.map(a => ({ ...a, value: a.balance * a.price }));

      if (err instanceof ApiError && err.type !== ErrorType.ABORT) {
        const userMsg = err.type === ErrorType.RATE_LIMIT
          ? 'Límite de peticiones alcanzado. Mostrando precios del último guardado.'
          : `${getErrorMessage(err.type)} Mostrando precios del último guardado.`;
        showWarning(userMsg, 7000);
        console.warn('HoldingsTable: precio en caché —', err.message);
      }
    }

    currentData = data;

    // Dispatch event for StatsGrid — include cached flag
    window.dispatchEvent(new CustomEvent('prices-updated', {
      detail: { holdings: currentData, usingCachedPrices }
    }));

    updateDisplay(Number(table.dataset.currentPage) || 1);

    // Mostrar/ocultar badge de precios cacheados en el header de la tabla
    _updateCachedBadge(usingCachedPrices);
  };

  // Initial Load
  fetchPricesAndUpdate();

  // Manual Refresh Button
  const refreshBtn = document.getElementById("refresh-prices-btn");
  if (refreshBtn) {
    _refreshHandler = () => {
      const btn = document.getElementById("refresh-prices-btn");
      btn?.querySelector('svg')?.classList.add("animate-spin");
      fetchPricesAndUpdate().finally(() => {
        setTimeout(() => btn?.querySelector('svg')?.classList.remove("animate-spin"), 500);
      });
    };
    refreshBtn.addEventListener("click", _refreshHandler);
  }

  // Listen for new transactions
  _holdingsHandler = () => {
    fetchPricesAndUpdate();
  };
  window.addEventListener('holdings-updated', _holdingsHandler);
};


/**
 * Muestra u oculta el badge de "precios cacheados" en el header de la tabla.
 * @param {boolean} isStale
 */
const _updateCachedBadge = (isStale) => {
  const existing = document.getElementById('holdings-cached-badge');
  const headerDiv = document.querySelector('#holdings-table')?.closest('section')?.querySelector('.flex.items-center.justify-between');
  if (!headerDiv) return;

  if (isStale && !existing) {
    const badge = document.createElement('span');
    badge.id = 'holdings-cached-badge';
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-label', 'Precios desactualizados');
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.25);
    `;
    badge.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      Caché
    `;
    // Insertar antes del grupo de botones de acción
    const btnGroup = headerDiv.querySelector('.flex.gap-2');
    if (btnGroup) {
      headerDiv.insertBefore(badge, btnGroup);
    } else {
      headerDiv.appendChild(badge);
    }
  } else if (!isStale && existing) {
    existing.remove();
  }
};

export const cleanupHoldingsTable = () => {
  if (_filterHandler) {
    window.removeEventListener('caleta-filter-changed', _filterHandler);
    _filterHandler = null;
  }
  if (_holdingsHandler) {
    window.removeEventListener('holdings-updated', _holdingsHandler);
    _holdingsHandler = null;
  }
  if (_refreshHandler) {
    const btn = document.getElementById("refresh-prices-btn");
    if (btn) btn.removeEventListener("click", _refreshHandler);
    _refreshHandler = null;
  }
  if (_scrollFadeHandler) {
    const wrapper = document.getElementById("holdings-scroll-wrapper");
    if (wrapper) wrapper.removeEventListener("scroll", _scrollFadeHandler);
    _scrollFadeHandler = null;
  }
};

export default HoldingsTable;

