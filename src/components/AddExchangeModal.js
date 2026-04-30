import getExchange from '../utils/getExchange';
import { addSource, getSource } from '../utils/sources';
import sprite from '../assets/sprite.svg';
import SkeletonRow from '../utils/skeletonRow';
import { debounce } from '../utils/helpers';

// ─── State ─────────────────────────────────────────────────────────────────

/** @type {Array<import('../utils/getExchange').ExchangeResult>} */
let searchResults = [];

/** @type {'idle' | 'loading' | 'error' | 'empty' | 'results'} */
let searchState = 'idle';

/** @type {boolean} Indica si los resultados son la lista por defecto (no una búsqueda) */
let isDefaultList = false;


/**
 * Renders a single exchange result row from the API.
 * @param {object} exchange
 * @param {string} exchange.id
 * @param {string} exchange.name
 * @param {string} [exchange.image]
 * @param {string} [exchange.url]
 * @param {string} [exchange.country]
 * @param {boolean} [exchange.has_trading_incentive]
 * @param {number} [exchange.trust_score]
 * @param {string} [exchange.description]  - Descripción opcional (ej: "Spot", "0x...").
 * @param {boolean} [isSaved] - Si ya existe en localStorage.
 * @returns {string}
 */
const ExchangeResultRow = (exchange, isSaved = false) => {
  const logo = exchange.image
    ? `<div class="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
         <img src="${exchange.image}" alt="${exchange.name}" class="h-full w-full object-contain" loading="lazy" />
       </div>`
    : `<div class="h-12 w-12 rounded-xl border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center">
         <span class="text-lg font-bold text-white">${exchange.name.charAt(0).toUpperCase()}</span>
       </div>`;

  const urlDisplay = exchange.url
    ? new URL(exchange.url).hostname.replace('www.', '')
    : exchange.id;

  const trustDots = exchange.trust_score
    ? `<span class="inline-flex gap-0.5">${Array.from({ length: Math.min(exchange.trust_score, 10) }, (_, i) =>
        `<span class="w-1.5 h-1.5 rounded-full ${i < (exchange.trust_score ?? 0) ? 'bg-primary' : 'bg-slate-700'}"></span>`
      ).join('')}</span>`
    : '';

  const actionBtn = isSaved
    ? `<button
            class="flex min-w-[76px] items-center justify-center rounded-lg h-9 px-4 bg-slate-700/60 text-slate-500 text-sm font-bold cursor-not-allowed select-none"
            aria-label="${exchange.name} ya está guardada como caleta"
            disabled
          >
            <svg class="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true"><use href="${sprite}#check"></use></svg>
            Guardado
          </button>`
    : `<button
            class="save-exchange-btn flex min-w-[76px] items-center justify-center rounded-lg h-9 px-4 bg-primary hover:brightness-110 text-slate-900 text-sm font-bold transition-all shadow-lg shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Guardar ${exchange.name} como caleta"
            data-exchange-id="${exchange.id}"
            data-exchange-name="${exchange.name}"
            data-exchange-image="${exchange.image ?? ''}"
            data-exchange-url="${exchange.url ?? ''}"
          >
            Guardar
          </button>`;

  return `
    <div
      class="exchange-api-row flex flex-col gap-0 px-4 py-3 hover:bg-slate-800/50 rounded-lg transition-colors cursor-default"
      data-exchange-id="${exchange.id}"
    >
      <!-- Main row -->
      <div class="flex items-center gap-4 justify-between min-w-0">
        <div class="flex items-center gap-4 min-w-0">
          ${logo}
          <div class="flex flex-col justify-center min-w-0">
            <p class="text-white text-base font-semibold leading-normal truncate">${exchange.name}</p>
            <p class="text-slate-400 text-sm font-normal leading-normal truncate">${urlDisplay}</p>
            ${trustDots ? `<div class="flex items-center gap-1.5 mt-1">${trustDots}<span class="text-xs text-slate-500">Trust</span></div>` : ''}
          </div>
        </div>
        <div class="shrink-0">
          ${actionBtn}
        </div>
      </div>

      <!-- Description form (hidden until "Guardar" is pressed) -->
      <div
        class="desc-form hidden mt-2 items-center gap-2"
        aria-label="Descripción de la caleta"
      >
        <input
          type="text"
          class="desc-input flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
          placeholder='Ej: Spot, Futures, 0x71C7...3A92'
          maxlength="60"
          aria-label="Descripción corta de esta caleta"
        />
        <button
          class="desc-confirm-btn flex items-center justify-center rounded-lg h-8 px-3 bg-primary hover:brightness-110 text-slate-900 text-xs font-bold transition-all focus:outline-none shrink-0"
          aria-label="Confirmar y guardar caleta"
        >✓</button>
        <button
          class="desc-cancel-btn flex items-center justify-center rounded-lg h-8 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-all focus:outline-none shrink-0"
          aria-label="Cancelar"
        >✕</button>
      </div>
    </div>
  `;
};

