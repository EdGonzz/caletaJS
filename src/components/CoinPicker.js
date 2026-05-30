import sprite from "../assets/sprite.svg";
import { SelectLoading } from "./SelectExchange";
import { searchCoins } from "../utils/getCoin";
import { debounce, escapeHTML } from "../utils/helpers";
import { ApiError, ErrorType, getErrorMessage } from "../utils/errors.js";

/**
 * Renders a single coin row.
 * @param {import('../utils/getCoin').Coin} coin
 * @param {boolean} isSelected
 * @returns {string}
 */
const CoinOption = (coin, isSelected) => `
  <button
    data-coin-id="${coin.id}"
    aria-label="Seleccionar ${coin.name}"
    class="coin-row w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/40
      ${isSelected ? "border-primary/60 bg-primary/5" : "border-slate-700 bg-slate-800/40 hover:border-slate-500"}"
  >
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-slate-800">
        <img src="${coin.image || coin.thumb}" alt="${coin.name}" class="w-7 h-7 object-contain" width="28" height="28" loading="lazy" />
      </div>
      <div class="text-left">
        <span class="font-bold text-white text-sm">${coin.name}</span>
        <span class="text-xs text-slate-400 font-medium ml-2">${coin.symbol.toUpperCase()}</span>
      </div>
    </div>
    <div class="flex items-center">
      ${isSelected
    ? `<svg class="w-6 h-6 text-primary"><use href="${sprite}#circle-check"></use></svg>`
    : `<span class="text-xs font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mr-1">Seleccionar</span>
           <svg class="w-6 h-6 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"><use href="${sprite}#chevron-right"></use></svg>`
  }
    </div>
  </button>
`;

/**
 * CoinPicker sub-view component.
 * @param {import('../utils/getCoin').Coin[]} coins - Initial list of coins
 * @param {string} selectedCoinId - ID of the currently selected coin
 * @param {boolean} [isLoading=false] - Whether the initial coin list is loading
 * @returns {string}
 */
const CoinPicker = (coins, selectedCoinId, isLoading = false) => `
  <div id="coin-picker-view" class="flex flex-col h-full">
    <header class="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
      <div class="flex items-center gap-3">
        <button id="coin-back-btn" class="text-slate-400 hover:text-white transition-colors flex items-center group" aria-label="Volver al formulario">
          <svg class="w-6 h-6 mr-1">
            <use href="${sprite}#arrow-left"></use>
          </svg>
        </button>
        <h2 class="text-xl font-bold tracking-tight text-white">Select Coin</h2>
      </div>
      <button id="coin-close-btn" class="text-slate-500 hover:text-slate-300 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-700/50" aria-label="Cerrar modal">
        <svg class="w-6 h-6">
          <use href="${sprite}#close"></use>
        </svg>
      </button>
    </header>
    <div class="p-6 flex-1 overflow-hidden flex flex-col">
      <div class="relative group mb-5">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="w-4 h-4 text-slate-500">
            <use href="${sprite}#search"></use>
          </svg>
        </div>
        <input id="coin-search-input" type="text" placeholder="Search coin..." aria-label="Buscar moneda" class="block w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all" ${isLoading ? 'disabled' : ''} />
      </div>
      <div id="coin-list" class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1" style="max-height:360px">
        ${isLoading ? SelectLoading(10) : coins.map((c) => CoinOption(c, c.id === selectedCoinId)).join("")}
      </div>
    </div>
  </div>
`;

/**
 * Wires up events for the CoinPicker view.
 * @param {Object} options
 * @param {() => void} options.onBack - Called when back button is clicked
 * @param {() => void} options.onClose - Called when close button is clicked
 * @param {(id: string) => void} options.onSelect - Called with the coin ID when selected
 * @param {(coins: import('../utils/getCoin').Coin[]) => void} options.onCoinsUpdate - Syncs updated coin list back to parent
 * @param {import('../utils/getCoin').Coin[]} options.currentCoins - Reference to current coins array
 * @param {string} options.selectedCoinId - Current selected coin ID
 */
const initCoinPicker = ({ onBack, onClose, onSelect, onCoinsUpdate, currentCoins, selectedCoinId }) => {
  document.getElementById("coin-back-btn")?.addEventListener("click", onBack);
  document.getElementById("coin-close-btn")?.addEventListener("click", onClose);

  const coinList = document.getElementById("coin-list");
  const searchInput = document.getElementById("coin-search-input");

  /** @type {boolean} */
  let isLoading = false;

  /**
   * Busca monedas en la API y actualiza la lista.
   * @param {string} query
   */
  const searchInAPI = async (query) => {
    if (query.trim().length < 2) return;

    try {
      const response = await searchCoins(query);
      const newCoins = response.coins?.slice(0, 15) ?? [];
      onCoinsUpdate(newCoins);

      if (coinList) {
        if (newCoins.length === 0) {
          coinList.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-center">
              <svg class="w-8 h-8 text-slate-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p class="text-xs text-slate-400 font-medium">No se encontraron resultados para <strong class="text-slate-300">&quot;${escapeHTML(query)}&quot;</strong></p>
            </div>
          `;
        } else {
          coinList.innerHTML = newCoins
            .map((c) => CoinOption(c, c.id === selectedCoinId))
            .join("");
        }
      }
    } catch (err) {
      if (coinList) {
        const isRateLimit = err instanceof ApiError && err.type === ErrorType.RATE_LIMIT;
        const isNetwork = err instanceof ApiError && err.type === ErrorType.NETWORK;
        const message = err instanceof ApiError ? getErrorMessage(err.type) : 'Error al buscar monedas.';

        coinList.innerHTML = `
          <div class="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div class="rounded-full bg-rose-500/10 p-3 border border-rose-500/20">
              <svg class="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                ${isNetwork
                  ? '<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>'
                  : isRateLimit
                  ? '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
                  : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
                }
              </svg>
            </div>
            <div>
              <p class="text-xs font-semibold text-white mb-0.5">${isRateLimit ? 'Demasiadas peticiones' : isNetwork ? 'Sin conexión' : 'Error de búsqueda'}</p>
              <p class="text-xs text-slate-400">${message}</p>
            </div>
            ${!isRateLimit ? `
              <button
                id="coin-search-retry-btn"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg border border-primary/20 transition-all btn-press"
                aria-label="Reintentar búsqueda"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Reintentar
              </button>
            ` : ''}
          </div>
        `;

        // Bind retry
        document.getElementById('coin-search-retry-btn')?.addEventListener('click', () => {
          if (coinList) coinList.innerHTML = SelectLoading(10);
          searchInAPI(query);
        });
      }
    } finally {
      isLoading = false;
    }
  };

  const optimizedSearch = debounce(searchInAPI, 500);

  // Live search con debounce
  searchInput?.addEventListener("input", (e) => {
    const input = /** @type {HTMLInputElement} */ (e.target);
    const value = input.value.trim().toLowerCase();

    if (!value) {
      // Restaurar lista original
      isLoading = false;
      if (coinList) {
        coinList.innerHTML = currentCoins
          .map((c) => CoinOption(c, c.id === selectedCoinId))
          .join("");
      }
      return;
    }

    // Skeleton inmediato solo si no estaba ya en loading (evita reinicio de animación)
    if (!isLoading) {
      isLoading = true;
      if (coinList) coinList.innerHTML = SelectLoading(10);
    }

    optimizedSearch(value);
  });

  // Select coin (Event Delegation)
  coinList?.addEventListener("click", (e) => {
    const row = e.target.closest(".coin-row");
    if (!row) return;
    onSelect(row.dataset.coinId);
  });
};

export { CoinPicker, initCoinPicker };
