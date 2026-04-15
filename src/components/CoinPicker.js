import sprite from "../assets/sprite.svg";
import { SelectLoading } from "./SelectExchange";
import getCoin from "../utils/getCoin";

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
        <img src="${coin.image || coin.thumb}" alt="${coin.name}" class="w-7 h-7 object-contain" />
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
 * @returns {string}
 */
const CoinPicker = (coins, selectedCoinId) => `
  <div id="coin-picker-view" class="flex flex-col h-full">
    <header class="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
      <div class="flex items-center gap-3">
        <button id="coin-back-btn" class="text-slate-400 hover:text-white transition-colors flex items-center group focus:outline-none" aria-label="Volver al formulario">
          <svg class="w-6 h-6 mr-1">
            <use href="${sprite}#arrow-left"></use>
          </svg>
        </button>
        <h2 class="text-xl font-bold tracking-tight text-white">Select Coin</h2>
      </div>
      <button id="coin-close-btn" class="text-slate-500 hover:text-slate-300 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-700/50 focus:outline-none" aria-label="Cerrar modal">
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
        <input id="coin-search-input" type="text" placeholder="Search coin..." aria-label="Buscar moneda" class="block w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all" />
      </div>
      <div id="coin-list" class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1" style="max-height:360px">
        ${coins.map((c) => CoinOption(c, c.id === selectedCoinId)).join("")}
      </div>
    </div>
  </div>
`;

/**
 * Wires up events for the CoinPicker view.
 * @param {Object} options
 * @param {Function} options.onBack - Called when back button is clicked
 * @param {Function} options.onClose - Called when close button is clicked
 * @param {Function} options.onSelect - Called when a coin is selected
 * @param {import('../utils/getCoin').Coin[]} options.currentCoins - Reference to current coins array
 * @param {string} options.selectedCoinId - Current selected coin ID
 */
const initCoinPicker = ({ onBack, onClose, onSelect, currentCoins, selectedCoinId }) => {
  document.getElementById("coin-back-btn")?.addEventListener("click", onBack);
  document.getElementById("coin-close-btn")?.addEventListener("click", onClose);

  const coinList = document.getElementById("coin-list");
  const searchInput = document.getElementById("coin-search-input");

  // Search filter
  searchInput?.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const term = e.target.value.toLowerCase();
      if (coinList) coinList.innerHTML = SelectLoading(10);
      
      try {
        let response = await getCoin(term);
        const newCoins = response.coins.slice(0, 15);
        // We update the list in place
        if (coinList) {
          coinList.innerHTML = newCoins.map((c) => CoinOption(c, c.id === selectedCoinId)).join("");
        }
        // Notify parent about new search results if needed
        if (onSelect) {
            // This is a bit tricky since we want to keep the reference in AddAssetModal
            // For now, we'll rely on the parent updating its local 'coins' variable if we expose it
        }
      } catch (err) {
        if (coinList) coinList.innerHTML = '<div class="text-center p-4 text-rose-400">Error fetching coins.</div>';
      }
    }
  });

  // Select coin (Using Event Delegation)
  coinList?.addEventListener("click", (e) => {
    const row = e.target.closest(".coin-row");
    if (!row) return;

    const id = row.dataset.coinId;
    onSelect(id);
  });
};

export { CoinPicker, initCoinPicker };
export default CoinPicker;