/**
 * Estado vacío cuando la búsqueda no retorna resultados.
 * @param {string} term
 * @returns {string}
 */
const EmptyState = (term) => `
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <svg class="w-12 h-12 text-slate-600 mb-4"><use href="${sprite}#search"></use></svg>
    <p class="text-slate-400 font-medium mb-1">Sin resultados para "<span class="text-white">${term}</span>"</p>
    <p class="text-slate-500 text-sm">Intenta con el nombre exacto del exchange en CoinGecko.</p>
  </div>
`;

/**
 * Estado de error al hacer la búsqueda.
 * @returns {string}
 */
const ErrorState = () => `
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <svg class="w-12 h-12 text-rose-500/60 mb-4"><use href="${sprite}#circle-x"></use></svg>
    <p class="text-slate-300 font-medium mb-1">Error al conectar con la API</p>
    <p class="text-slate-500 text-sm">Verifica tu conexión e intenta de nuevo.</p>
  </div>
`;

/**
 * Estado inicial (sin búsqueda activa).
 * @returns {string}
 */
const IdleState = () => `
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <svg class="w-12 h-12 text-slate-600 mb-4"><use href="${sprite}#search"></use></svg>
    <p class="text-slate-400 font-medium">Busca un exchange por nombre</p>
    <p class="text-slate-500 text-sm mt-1">Por ejemplo: Kraken, KuCoin, Bybit…</p>
  </div>
`;

// ─── Main view ─────────────────────────────────────────────────────────────

/**
 * Renders the inner content of the Add Exchange Modal.
 * @returns {string}
 */
