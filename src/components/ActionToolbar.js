import Button from "./Button";
import { getSource, DEFAULT_SOURCE } from "../utils/sources";
import { openAddExchangeModal } from "./AddExchangeModal";
import { openAddAssetModal } from "./AddAssetModal";
import { formatRelativeTime } from "../utils/formatters";
import sprite from "../assets/sprite.svg";

export let currentFilter = DEFAULT_SOURCE;

// ─── Cooldown Config ─────────────────────────────────────────────────────────
/** Niveles de cooldown en segundos (se escala con cada refresh manual). */
const COOLDOWNS = [60, 120, 300, 600];

/** @type {number} Nivel de cooldown actual (0–3). */
let _cooldownLevel = 0;
/** @type {number | null} Unix timestamp (segundos) del fin del cooldown activo. */
let _cooldownEndTime = null;
/** @type {number} Unix timestamp (segundos) del último fetch exitoso. */
let _lastFetchTimestamp = 0;
/** @type {ReturnType<typeof setInterval> | null} ID del intervalo de tick. */
let _tickInterval = null;
/** @type {boolean} Guard para evitar peticiones concurrentes. */
let _isFetching = false;

// ─── Component ───────────────────────────────────────────────────────────────

const ActionToolbar = () => {
  const sources = getSource();

  const activeSource = sources.find(s => {
    const name = typeof s === 'string' ? s : s.name;
    return name === currentFilter;
  });
  const activeName = typeof activeSource === 'string' ? activeSource : activeSource?.name;
  const activeImage = typeof activeSource === 'object' ? activeSource?.image : null;

  // Tabs para desktop
  const tabsHtml = sources.map(source => {
    const name = typeof source === 'string' ? source : source.name;
    const image = typeof source === 'object' ? source.image : null;
    const isActive = name === currentFilter;

    let classes = "hover:border-primary/40 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1";
    if (isActive) {
      classes = "bg-primary text-slate-900 font-bold hover:brightness-110 px-3 py-1 border border-primary";
    }

    const iconHtml = image
      ? `<img src="${image}" alt="${name}" class="w-5 h-5 rounded-md object-contain ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}" width="20" height="20" loading="lazy">`
      : `<svg class="w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}"><use href="${sprite}#layout-dashboard" /></svg>`;

    return `
      <button data-filter="${name}" class="action-filter-btn btn-press group hidden sm:flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ${classes}" aria-pressed="${isActive}">
        ${iconHtml}
        <span>${name}</span>
      </button>
    `;
  }).join('');

  // Dropdown mobile
  const dropdownOptions = sources.map(source => {
    const name = typeof source === 'string' ? source : source.name;
    const isActive = name === currentFilter;
    return `
      <button
        data-filter="${name}"
        class="action-filter-btn btn-press flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${isActive ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}"
        aria-pressed="${isActive}"
        role="menuitem"
      >${name}</button>
    `;
  }).join('');

  const view = `
    <div id="action-toolbar-wrapper">
      <section class="flex items-center justify-between gap-3">
        <!-- Desktop tabs -->
        <div class="hidden sm:flex items-center gap-3 overflow-x-auto custom-scrollbar scroll-fade-container">
          ${tabsHtml}
          ${Button("add-wallet", "plus", "Add Wallet", "text-slate-400 hover:text-white")}
        </div>

        <!-- Mobile dropdown trigger -->
        <div class="sm:hidden relative" id="filter-dropdown-wrapper">
          <button id="filter-dropdown-btn" class="btn-press flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700 hover:border-primary/40 rounded-lg text-slate-300 text-sm font-medium transition-all" aria-haspopup="true" aria-expanded="false" aria-label="Seleccionar fuente">
            ${activeImage ? `<img src="${activeImage}" alt="${activeName}" class="w-4 h-4 rounded object-contain" width="16" height="16" loading="lazy">` : ''}
            <span>${activeName || 'Caletas'}</span>
            <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" id="filter-dropdown-chevron"><use href="${sprite}#chevron-down" /></svg>
          </button>
          <div id="filter-dropdown-menu" class="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1 z-40 hidden" role="menu">
            ${dropdownOptions}
          </div>
        </div>

        <!-- Right group: indicator + refresh + add funds -->
        <div class="flex items-center gap-3 shrink-0">
          <!-- Indicador "last update" — visible solo en sm+ -->
          <span
            id="last-update-indicator"
            aria-live="polite"
            aria-atomic="true"
            class="text-xs text-slate-400 hidden sm:inline"
          ></span>

          <!-- Botón de refresco con cooldown -->
          <button
            id="refresh-prices-btn"
            aria-label="Refresh prices"
            class="btn-press flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-300 text-sm font-medium transition-all"
          >
            <svg id="refresh-btn-icon" class="w-4 h-4 text-slate-400 transition-transform" aria-hidden="true">
              <use href="${sprite}#refresh" />
            </svg>
            <span class="btn-label">Refresh</span>
            <span class="cooldown-text hidden text-slate-400 tabular-nums"></span>
          </button>

          ${Button("add-funds", "plus", "Add Funds", "btn-hover-glow bg-primary text-slate-900 font-bold hover:brightness-110 px-3 py-1")}
        </div>
      </section>
    </div>
  `;

  return view;
};

