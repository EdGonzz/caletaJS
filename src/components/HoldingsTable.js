import AssetRow from "./AssetRow";
import Pagination from "./Pagination";
import { getHoldings, deleteHoldingsByCoin } from "../utils/holdingsStorage";
import { openConfirmDeleteModal } from "./ConfirmDeleteModal";
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
      <div class="flex items-center justify-between border-b border-slate-700/50 px-6 py-4 min-h-[69px]">
        <h3 class="text-lg font-bold text-white transition-opacity duration-300" id="holdings-title">Holdings</h3>
        <div class="flex items-center gap-2 relative">
          <div class="relative flex items-center justify-end">
            <input
              type="text"
              id="holdings-search-input"
              class="w-0 opacity-0 pointer-events-none py-1.5 bg-slate-800/80 border border-transparent rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-300 ease-out"
              placeholder="Buscar..."
              aria-label="Buscar en la tabla"
            />
            <button
              id="search-btn"
              class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 focus:outline-none transition-all duration-300"
              aria-label="Buscar criptomonedas"
            >
              <svg class="w-5 h-5" aria-hidden="true">
                <use href="${sprite}#search" />
              </svg>
            </button>
            <button
              id="close-search-btn"
              class="hidden absolute right-2 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-all"
              aria-label="Cerrar búsqueda"
            >
              <svg class="w-4 h-4" aria-hidden="true">
                <use href="${sprite}#close" />
              </svg>
            </button>
          </div>
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
            <tr class="border-b border-slate-700/50 bg-slate-800/30 text-xs tracking-wider text-slate-400 uppercase select-none">
              <th class="px-6 py-4 font-semibold cursor-pointer" scope="col" aria-sort="none" data-sort="name">
                <button class="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none focus:text-white" aria-label="Sort by Asset">
                  <span>Asset</span>
                  <span class="sort-icon opacity-30 hover:opacity-60 transition-opacity duration-200">
                    <svg class="w-3.5 h-3.5" aria-hidden="true">
                      <use href="${sprite}#arrow-upward" />
                    </svg>
                  </span>
                </button>
              </th>
              <th class="px-6 py-4 font-semibold" scope="col">Source</th>
              <th class="px-6 py-4 font-semibold cursor-pointer text-right" scope="col" aria-sort="none" data-sort="price">
                <button class="flex items-center justify-end gap-1.5 hover:text-white transition-colors focus:outline-none focus:text-white w-full text-right" aria-label="Sort by Price">
                  <span>Price</span>
                  <span class="sort-icon opacity-30 hover:opacity-60 transition-opacity duration-200">
                    <svg class="w-3.5 h-3.5" aria-hidden="true">
                      <use href="${sprite}#arrow-upward" />
                    </svg>
                  </span>
                </button>
              </th>
              <th class="px-6 py-4 font-semibold cursor-pointer text-right" scope="col" aria-sort="none" data-sort="change24h">
                <button class="flex items-center justify-end gap-1.5 hover:text-white transition-colors focus:outline-none focus:text-white w-full text-right" aria-label="Sort by 24h change">
                  <span>24h %</span>
                  <span class="sort-icon opacity-30 hover:opacity-60 transition-opacity duration-200">
                    <svg class="w-3.5 h-3.5" aria-hidden="true">
                      <use href="${sprite}#arrow-upward" />
                    </svg>
                  </span>
                </button>
              </th>
              <th class="px-6 py-4 font-semibold cursor-pointer text-right" scope="col" aria-sort="none" data-sort="balance">
                <button class="flex items-center justify-end gap-1.5 hover:text-white transition-colors focus:outline-none focus:text-white w-full text-right" aria-label="Sort by Balance">
                  <span>Balance</span>
                  <span class="sort-icon opacity-30 hover:opacity-60 transition-opacity duration-200">
                    <svg class="w-3.5 h-3.5" aria-hidden="true">
                      <use href="${sprite}#arrow-upward" />
                    </svg>
                  </span>
                </button>
              </th>
              <th class="px-6 py-4 font-semibold cursor-pointer text-right" scope="col" aria-sort="none" data-sort="value">
                <button class="flex items-center justify-end gap-1.5 hover:text-white transition-colors focus:outline-none focus:text-white w-full text-right" aria-label="Sort by Value">
                  <span>Value</span>
                  <span class="sort-icon opacity-30 hover:opacity-60 transition-opacity duration-200">
                    <svg class="w-3.5 h-3.5" aria-hidden="true">
                      <use href="${sprite}#arrow-upward" />
                    </svg>
                  </span>
                </button>
              </th>
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