const AddExchangeModalContent = () => `
  <div id="add-exchange-modal-inner" class="flex flex-col flex-1 min-h-0">

    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
      <div class="flex items-center gap-3">
        <button
          id="add-exchange-back-btn"
          class="flex items-center justify-center p-2 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white focus:outline-none"
          aria-label="Volver"
        >
          <svg class="w-5 h-5"><use href="${sprite}#arrow-left"></use></svg>
        </button>
        <h2 class="text-white text-lg font-bold tracking-tight">Agregar Nueva Caleta</h2>
      </div>
      <button
        id="add-exchange-close-btn"
        class="flex items-center justify-center rounded-lg h-9 w-9 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus:outline-none"
        aria-label="Cerrar modal"
      >
        <svg class="w-5 h-5"><use href="${sprite}#close"></use></svg>
      </button>
    </header>

    <!-- Search Section -->
    <div class="px-6 pt-6 pb-4">
      <p class="text-slate-400 text-sm mb-4">
        Conecta un nuevo exchange buscando en la base de datos de CoinGecko.
      </p>
      <div class="flex w-full rounded-xl overflow-hidden border border-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all bg-slate-900/50">
        <div class="flex items-center justify-center pl-4 text-slate-400 shrink-0">
          <svg class="w-5 h-5"><use href="${sprite}#search"></use></svg>
        </div>
        <input
          id="add-exchange-search-input"
          type="text"
          placeholder="Busca exchanges (ej. Kraken, KuCoin)…"
          aria-label="Buscar exchange en CoinGecko"
          autocomplete="off"
          class="flex-1 bg-transparent px-3 py-3.5 text-white text-sm placeholder-slate-500 focus:outline-none"
        />
        <button
          id="add-exchange-search-btn"
          class="shrink-0 px-4 text-sm font-semibold text-slate-900 bg-primary hover:brightness-110 transition-all focus:outline-none"
          aria-label="Ejecutar búsqueda"
        >
          Buscar
        </button>
      </div>
    </div>

    <!-- Results header -->
    <div id="add-exchange-results-label" class="px-6 pb-2 hidden">
      <h3 id="add-exchange-results-label-text" class="text-slate-400 text-xs font-bold uppercase tracking-wider">Populares en CoinGecko</h3>
    </div>

    <!-- Results container -->
    <div
      id="add-exchange-results"
      class="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2"
      aria-live="polite"
      aria-label="Resultados de búsqueda de exchanges"
    >
      ${IdleState()}
    </div>

    <!-- Footer -->
    <div class="p-6 border-t border-slate-700/50 bg-slate-900/30 shrink-0">
      <p class="text-center text-xs text-slate-500">
        ¿No encuentras tu exchange? Asegúrate de que el nombre coincida con el directorio de
        <a href="https://www.coingecko.com/en/exchanges" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">CoinGecko</a>.
      </p>
    </div>
  </div>
`;

// ─── Wire Logic ────────────────────────────────────────────────────────────

/**
 * Callback invocado al guardar un exchange. Puede ser sobrescrito por el llamador.
 * @type {((exchange: {id: string, name: string, image: string, url: string, description: string}) => void) | null}
 */
let onSaveCallback = null;

/**
 * Devuelve el Set de IDs de exchanges ya guardados en localStorage.
 * @returns {Set<string>}
 */
const getSavedIds = () => {
  const sources = getSource();
  return new Set(
    sources
      .filter((s) => typeof s === 'object' && s !== null && typeof s.id === 'string')
      .map((s) => s.id)
  );
};

/**
 * Renders the results area based on current state.
 * @param {string} [term]
 */
const renderResults = (term = '') => {
  const container = document.getElementById('add-exchange-results');
  const label = document.getElementById('add-exchange-results-label');
  const labelText = document.getElementById('add-exchange-results-label-text');
  if (!container) return;

  if (searchState === 'loading') {
    label?.classList.add('hidden');
    container.innerHTML = Array.from({ length: 4 }, () => SkeletonRow({
      avatarShape: 'rounded-xl',
      avatarSize: 'h-12 w-12',
      titleWidth: 'w-36',
      subtitleWidth: 'w-24',
      actionSize: 'h-9 w-20',
      padding: 'px-4 py-3',
    })).join('');
    return;
  }

  if (searchState === 'error') {
    label?.classList.add('hidden');
    container.innerHTML = ErrorState();
    return;
  }

  if (searchState === 'empty') {
    label?.classList.add('hidden');
    container.innerHTML = EmptyState(term);
    return;
  }

  if (searchState === 'idle') {
    label?.classList.add('hidden');
    container.innerHTML = IdleState();
    return;
  }

  // Actualiza el label según contexto
  if (labelText) {
    labelText.textContent = isDefaultList
      ? 'Populares en CoinGecko'
      : 'Resultados de CoinGecko';
  }
  label?.classList.remove('hidden');

  const savedIds = getSavedIds();
  container.innerHTML = `
    <div class="flex flex-col divide-y divide-slate-700/50">
      ${searchResults.map((ex) => ExchangeResultRow(ex, savedIds.has(ex.id))).join('')}
    </div>
  `;

  // Wire Save buttons — al hacer clic muestra el mini-form de descripción
  container.querySelectorAll('.save-exchange-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.exchange-api-row');
      const descForm = row?.querySelector('.desc-form');
      if (!descForm) return;

      // Mostrar form, ocultar btn temporalmente
      btn.classList.add('hidden');
      descForm.classList.remove('hidden');
      descForm.classList.add('flex');
      /** @type {HTMLInputElement|null} */ (descForm.querySelector('.desc-input'))?.focus();

      const confirmSave = () => {
        const descInput = /** @type {HTMLInputElement|null} */ (descForm.querySelector('.desc-input'));
        const exchange = {
          id: btn.dataset.exchangeId ?? '',
          name: btn.dataset.exchangeName ?? '',
          image: btn.dataset.exchangeImage ?? '',
          // url: btn.dataset.exchangeUrl ?? '',
          description: descInput?.value.trim() ?? '',
        };
        addSource(exchange);
        onSaveCallback?.(exchange);
        closeAddExchangeModal();
      };

      const cancelSave = () => {
        descForm.classList.add('hidden');
        descForm.classList.remove('flex');
        btn.classList.remove('hidden');
      };

      descForm.querySelector('.desc-confirm-btn')?.addEventListener('click', confirmSave, { once: true });
      descForm.querySelector('.desc-cancel-btn')?.addEventListener('click', cancelSave, { once: true });

      // Confirmar con Enter, cancelar con Escape
      /** @type {HTMLInputElement|null} */ (descForm.querySelector('.desc-input'))?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmSave();
        if (e.key === 'Escape') cancelSave();
      }, { once: true });
    });
  });
};