// ─── Button State Machine ─────────────────────────────────────────────────────

/**
 * Actualiza el estado visual del botón de refresco.
 * @param {'idle' | 'loading' | 'cooldown' | 'error'} state
 * @param {number} [remaining] - Segundos restantes (solo en estado 'cooldown').
 */
const _setButtonState = (state, remaining = 0) => {
  const btn = document.getElementById('refresh-prices-btn');
  if (!btn) return;

  const icon = btn.querySelector('#refresh-btn-icon');
  const label = btn.querySelector('.btn-label');
  const cooldownText = btn.querySelector('.cooldown-text');

  // Reset clases del botón
  btn.classList.remove(
    'border-red-500/50', 'hover:border-red-500/70', 'text-red-400',
    'opacity-60', 'cursor-not-allowed'
  );

  switch (state) {
    case 'idle':
      btn.disabled = false;
      btn.setAttribute('aria-label', 'Refresh prices');
      icon?.classList.remove('animate-spin', 'hidden');
      label?.classList.remove('hidden');
      label && (label.textContent = 'Refresh');
      cooldownText?.classList.add('hidden');
      break;

    case 'loading':
      btn.disabled = true;
      btn.setAttribute('aria-label', 'Refreshing prices, please wait');
      btn.classList.add('opacity-60', 'cursor-not-allowed');
      icon?.classList.add('animate-spin');
      icon?.classList.remove('hidden');
      label?.classList.remove('hidden');
      label && (label.textContent = 'Updating...');
      cooldownText?.classList.add('hidden');
      break;

    case 'cooldown': {
      btn.disabled = true;
      btn.setAttribute('aria-label', `Refresh available in ${remaining} seconds`);
      btn.classList.add('opacity-60', 'cursor-not-allowed');
      icon?.classList.remove('animate-spin');
      icon?.classList.add('hidden');
      label?.classList.add('hidden');
      cooldownText?.classList.remove('hidden');
      cooldownText && (cooldownText.textContent = `Wait ${remaining}s`);
      break;
    }

    case 'error':
      btn.disabled = false;
      btn.setAttribute('aria-label', 'Refresh failed. Click to retry');
      btn.classList.add('border-red-500/50', 'hover:border-red-500/70', 'text-red-400');
      icon?.classList.remove('animate-spin', 'hidden');
      label?.classList.remove('hidden');
      label && (label.textContent = 'Failed');
      cooldownText?.classList.add('hidden');
      break;
  }
};

// ─── Tick Interval ────────────────────────────────────────────────────────────

