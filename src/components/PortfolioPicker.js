// src/components/PortfolioPicker.js
import sprite from '../assets/sprite.svg';
import { getPortfolioCoins } from '../utils/transactionUtils.js';
import { escapeHTML } from '../utils/helpers.js';

/**
 * Renderiza una fila de moneda del portafolio.
 * @param {{ coinId: string, name: string, symbol: string, logoUrl: string, netBalance: number, sources: Array<{name: string, image: string, balance: number}> }} coin
 * @param {string} selectedCoinId
 * @returns {string}
 */
const PortfolioOption = (coin, selectedCoinId) => {
  const coinName = typeof coin.name === 'string' && coin.name ? coin.name : 'Moneda sin nombre';
  const coinSymbol = typeof coin.symbol === 'string' && coin.symbol ? coin.symbol : 'Moneda sin simbolo';
  const isSelected = coin.coinId === selectedCoinId;
  return `
    <button
      data-portfolio-coin-id="${escapeHTML(coin.coinId)}"
      data-coin-name="${escapeHTML(coinName.toLowerCase())}"
      data-coin-symbol="${escapeHTML(coinSymbol.toLowerCase())}"
      aria-label="Seleccionar ${escapeHTML(coinName)}"
      class="portfolio-coin-row w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40
        ${isSelected ? 'border-primary/60 bg-primary/5' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'}"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-slate-800 flex items-center justify-center">
          <img src="${escapeHTML(coin.logoUrl ?? '')}" alt="${escapeHTML(coinName)}"
               class="w-7 h-7 object-contain" width="28" height="28" loading="lazy" />
        </div>
        <div class="text-left">
          <span class="font-bold text-white text-sm">${escapeHTML(coinName)}</span>
          <span class="text-xs text-slate-400 font-medium ml-2">${escapeHTML(coinSymbol.toUpperCase())}</span>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs text-slate-300 font-medium">${(Number.isFinite(coin.netBalance) ? coin.netBalance : 0).toFixed(8)}</p>
        <p class="text-xs text-slate-500 mb-1">disponible</p>
        ${coin.sources && coin.sources.length > 0 ? `
          <div class="flex flex-wrap gap-1 justify-end">
            ${coin.sources.map(s => `
              <span class="inline-flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-800/60 rounded px-1.5 py-0.5 border border-slate-700/50">
                ${s.image ? `<img src="${escapeHTML(s.image)}" alt="" class="w-3 h-3 rounded-full" />` : ''}
                ${escapeHTML(s.name)}
                 <span class="text-slate-600">${(Number.isFinite(s.balance) ? s.balance : 0).toFixed(4)}</span>
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </button>
  `;
};

/**
 * Componente PortfolioPicker — reemplaza visualmente a CoinPicker para Sell/Transfer.
 * Incluye barra de búsqueda local (filtra por nombre/symbol sin llamadas API).
 * @param {string} selectedCoinId
 * @param {string|null} sourceFilter
 * @returns {string}
 */
export const PortfolioPicker = (selectedCoinId, sourceFilter = null) => {
  const coins = getPortfolioCoins(sourceFilter);

  return `
    <div id="portfolio-picker-view" class="flex flex-col h-full">
      <header class="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div class="flex items-center gap-3">
          <button id="portfolio-back-btn"
                  class="text-slate-400 hover:text-white transition-colors"
                  aria-label="Volver al formulario">
            <svg class="w-6 h-6"><use href="${sprite}#arrow-left"></use></svg>
          </button>
          <h2 class="text-xl font-bold tracking-tight text-white">Seleccionar moneda</h2>
        </div>
        <button id="portfolio-close-btn"
                class="text-slate-500 hover:text-slate-300 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-700/50"
                aria-label="Cerrar modal">
          <svg class="w-6 h-6"><use href="${sprite}#close"></use></svg>
        </button>
      </header>

      ${coins.length === 0 ? `
        <div class="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div class="flex flex-col items-center justify-center py-12 text-center gap-2">
            <p class="text-slate-400 text-sm font-medium">Sin monedas en tu portafolio</p>
            <p class="text-slate-500 text-xs">Registra una compra primero.</p>
          </div>
        </div>
      ` : `
        <!-- Search bar (idéntica en UX a CoinPicker) -->
        <div class="relative px-6 pt-4">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-500"><use href="${sprite}#search"></use></svg>
            </div>
            <input
              id="portfolio-search-input"
              type="text"
              class="block w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all"
              placeholder="Buscar moneda..."
              aria-label="Buscar moneda en tu portafolio"
            />
          </div>
        </div>

        <div class="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div id="portfolio-coin-list" class="space-y-2">
            ${coins.map((c) => PortfolioOption(c, selectedCoinId)).join('')}
          </div>
          <!-- Empty state de búsqueda (se muestra/oculta via JS) -->
          <div id="portfolio-search-empty" class="hidden flex flex-col items-center justify-center py-8 text-center gap-2">
            <p class="text-slate-400 text-sm font-medium">Sin resultados</p>
            <p class="text-slate-500 text-xs">Prueba con otro término de búsqueda.</p>
          </div>
        </div>
      `}
    </div>
  `;
};

/**
 * Conecta eventos del PortfolioPicker.
 * @param {{ onBack: () => void, onClose: () => void, onSelect: (coinId: string) => void }} options
 */
export const initPortfolioPicker = ({ onBack, onClose, onSelect }) => {
  document.getElementById('portfolio-back-btn')?.addEventListener('click', onBack);
  document.getElementById('portfolio-close-btn')?.addEventListener('click', onClose);

  // Selección de moneda (delegación de eventos)
  document.getElementById('portfolio-coin-list')?.addEventListener('click', (e) => {
    const row = e.target.closest('.portfolio-coin-row');
    if (!row) return;
    onSelect(row.dataset.portfolioCoinId);
  });

  // Búsqueda local (filtrado instantáneo sin debounce)
  const searchInput = document.getElementById('portfolio-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase().trim();
      let visibleCount = 0;

      document.querySelectorAll('.portfolio-coin-row').forEach((row) => {
        const name = row.dataset.coinName ?? '';
        const symbol = row.dataset.coinSymbol ?? '';
        const match = !term || name.includes(term) || symbol.includes(term);
        row.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      // Mostrar/ocultar empty state de búsqueda
      const searchEmpty = document.getElementById('portfolio-search-empty');
      if (searchEmpty) {
        searchEmpty.classList.toggle('hidden', visibleCount > 0);
      }
    });
  }
};