/**
 * Carga los exchanges por defecto desde la API (sin filtro) al abrir el modal.
 */
const loadDefaultExchanges = async () => {
  isDefaultList = true;
  searchState = 'loading';
  renderResults();

  try {
    const data = await getExchange();

    if (!data || !Array.isArray(data)) {
      searchState = 'error';
      renderResults();
      return;
    }

    searchResults = data;
    searchState = 'results';
    renderResults();
  } catch {
    searchState = 'error';
    renderResults();
  }
};

/**
 * Executes the exchange search using getExchange.
 * @param {string} term
 */
const searchExchanges = async (term) => {
  const trimmed = term.trim();
  if (!trimmed) return;

  isDefaultList = false;
  searchState = 'loading';
  // No llamamos renderResults() aquí — el listener de input ya mostró el skeleton.

  try {
    const data = await getExchange();

    if (!data || !Array.isArray(data)) {
      searchState = 'error';
      renderResults(trimmed);
      return;
    }

    const filtered = data.filter((ex) =>
      ex.name?.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (filtered.length === 0) {
      searchState = 'empty';
    } else {
      searchResults = filtered.slice(0, 10);
      searchState = 'results';
    }

    renderResults(trimmed);
  } catch {
    searchState = 'error';
    renderResults(trimmed);
  }
};

// ─── Open / Close ──────────────────────────────────────────────────────────

const closeAddExchangeModal = () => {
  const backdrop = document.getElementById('add-exchange-backdrop');
  const modal = document.getElementById('add-exchange-modal');
  const content = document.getElementById('add-exchange-modal-content');

  backdrop?.classList.add('opacity-0', 'pointer-events-none');
  modal?.classList.add('opacity-0', 'pointer-events-none');
  // Explicitly disable pointer events on content — children with pointer-events-auto
  // still capture clicks even when the parent has pointer-events-none (CSS spec).
  // This prevents the invisible content at z-[111] from blocking clicks on layers below.
  content?.classList.add('pointer-events-none');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  document.body.style.overflow = '';

  // Reset state
  searchResults = [];
  searchState = 'idle';
};

/**
 * Opens the Add Exchange modal.
 * @param {object} [options]
 * @param {() => void} [options.onBack]   - Callback al presionar "Volver"
 * @param {(exchange: {id: string, name: string, image: string, url: string}) => void} [options.onSave] - Callback al guardar exchange
 */
const openAddExchangeModal = ({ onBack, onSave } = {}) => {
  onSaveCallback = onSave ?? null;

  // Reset state
  searchResults = [];
  searchState = 'idle';
  isDefaultList = false;

  const inner = document.getElementById('add-exchange-modal-inner-wrapper');
  if (inner) inner.innerHTML = AddExchangeModalContent();

  const backdrop = document.getElementById('add-exchange-backdrop');
  const modal = document.getElementById('add-exchange-modal');
  const content = document.getElementById('add-exchange-modal-content');

  requestAnimationFrame(() => {
    backdrop?.classList.remove('opacity-0', 'pointer-events-none');
    modal?.classList.remove('opacity-0', 'pointer-events-none');
    content?.classList.remove('scale-95', 'pointer-events-none');
    content?.classList.add('scale-100');
    document.body.style.overflow = 'hidden';

    // Focus search input
    document.getElementById('add-exchange-search-input')?.focus();

    // Carga exchanges por defecto de la API
    loadDefaultExchanges();
  });

  // Wire events — note: these are attached AFTER innerHTML is set, so
  // getElementById finds the freshly-rendered elements (no duplicates).

  // Back button
  document.getElementById('add-exchange-back-btn')?.addEventListener('click', () => {
    closeAddExchangeModal();
    onBack?.();
  });

  // Close button
  document.getElementById('add-exchange-close-btn')?.addEventListener('click', closeAddExchangeModal);

  // Search on button click
  document.getElementById('add-exchange-search-btn')?.addEventListener('click', () => {
    const input = /** @type {HTMLInputElement|null} */ (document.getElementById('add-exchange-search-input'));
    if (input?.value) searchExchanges(input.value);
  });

  const optimizedSearch = debounce(searchExchanges, 500);

  // Live search con debounce — muestra skeleton inmediatamente para feedback visual
  document.getElementById('add-exchange-search-input')?.addEventListener('input', (e) => {
    const input = /** @type {HTMLInputElement} */ (e.target);
    const value = input.value.trim();

    if (!value) {
      // Input vacío → restaurar lista por defecto
      loadDefaultExchanges();
      return;
    }

    // Feedback inmediato: mostrar skeleton solo si no está ya visible
    if (searchState !== 'loading') {
      searchState = 'loading';
      renderResults(value);
    }

    optimizedSearch(value);
  });
};

// ─── Shell (static HTML injected once into the DOM) ───────────────────────

/**
 * Returns the static HTML shell for the Add Exchange Modal.
 * Must be injected into the DOM once; use openAddExchangeModal() to show it.
 * @returns {string}
 */
const AddExchangeModal = () => `
  <!-- Backdrop -->
  <div
    id="add-exchange-backdrop"
    class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-110 transition-opacity opacity-0 pointer-events-none"
    aria-hidden="true"
  ></div>

  <!-- Modal -->
  <div
    id="add-exchange-modal"
    class="fixed inset-0 z-111 flex items-center justify-center p-4 pointer-events-none opacity-0 transition-all duration-300"
    role="dialog"
    aria-modal="true"
    aria-label="Agregar nueva caleta"
  >
    <div
      id="add-exchange-modal-content"
      class="relative w-full max-w-[600px] bg-[#151e32] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden transform scale-95 transition-all duration-300 pointer-events-none max-h-[90vh] flex flex-col"
    >
      <div id="add-exchange-modal-inner-wrapper" class="flex flex-col flex-1 min-h-0"></div>
    </div>
  </div>
`;

/**
 * Wires up the modal keyboard trap (Escape key).
 * Call this once after AddExchangeModal() HTML is in the DOM.
 */
const initAddExchangeModal = () => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('add-exchange-modal');
      if (!modal?.classList.contains('opacity-0')) closeAddExchangeModal();
    }
  });

  document.getElementById('add-exchange-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'add-exchange-modal') closeAddExchangeModal();
  });
};

export { openAddExchangeModal, initAddExchangeModal };
export default AddExchangeModal;