/** Actualiza el indicador de última actualización y controla fin de cooldown. */
const _updateTimestampDisplay = () => {
  const indicator = document.getElementById('last-update-indicator');
  const now = Math.floor(Date.now() / 1000);

  // 1. Actualizar indicador de última carga
  if (indicator && _lastFetchTimestamp > 0) {
    const elapsed = now - _lastFetchTimestamp;
    indicator.textContent = `Updated ${formatRelativeTime(elapsed)}`;
  }

  // 2. Controlar finalización del Cooldown
  if (!_isFetching && _cooldownEndTime !== null) {
    const remaining = _cooldownEndTime - now;
    if (remaining > 0) {
      _setButtonState('cooldown', remaining);
    } else {
      _cooldownEndTime = null;
      _setButtonState('idle');
    }
  }

  // 3. Decremento progresivo del nivel de Cooldown por inactividad prolongada.
  // Nota: se usa COOLDOWNS[_cooldownLevel] (nivel ya incrementado) como umbral,
  // lo que hace el decay más lento de forma intencional (anti-abuse progresivo).
  // Ej: tras el primer refresh manual, el nivel sube de 0 → 1, por lo que el
  // umbral de decay es COOLDOWNS[1]*2 = 240s en lugar de COOLDOWNS[0]*2 = 120s.
  // Decrementamos el nivel de cooldown de forma progresiva según la inactividad acumulada.
  if (_cooldownLevel > 0 && _lastFetchTimestamp > 0) {
    let inactiveFor = now - _lastFetchTimestamp;
    while (_cooldownLevel > 0) {
      const currentCooldown = COOLDOWNS[_cooldownLevel] ?? 600;
      const threshold = currentCooldown * 2;
      if (inactiveFor > threshold) {
        _cooldownLevel--;
        _lastFetchTimestamp += threshold;
        inactiveFor -= threshold;
      } else {
        break;
      }
    }
  }
};

const _startTickInterval = () => {
  if (_tickInterval !== null) clearInterval(_tickInterval);
  _tickInterval = setInterval(_updateTimestampDisplay, 1000);
};

const _stopTickInterval = () => {
  if (_tickInterval !== null) {
    clearInterval(_tickInterval);
    _tickInterval = null;
  }
};

// ─── Event Handlers (module-level refs for cleanup) ───────────────────────────