/** @type {AbortController | null} */
let _priceFetchAbortController = null;

/** @type {((e: Event) => void) | null} */
let _filterHandler = null;
/** @type {((e: Event) => void) | null} */
let _holdingsHandler = null;
/** @type {((e: Event) => void) | null} */
let _refreshRequestedHandler = null;
/** @type {(() => void) | null} */
let _scrollFadeHandler = null;

/** @type {(() => void) | null} */
let _searchOpenHandler = null;
/** @type {(() => void) | null} */
let _searchCloseHandler = null;
/** @type {((e: Event) => void) | null} */
let _searchInputHandler = null;
/** @type {((e: KeyboardEvent) => void) | null} */
let _searchKeydownHandler = null;
/** @type {((e: Event) => void) | null} */
let _sortHandler = null;
/** @type {((e: Event) => void) | null} */
let _assetActionsClickHandler = null;
/** @type {((e: MouseEvent) => void) | null} */
let _globalAssetActionsCloseHandler = null;


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
  let apiData = []; // Datos crudos actualizados provenientes del API
  let currentData = []; // Datos resultantes después de aplicar búsqueda y ordenamiento
  let activeFilter = currentFilter; // Default source

  let searchQuery = '';
  let sortColumn = 'name'; // 'name', 'price', 'change24h', 'balance', 'value'
  let sortDirection = 'asc'; // 'asc' o 'desc'

  _filterHandler = (e) => {
    activeFilter = e.detail.source;

    // Issue 3: Reset total del estado de búsqueda al cambiar de wallet.
    // Evita que el usuario vea resultados filtrados del wallet anterior en el nuevo.
    if (searchQuery !== '') {
      searchQuery = '';

      const searchInput = /** @type {HTMLInputElement|null} */ (document.getElementById('holdings-search-input'));
      const searchBtn = document.getElementById('search-btn');
      const closeSearchBtn = document.getElementById('close-search-btn');

      if (searchInput && searchBtn && closeSearchBtn) {
        // Colapsar input
        searchInput.value = '';
        searchInput.classList.remove('w-40', 'sm:w-56', 'opacity-100', 'pointer-events-auto', 'pl-9', 'pr-8', 'border-slate-700/30');
        searchInput.classList.add('w-0', 'opacity-0', 'pointer-events-none', 'border-transparent');

        // Restaurar botón lupa a estado interactivo
        searchBtn.classList.remove('absolute', 'left-1.5', 'pointer-events-none', 'text-slate-500', 'p-1');
        searchBtn.classList.add('hover:bg-slate-800/50', 'p-2', 'text-slate-400');

        // Ocultar botón de cierre
        closeSearchBtn.classList.add('hidden');
      }
    }

    // Issue 2: Resetear la página al cambiar de wallet.
    // refreshTableData(false) preserva la página actual del dataset; si el nuevo
    // wallet tiene menos páginas, updateDisplay renderiza un slice vacío.
    if (table) table.dataset.currentPage = '1';

    fetchPricesAndUpdate();
  };

  window.addEventListener('caleta-filter-changed', _filterHandler);

  /**
   * Procesa la lista de datos aplicando los filtros de búsqueda y la ordenación activa.
   * @returns {Array}
   */
  const getProcessedData = () => {
    let result = [...apiData];

    // 1. Aplicar filtro de búsqueda si existe
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(h =>
        (h.name && h.name.toLowerCase().includes(query)) ||
        (h.symbol && h.symbol.toLowerCase().includes(query))
      );
    }

    // 2. Aplicar ordenamiento si está configurado
    if (sortColumn) {
      result.sort((a, b) => {
        let valA, valB;

        if (sortColumn === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else {
          // Orden numérico para precios, porcentajes, balances y valores
          valA = Number(a[sortColumn]) || 0;
          valB = Number(b[sortColumn]) || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  /**
   * Refresca el conjunto de datos actual y actualiza la visualización y las cabeceras.
   * @param {boolean} [resetPage=false]
   */
  const refreshTableData = (resetPage = false) => {
    currentData = getProcessedData();
    const page = resetPage ? 1 : (Number(table.dataset.currentPage) || 1);
    updateDisplay(page);
    updateSortHeaders();
  };

  const resetAssetActionButtons = () => {
    tbody.querySelectorAll(".asset-action-btn").forEach(btn => {
      btn.dataset.state = "normal";
      btn.className = "asset-action-btn rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white";
      btn.innerHTML = `<svg class="h-4 w-4" aria-hidden="true"><use href="${sprite}#dots-vertical"></use></svg>`;
    });
  };

  const bindAssetActionEvents = () => {
    if (_assetActionsClickHandler) {
      tbody.querySelectorAll(".asset-action-btn").forEach(btn => {
        btn.removeEventListener("click", _assetActionsClickHandler);
      });
    }

    _assetActionsClickHandler = (e) => {
      e.stopPropagation();
      const btn = /** @type {HTMLButtonElement} */(e.currentTarget);
      const coinId = btn.dataset.assetId;
      const coinName = btn.dataset.assetName;
      if (!coinId) return;

      const state = btn.dataset.state;

      if (state === "normal") {
        resetAssetActionButtons();

        btn.dataset.state = "delete";
        btn.className = "asset-action-btn rounded p-1 text-red-500 hover:bg-red-500/10 transition-colors";
        btn.innerHTML = `<svg class="h-4 w-4" aria-hidden="true"><use href="${sprite}#trash"></use></svg>`;
      } else {
        const sourceContext = activeFilter === DEFAULT_SOURCE ? "todas las caletas" : `la caleta "${activeFilter}"`;
        openConfirmDeleteModal({
          title: `Eliminar Activo "${coinName}"`,
          message: `¿Estás seguro de que deseas eliminar el activo ${coinName} de ${sourceContext}? Esta acción eliminará todas las transacciones asociadas a esta moneda de forma permanente y no se puede deshacer.`,
          onConfirm: () => {
            deleteHoldingsByCoin(coinId, activeFilter);
            window.dispatchEvent(new CustomEvent('holdings-updated'));
          }
        });
      }
    };

    tbody.querySelectorAll(".asset-action-btn").forEach(btn => {
      btn.addEventListener("click", _assetActionsClickHandler);
    });

    if (!_globalAssetActionsCloseHandler) {
      _globalAssetActionsCloseHandler = (e) => {
        const target = /** @type {Node} */(e.target);
        const isClickOnActionButton = target.closest(".asset-action-btn") !== null;

        if (!isClickOnActionButton) {
          resetAssetActionButtons();
        }
      };
      document.addEventListener("click", _globalAssetActionsCloseHandler);
    }
  };

  const updateDisplay = (page = 1) => {
    if (currentData.length === 0) {
      table.dataset.totalPages = '1';
      table.dataset.totalItems = '0';
      table.dataset.currentPage = '1';
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
    bindAssetActionEvents();
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

  /**
   * Actualiza el estado visual (clases de opacidad, colores) e indicadores ARIA
   * de las cabeceras de la tabla según la columna y dirección de ordenación.
   */
  const updateSortHeaders = () => {
    const getColFriendlyName = (col) => {
      switch (col) {
        case 'name': return 'Asset';
        case 'price': return 'Price';
        case 'change24h': return '24h %';
        case 'balance': return 'Balance';
        case 'value': return 'Value';
        default: return col;
      }
    };

    table.querySelectorAll("th[data-sort]").forEach((th) => {
      const col = th.dataset.sort;
      const button = th.querySelector("button");
      const iconSpan = th.querySelector(".sort-icon");
      const useEl = th.querySelector(".sort-icon use");
      if (!button || !iconSpan || !useEl) return;

      const friendlyName = getColFriendlyName(col);
      const isNumeric = col !== "name";

      if (col === sortColumn) {
        th.setAttribute("aria-sort", sortDirection === "asc" ? "ascending" : "descending");
        iconSpan.classList.remove("opacity-30", "hover:opacity-60");
        iconSpan.classList.add("opacity-100", "text-primary");
        useEl.setAttribute("href", `${sprite}#${sortDirection === "asc" ? "arrow-upward" : "arrow-downward"}`);
        // El siguiente clic en la misma columna alterna la dirección (2 estados)
        const nextLabel = sortDirection === "asc" ? "descendente" : "ascendente";
        button.setAttribute("aria-label", `Ordenar por ${friendlyName} (siguiente: ${nextLabel})`);
      } else {
        th.setAttribute("aria-sort", "none");
        iconSpan.classList.remove("opacity-100", "text-primary");
        iconSpan.classList.add("opacity-30", "hover:opacity-60");
        // Columna inactiva: mostrar el primer estado de su ciclo
        useEl.setAttribute("href", `${sprite}#${isNumeric ? "arrow-downward" : "arrow-upward"}`);
        button.setAttribute("aria-label", `Ordenar por ${friendlyName} (${isNumeric ? "descendente" : "ascendente"})`);
      }
    });
  };

  /**
   * Conecta los event listeners para la barra de búsqueda y las cabeceras.
   */
  const bindSearchAndSortEvents = () => {
    const searchBtn = document.getElementById("search-btn");
    const closeSearchBtn = document.getElementById("close-search-btn");
    const searchInput = document.getElementById("holdings-search-input");

    // Abrir búsqueda
    _searchOpenHandler = () => {
      if (!searchInput || !searchBtn || !closeSearchBtn) return;

      // Expandir input con animación suave
      searchInput.classList.remove("w-0", "opacity-0", "pointer-events-none", "border-transparent");
      searchInput.classList.add("w-40", "sm:w-56", "opacity-100", "pointer-events-auto", "pl-9", "pr-8", "border-slate-700/30");

      // Reposicionar el botón de la lupa dentro del input como icono decorativo estático
      searchBtn.classList.remove("hover:bg-slate-800/50", "p-2", "text-slate-400");
      searchBtn.classList.add("absolute", "left-1.5", "pointer-events-none", "text-slate-500", "p-1");

      // Mostrar botón de cierre (X)
      closeSearchBtn.classList.remove("hidden");

      // Enfocar input
      searchInput.focus();
    };
    searchBtn?.addEventListener("click", _searchOpenHandler);

    // Cerrar búsqueda
    _searchCloseHandler = () => {
      if (!searchInput || !searchBtn || !closeSearchBtn) return;

      // Colapsar input con animación suave
      searchInput.classList.remove("w-40", "sm:w-56", "opacity-100", "pointer-events-auto", "pl-9", "pr-8", "border-slate-700/30");
      searchInput.classList.add("w-0", "opacity-0", "pointer-events-none", "border-transparent");

      // Restaurar botón de la lupa a su estado interactivo original
      searchBtn.classList.remove("absolute", "left-1.5", "pointer-events-none", "text-slate-500", "p-1");
      searchBtn.classList.add("hover:bg-slate-800/50", "p-2", "text-slate-400");

      // Ocultar botón de cierre (X)
      closeSearchBtn.classList.add("hidden");

      // Limpiar búsqueda
      searchInput.value = "";
      if (searchQuery !== "") {
        searchQuery = "";
        refreshTableData(true);
      }
    };
    closeSearchBtn?.addEventListener("click", _searchCloseHandler);

    // Escribir en búsqueda (filtrado en tiempo real)
    _searchInputHandler = (e) => {
      searchQuery = e.target.value;
      refreshTableData(true);
    };
    searchInput?.addEventListener("input", _searchInputHandler);

    // Tecla Escape en input de búsqueda
    _searchKeydownHandler = (e) => {
      if (e.key === "Escape") {
        _searchCloseHandler();
      }
    };
    searchInput?.addEventListener("keydown", _searchKeydownHandler);

    // Ordenamiento por cabeceras
    // Ciclo de 2 estados por tipo de columna:
    //   name    → asc ↔ desc
    //   numeric → desc ↔ asc
    _sortHandler = (e) => {
      const btn = e.currentTarget;
      const th = btn.closest("th[data-sort]");
      if (!th) return;

      const targetSort = th.dataset.sort;
      const isNumeric = targetSort !== "name";

      if (sortColumn === targetSort) {
        // Misma columna: alternar dirección
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        // Nueva columna: activar nueva columna y desactivar anterior
        sortColumn = targetSort;
        sortDirection = isNumeric ? "desc" : "asc";
      }

      refreshTableData(true);
    };

    table.querySelectorAll("th[data-sort] button").forEach((btn) => {
      btn.addEventListener("click", _sortHandler);
    });
  };

  /**
   * Obtiene precios actualizados del API y refresca la tabla.
   * @param {boolean} [isManual=false] - Si el refresco fue iniciado manualmente por el usuario.
   */
  const fetchPricesAndUpdate = async (isManual = false) => {
    // Si ya hay una petición en curso, cancelarla para evitar condiciones de carrera (concurrency guard)
    if (_priceFetchAbortController) {
      _priceFetchAbortController.abort();
    }
    _priceFetchAbortController = new AbortController();
    const signal = _priceFetchAbortController.signal;

    const rawHoldings = getHoldings();
    const filteredHoldings = activeFilter === 'Caletas'
      ? rawHoldings
      : rawHoldings.filter(h => h.source === activeFilter);

    let data = aggregateHoldings(filteredHoldings, activeFilter);

    if (data.length === 0) {
      _priceFetchAbortController = null;
      apiData = [];
      refreshTableData(true);
      // Notificar a StatsGrid y a ActionToolbar (forzamos isManual a false porque no se consumió cuota de la API)
      window.dispatchEvent(new CustomEvent('prices-updated', {
        detail: { holdings: [], usingCachedPrices: false, isManual: false }
      }));
      return;
    }

    const coinIds = [...new Set(data.map(h => h.id))].join(',');

    /** @type {boolean} */
    let usingCachedPrices = false;
    /** @type {boolean} Indica si el fetch falló — se propaga en el detail del evento
     *  para que ActionToolbar evite escalar el cooldown sin suprimir el evento para
     *  StatsGrid y AllocationDonut. */
    let fetchFailed = false;

    try {
      const url = `${process.env.API_URL}/coins/markets?vs_currency=usd&ids=${coinIds}&sparkline=true`;
      const fetchOptions = {
        signal,
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
            };
          }
          return { ...asset, value: asset.balance * asset.price };
        });
      } else {
        throw new ApiError(ErrorType.PARSE, "La respuesta de la API no es un listado válido.");
      }
    } catch (err) {
      // Si fue cancelada intencionalmente por un fetch más nuevo, salir silenciosamente
      if (err instanceof ApiError && err.type === ErrorType.ABORT) {
        return;
      }

      fetchFailed = true;
      usingCachedPrices = true;

      // Fallback: calculate value using the last known price
      data = data.map(a => ({ ...a, value: a.balance * a.price }));

      if (err instanceof ApiError) {
        const userMsg = err.type === ErrorType.RATE_LIMIT
          ? 'Límite de peticiones alcanzado. Mostrando precios del último guardado.'
          : `${getErrorMessage(err.type)} Mostrando precios del último guardado.`;
        showWarning(userMsg, 7000);
        console.warn('HoldingsTable: precio en caché —', err.message);
      }

      // Notificar a ActionToolbar del fallo — no escala cooldown ni bloquea el botón
      window.dispatchEvent(new CustomEvent('prices-update-failed', {
        detail: { isManual }
      }));
    } finally {
      // Limpiar el abort controller si este fetch sigue siendo el actual
      if (_priceFetchAbortController?.signal === signal) {
        _priceFetchAbortController = null;
      }
    }

    // Actualizar estado interno y UI en ambos paths (éxito y fallback con caché)
    apiData = data;
    refreshTableData(false);

    // Mostrar/ocultar badge de precios cacheados en el header de la tabla
    _updateCachedBadge(usingCachedPrices);

    // Siempre despachar 'prices-updated' — StatsGrid y AllocationDonut dependen de este evento
    // para renderizar incluso cuando los datos vienen de caché. Se incluye `fetchFailed` en el
    // detail para que ActionToolbar no escale el cooldown si el fetch falló.
    window.dispatchEvent(new CustomEvent('prices-updated', {
      detail: { holdings: apiData, usingCachedPrices, isManual, fetchFailed }
    }));
  };

  // Inicializar listeners de búsqueda y ordenamiento
  bindSearchAndSortEvents();

  // Initial Load (no es manual — no penaliza cooldown)
  fetchPricesAndUpdate(false);

  // Escuchar petición de refresco desde ActionToolbar
  _refreshRequestedHandler = (e) => {
    const isManual = /** @type {CustomEvent} */(e).detail?.manual ?? false;
    fetchPricesAndUpdate(isManual);
  };
  window.addEventListener('request-prices-refresh', _refreshRequestedHandler);

  // Listen for new transactions
  _holdingsHandler = () => {
    fetchPricesAndUpdate(false);
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
  if (_refreshRequestedHandler) {
    window.removeEventListener('request-prices-refresh', _refreshRequestedHandler);
    _refreshRequestedHandler = null;
  }
  if (_scrollFadeHandler) {
    const wrapper = document.getElementById("holdings-scroll-wrapper");
    if (wrapper) wrapper.removeEventListener("scroll", _scrollFadeHandler);
    _scrollFadeHandler = null;
  }
  if (_priceFetchAbortController) {
    _priceFetchAbortController.abort();
    _priceFetchAbortController = null;
  }

  // Limpieza de búsqueda
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn && _searchOpenHandler) {
    searchBtn.removeEventListener("click", _searchOpenHandler);
  }
  _searchOpenHandler = null;

  const closeSearchBtn = document.getElementById("close-search-btn");
  if (closeSearchBtn && _searchCloseHandler) {
    closeSearchBtn.removeEventListener("click", _searchCloseHandler);
  }
  _searchCloseHandler = null;

  const searchInput = document.getElementById("holdings-search-input");
  if (searchInput) {
    if (_searchInputHandler) searchInput.removeEventListener("input", _searchInputHandler);
    if (_searchKeydownHandler) searchInput.removeEventListener("keydown", _searchKeydownHandler);
  }
  _searchInputHandler = null;
  _searchKeydownHandler = null;

  // Limpieza de ordenación
  const table = document.getElementById("holdings-table");
  if (table && _sortHandler) {
    table.querySelectorAll("th[data-sort] button").forEach((btn) => {
      btn.removeEventListener("click", _sortHandler);
    });
  }
  _sortHandler = null;

  if (_assetActionsClickHandler) {
    const tbody = document.getElementById("holdings-tbody");
    if (tbody) {
      tbody.querySelectorAll(".asset-action-btn").forEach((btn) => {
        btn.removeEventListener("click", _assetActionsClickHandler);
      });
    }
    _assetActionsClickHandler = null;
  }
  if (_globalAssetActionsCloseHandler) {
    document.removeEventListener("click", _globalAssetActionsCloseHandler);
    _globalAssetActionsCloseHandler = null;
  }
};

export default HoldingsTable;

