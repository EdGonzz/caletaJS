import exchanges from "../utils/exchangesData";
import sprite from "../assets/sprite.svg";

/**
 * Renders a single exchange row.
 * @param {import('../utils/exchangesData').Exchange} ex
 * @param {boolean} isSelected
 * @returns {string}
 */
const ExchangeRow = (ex, isSelected) => {
  const selectedClasses = isSelected
    ? "border-primary/60 bg-primary/5"
    : "border-slate-700 bg-slate-800/40 hover:border-slate-500";

  const avatar = ex.logoUrl
    ? `<img src="${ex.logoUrl}" alt="${ex.name}" class="w-6 h-6 object-contain rounded-full" />`
    : ex.icon
      ? `<span class="material-symbols-outlined text-slate-300">${ex.icon}</span>`
      : `<span class="font-bold text-white text-lg">${ex.initial}</span>`;

  return `
    <button
      data-exchange-id="${ex.id}"
      data-exchange-name="${ex.name}"
      aria-label="Seleccionar ${ex.name}"
      class="exchange-row w-full flex items-center justify-between p-3 rounded-xl border ${selectedClasses} cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner" style="background:${ex.color}">
          ${avatar}
        </div>
        <div class="text-left">
          <h3 class="font-semibold text-white group-hover:text-primary transition-colors text-sm">${ex.name}</h3>
          <p class="text-xs text-slate-400 font-mono">${ex.label}</p>
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
};

/**
 * Skeleton loading shimmer row.
 * @returns {string}
 */
const SkeletonRow = () => `
  <div class="flex items-center gap-4 px-1 py-3 animate-pulse">
    <div class="skeleton-shimmer h-10 w-10 rounded-full shrink-0"></div>
    <div class="flex flex-col gap-2 flex-1">
      <div class="skeleton-shimmer h-4 w-32 rounded-full"></div>
      <div class="skeleton-shimmer h-3 w-20 rounded-full opacity-60"></div>
    </div>
    <div class="skeleton-shimmer h-8 w-20 rounded-lg shrink-0"></div>
  </div>
`;

/**
 * Loading state for the exchange list.
 * @param {number} [count=5]
 * @returns {string}
 */
const SelectExchangeLoading = (count = 5) => `
  <div id="exchange-loading" class="space-y-2">
    ${Array.from({ length: count }, () => SkeletonRow()).join("")}
  </div>
`;

/**
 * SelectExchange sub-view component.
 * Renders inside the modal when the user needs to pick an exchange.
 *
 * @param {string} [selectedId] - Currently selected exchange ID
 * @returns {string}
 */
const SelectExchange = (selectedId = "binance") => `
  <div id="select-exchange-view" class="flex flex-col h-full">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
      <div class="flex items-center gap-3">
        <button
          id="exchange-back-btn"
          class="text-slate-400 hover:text-white transition-colors flex items-center group focus:outline-none"
          aria-label="Volver al formulario"
        >
          <svg class="w-6 h-6 mr-1">
            <use href="${sprite}#arrow-left"></use>
          </svg>
        </button>
        <h2 class="text-xl font-bold tracking-tight text-white">Tus Caletas</h2>
      </div>
      <button
        id="exchange-close-btn"
        class="text-slate-500 hover:text-slate-300 transition-colors rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-700/50 focus:outline-none"
        aria-label="Cerrar modal"
      >
        <svg class="w-6 h-6">
          <use href="${sprite}#close"></use>
        </svg>
      </button>
    </header>

    <!-- Body -->
    <div class="p-6 flex-1 overflow-hidden flex flex-col">
      <p class="text-sm text-slate-400 mb-4">
        Selecciona la caleta (exchange) donde realizaste la transacción.
      </p>

      <!-- Search -->
      <div class="relative group mb-5">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="w-4 h-4">
            <use href="${sprite}#search"></use>
          </svg>
        </div>
        <input
          id="exchange-search-input"
          type="text"
          placeholder="Buscar exchange..."
          aria-label="Buscar exchange"
          class="block w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all duration-300"
        />
      </div>

      <!-- Section label -->
      <div class="flex justify-between items-center mb-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Recientes</span>
        <span class="text-xs font-semibold uppercase tracking-wider text-primary cursor-pointer hover:underline">Gestionar</span>
      </div>

      <!-- Exchange List -->
      <div id="exchange-list" class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1" style="max-height:320px">
        ${exchanges.map((ex) => ExchangeRow(ex, ex.id === selectedId)).join("")}
      </div>

      <!-- Add new -->
      <div class="mt-5 pt-4 border-t border-slate-700/50">
        <button
          id="add-new-exchange-btn"
          class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-transparent border border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-primary hover:text-primary transition-all duration-200 group focus:outline-none"
          aria-label="Agregar nueva caleta"
        >
          <svg class="w-6 h-6 group-hover:scale-110 transition-transform">
            <use href="${sprite}#circle-plus"></use>
          </svg>
          <span class="font-medium">Agregar nueva caleta</span>
        </button>
      </div>
    </div>
  </div>
`;

export { SelectExchange, SelectExchangeLoading };
export default SelectExchange;