/** @type {((e: Event) => void) | null} */
let _scrollFadeHandler = null;
/** @type {((e: Event) => void) | null} */
let _clickDropdownHandler = null;
/** @type {((e: Event) => void) | null} */
let _pricesUpdatedHandler = null;
/** @type {((e: Event) => void) | null} */
let _pricesFailedHandler = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export const initActionToolbar = () => {
  cleanupActionToolbar();

  // Add Wallet
  const addWalletBtn = document.getElementById("add-wallet");
  if (addWalletBtn) {
    addWalletBtn.addEventListener("click", () => {
      openAddExchangeModal({
        onSave: () => {
          const wrapper = document.getElementById("action-toolbar-wrapper");
          if (wrapper) {
            wrapper.outerHTML = ActionToolbar();
            initActionToolbar();
          }
        }
      });
    });
  }

  // Add Funds
  const addFundsBtn = document.getElementById("add-funds");
  if (addFundsBtn) {
    addFundsBtn.addEventListener("click", () => {
      openAddAssetModal();
    });
  }

  // Mobile dropdown toggle
  const dropdownBtn = document.getElementById("filter-dropdown-btn");
  const dropdownMenu = document.getElementById("filter-dropdown-menu");
  const dropdownChevron = document.getElementById("filter-dropdown-chevron");
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", () => {
      const isOpen = !dropdownMenu.classList.contains("hidden");
      dropdownMenu.classList.toggle("hidden");
      dropdownBtn.setAttribute("aria-expanded", String(!isOpen));
      dropdownChevron?.classList.toggle("rotate-180", !isOpen);
    });

    _clickDropdownHandler = (e) => {
      if (dropdownBtn && dropdownMenu && !dropdownBtn.contains(/** @type {Node} */(e.target)) && !dropdownMenu.contains(/** @type {Node} */(e.target))) {
        dropdownMenu.classList.add("hidden");
        dropdownBtn.setAttribute("aria-expanded", "false");
        dropdownChevron?.classList.remove("rotate-180");
      }
    };
    document.addEventListener("click", _clickDropdownHandler);
  }

  // Filter Buttons (desktop + dropdown)
  document.querySelectorAll('.action-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = /** @type {HTMLButtonElement} */(e.currentTarget).dataset.filter;
      if (currentFilter !== filter) {
        currentFilter = filter ?? currentFilter;
        window.dispatchEvent(new CustomEvent('caleta-filter-changed', { detail: { source: currentFilter } }));
        const wrapper = document.getElementById("action-toolbar-wrapper");
        if (wrapper) {
          wrapper.outerHTML = ActionToolbar();
          initActionToolbar();
        }
      }
      dropdownMenu?.classList.add("hidden");
      dropdownBtn?.setAttribute("aria-expanded", "false");
      dropdownChevron?.classList.remove("rotate-180");
    });
  });

  // Scroll fade indicator
  const scrollContainer = document.querySelector('#action-toolbar-wrapper .scroll-fade-container');
  if (scrollContainer && !_scrollFadeHandler) {
    _scrollFadeHandler = () => {
      const isEnd = scrollContainer.scrollWidth - scrollContainer.scrollLeft <= scrollContainer.clientWidth + 5;
      scrollContainer.classList.toggle('scroll-end', isEnd);
    };
    scrollContainer.addEventListener('scroll', _scrollFadeHandler, { passive: true });
    _scrollFadeHandler();
  }

  // ── Refresh Button ──────────────────────────────────────────────────────────
  const refreshBtn = document.getElementById('refresh-prices-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (_isFetching || _cooldownEndTime !== null) return;

      _isFetching = true;
      _setButtonState('loading');
      window.dispatchEvent(new CustomEvent('request-prices-refresh', { detail: { manual: true } }));
    });
  }

  // ── Listen for prices-updated ───────────────────────────────────────────────
  _pricesUpdatedHandler = (e) => {
    const { isManual = false, fetchFailed = false } = /** @type {CustomEvent} */(e).detail ?? {};

    // Si el fetch falló, 'prices-update-failed' ya manejó el estado del botón.
    // Solo actualizamos el cooldown y el timestamp en el path exitoso.
    if (fetchFailed) return;

    _lastFetchTimestamp = Math.floor(Date.now() / 1000);
    _isFetching = false;

    if (isManual) {
      // Escalar cooldown
      const cooldownDuration = COOLDOWNS[_cooldownLevel] ?? 600;
      _cooldownLevel = Math.min(_cooldownLevel + 1, COOLDOWNS.length - 1);
      _cooldownEndTime = _lastFetchTimestamp + cooldownDuration;
      _setButtonState('cooldown', cooldownDuration);
    } else {
      // Refresh automático/inicial — no penaliza cooldown
      _setButtonState('idle');
    }

    // Actualizar indicador inmediatamente
    _updateTimestampDisplay();
  };
  window.addEventListener('prices-updated', _pricesUpdatedHandler);

  // ── Listen for prices-update-failed ────────────────────────────────────────
  _pricesFailedHandler = (e) => {
    const { isManual = false } = /** @type {CustomEvent} */(e).detail ?? {};
    _isFetching = false;

    if (isManual) {
      _setButtonState('error');
      // Volver a idle tras 1.5s — no penaliza cooldown
      setTimeout(() => {
        if (!_isFetching && _cooldownEndTime === null) {
          _setButtonState('idle');
        }
      }, 1500);
    } else {
      _setButtonState('idle');
    }
  };
  window.addEventListener('prices-update-failed', _pricesFailedHandler);

  // Arrancar tick interval para el indicador de tiempo
  _startTickInterval();
};

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export const cleanupActionToolbar = () => {
  _stopTickInterval();

  // Resetear estado volátil para evitar que persista entre navegaciones SPA.
  // _isFetching es el más crítico: si un fetch manual estaba en vuelo cuando el
  // usuario navegó (y HoldingsTable también fue limpiado), el evento 'prices-updated'
  // nunca llegaría y el botón quedaría bloqueado hasta el próximo fetch automático.
  _isFetching = false;
  _cooldownEndTime = null;
  _lastFetchTimestamp = 0;
  _cooldownLevel = 0;

  if (_scrollFadeHandler) {
    const scrollContainer = document.querySelector('#action-toolbar-wrapper .scroll-fade-container');
    if (scrollContainer) scrollContainer.removeEventListener('scroll', _scrollFadeHandler);
    _scrollFadeHandler = null;
  }
  if (_clickDropdownHandler) {
    document.removeEventListener("click", _clickDropdownHandler);
    _clickDropdownHandler = null;
  }
  if (_pricesUpdatedHandler) {
    window.removeEventListener('prices-updated', _pricesUpdatedHandler);
    _pricesUpdatedHandler = null;
  }
  if (_pricesFailedHandler) {
    window.removeEventListener('prices-update-failed', _pricesFailedHandler);
    _pricesFailedHandler = null;
  }
};

export default ActionToolbar;
