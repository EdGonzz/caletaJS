import Button from "./Button";
import { getSource, DEFAULT_SOURCE, deleteSource } from "../utils/sources";
import { deleteHoldingsBySource } from "../utils/holdingsStorage";
import { openConfirmDeleteModal } from "./ConfirmDeleteModal";
import { openAddExchangeModal } from "./AddExchangeModal";
import { openAddAssetModal } from "./AddAssetModal";
import { formatRelativeTime } from "../utils/formatters";
import { escapeHTML } from "../utils/helpers";
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
/** @type {number} Unix timestamp (segundos) de referencia para el cálculo de decay de cooldown. */
let _decayReferenceTimestamp = 0;
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
    const isDefault = name === DEFAULT_SOURCE;

    const iconHtml = image
      ? `<img src="${image}" alt="${escapeHTML(name)}" class="w-5 h-5 rounded-md object-contain ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}" width="20" height="20" loading="lazy">`
      : `<svg class="w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}"><use href="${sprite}#layout-dashboard" /></svg>`;

    if (isDefault) {
      let classes = "hover:border-primary/40 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1";
      if (isActive) {
        classes = "bg-primary text-slate-900 font-bold hover:brightness-110 px-3 py-1 border border-primary";
      }
      return `
        <button data-filter="${name}" class="action-filter-btn btn-press group hidden sm:flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ${classes}" aria-pressed="${isActive}">
          ${iconHtml}
          <span>${name}</span>
        </button>
      `;
    } else {
      let containerClasses = "hover:border-primary/40 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white";
      let textAndIconColor = "text-slate-400 group-hover/tab:text-white";
      let btnActionsClasses = "text-slate-400 hover:bg-slate-700/50 hover:text-white";
      if (isActive) {
        containerClasses = "bg-primary border-primary text-slate-900 font-bold hover:brightness-110";
        textAndIconColor = "text-slate-900";
        btnActionsClasses = "text-slate-900 hover:bg-slate-200/50";
      }

      return `
        <div class="group/tab relative hidden sm:flex items-center rounded-lg transition-all duration-200 ${containerClasses}">
          <button data-filter="${escapeHTML(name)}" class="action-filter-btn btn-press flex items-center gap-2 pl-3 pr-2 py-1 text-sm font-medium rounded-l-lg transition-all ${textAndIconColor}" aria-pressed="${isActive}">
            ${iconHtml}
            <span>${escapeHTML(name)}</span>
          </button>
          <div class="relative flex items-center pr-1.5 py-1">
            <button data-wallet-actions="${escapeHTML(name)}" data-state="normal" class="wallet-actions-btn p-1 rounded transition-all ${btnActionsClasses}" aria-label="Acciones de caleta ${escapeHTML(name)}">
              <svg class="w-3.5 h-3.5" aria-hidden="true"><use href="${sprite}#dots-vertical" /></svg>
            </button>
          </div>
        </div>
      `;
    }
  }).join('');

  // Dropdown mobile
  const dropdownOptions = sources.map(source => {
    const name = typeof source === 'string' ? source : source.name;
    const isActive = name === currentFilter;
    const isDefault = name === DEFAULT_SOURCE;

    if (isDefault) {
      return `
        <button
          data-filter="${name}"
          class="action-filter-btn btn-press flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${isActive ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}"
          aria-pressed="${isActive}"
          role="menuitem"
        >${name}</button>
      `;
    } else {
      return `
        <div class="flex items-center justify-between w-full px-1 py-0.5" role="none">
          <button
            data-filter="${escapeHTML(name)}"
            class="action-filter-btn btn-press flex-1 flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-all text-left ${isActive ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}"
            aria-pressed="${isActive}"
            role="menuitem"
          >
            ${escapeHTML(name)}
          </button>
          <button
            data-delete-wallet="${escapeHTML(name)}"
            class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all btn-press shrink-0"
            aria-label="Eliminar caleta ${escapeHTML(name)}"
            role="menuitem"
          >
            <svg class="w-4 h-4" aria-hidden="true"><use href="${sprite}#trash"></use></svg>
          </button>
        </div>
      `;
    }
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
  if (_cooldownLevel > 0 && _decayReferenceTimestamp > 0) {
    let inactiveFor = now - _decayReferenceTimestamp;
    while (_cooldownLevel > 0) {
      const currentCooldown = COOLDOWNS[_cooldownLevel] ?? 600;
      const threshold = currentCooldown * 2;
      if (inactiveFor > threshold) {
        _cooldownLevel--;
        _decayReferenceTimestamp += threshold;
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
/** @type {((e: Event) => void) | null} */
let _walletActionsClickHandler = null;
/** @type {((e: MouseEvent) => void) | null} */
let _globalWalletActionsCloseHandler = null;
/** @type {((e: Event) => void) | null} */
let _mobileWalletDeleteHandler = null;

// ─── Init ─────────────────────────────────────────────────────────────────────


export const initActionToolbar = () => {
  cleanupActionToolbar(true);

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

  // ─── Wallet Actions & Deletion Logic ────────────────────────────────────────
  const resetWalletActionButtons = () => {
    document.querySelectorAll(".wallet-actions-btn").forEach(btn => {
      btn.dataset.state = "normal";
      const container = btn.closest(".group\\/tab");
      const isActive = container?.classList.contains("bg-primary") ?? false;
      btn.className = `wallet-actions-btn p-1 rounded transition-all ${isActive ? 'text-slate-900 hover:bg-slate-200/50' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`;
      btn.innerHTML = `<svg class="w-3.5 h-3.5" aria-hidden="true"><use href="${sprite}#dots-vertical" /></svg>`;
    });
  };

  _walletActionsClickHandler = (e) => {
    e.stopPropagation();
    const btn = /** @type {HTMLButtonElement} */(e.currentTarget);
    const walletName = btn.dataset.walletActions;
    if (!walletName) return;

    const state = btn.dataset.state;

    if (state === "normal") {
      resetWalletActionButtons();

      btn.dataset.state = "delete";
      btn.className = "wallet-actions-btn p-1 rounded transition-all text-red-500 hover:bg-red-500/10";
      btn.innerHTML = `<svg class="w-3.5 h-3.5" aria-hidden="true"><use href="${sprite}#trash" /></svg>`;
    } else {
      executeWalletDeletion(walletName);
    }
  };

  document.querySelectorAll(".wallet-actions-btn").forEach(btn => {
    btn.addEventListener("click", _walletActionsClickHandler);
  });

  // Cerrar menús de acciones de caletas al hacer clic en cualquier parte fuera
  _globalWalletActionsCloseHandler = (e) => {
    const target = /** @type {Node} */(e.target);
    const isClickOnActionButton = target.closest(".wallet-actions-btn") !== null;

    if (!isClickOnActionButton) {
      resetWalletActionButtons();
    }
  };
  document.addEventListener("click", _globalWalletActionsCloseHandler);

  // Función común para eliminar una caleta
  const executeWalletDeletion = (name) => {
    openConfirmDeleteModal({
      title: `Eliminar Caleta "${name}"`,
      message: `¿Estás seguro de que deseas eliminar la caleta "${name}"? Esta acción eliminará todas las transacciones y fondos asociados a ella de forma permanente y no se puede deshacer.`,
      onConfirm: () => {
        try {
          // 1. Eliminar la fuente del listado de sources
          deleteSource(name);

          // 2. Eliminar todas las transacciones (holdings) asociadas a esta fuente
          deleteHoldingsBySource(name);

          // 3. Si era el filtro activo, redirigir a DEFAULT_SOURCE
          if (currentFilter === name) {
            currentFilter = DEFAULT_SOURCE;
            window.dispatchEvent(new CustomEvent('caleta-filter-changed', { detail: { source: currentFilter } }));
          }

          // 5. Notificar que los holdings han sido actualizados para refrescar la tabla, donuts y grids
          window.dispatchEvent(new CustomEvent('holdings-updated'));
        } catch (err) {
          console.error('[executeWalletDeletion]', err);
          // Mostrar error al usuario sin romper el flujo
          window.dispatchEvent(new CustomEvent('show-error-toast', { detail: { message: `No se pudo eliminar la caleta "${name}".` } }));
        } finally {
          // 4. Volver a renderizar e inicializar el toolbar siempre
          const wrapper = document.getElementById("action-toolbar-wrapper");
          if (wrapper) {
            wrapper.outerHTML = ActionToolbar();
            initActionToolbar();
          }
        }
      }
    });
  };


  // Botón de eliminar caleta en Móvil
  _mobileWalletDeleteHandler = (e) => {
    e.stopPropagation();
    const btn = /** @type {HTMLButtonElement} */(e.currentTarget);
    const walletName = btn.dataset.deleteWallet;
    if (walletName) {
      executeWalletDeletion(walletName);
    }
  };

  document.querySelectorAll('button[data-delete-wallet]').forEach(btn => {
    btn.addEventListener("click", _mobileWalletDeleteHandler);
  });

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
    _decayReferenceTimestamp = _lastFetchTimestamp;
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

  // Restablecer el estado visual del botón de refresco y el indicador inmediatamente
  if (_isFetching) {
    _setButtonState('loading');
  } else if (_cooldownEndTime !== null) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = _cooldownEndTime - now;
    if (remaining > 0) {
      _setButtonState('cooldown', remaining);
    } else {
      _cooldownEndTime = null;
      _setButtonState('idle');
    }
  } else {
    _setButtonState('idle');
  }
  _updateTimestampDisplay();
};

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export const cleanupActionToolbar = (keepState = false) => {
  _stopTickInterval();

  // Resetear estado volátil para evitar que persista entre navegaciones SPA.
  // _isFetching es el más crítico: si un fetch manual estaba en vuelo cuando el
  // usuario navegó (y HoldingsTable también fue limpiado), el evento 'prices-updated'
  // nunca llegaría y el botón quedaría bloqueado hasta el próximo fetch automático.
  if (!keepState) {
    _isFetching = false;
    _cooldownEndTime = null;
    _lastFetchTimestamp = 0;
    _decayReferenceTimestamp = 0;
    _cooldownLevel = 0;
  }

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

  // Limpiar listeners de acciones de wallets
  if (_walletActionsClickHandler) {
    document.querySelectorAll(".wallet-actions-btn").forEach(btn => {
      btn.removeEventListener("click", _walletActionsClickHandler);
    });
    _walletActionsClickHandler = null;
  }
  if (_globalWalletActionsCloseHandler) {
    document.removeEventListener("click", _globalWalletActionsCloseHandler);
    _globalWalletActionsCloseHandler = null;
  }
  if (_mobileWalletDeleteHandler) {
    document.querySelectorAll('button[data-delete-wallet]').forEach(btn => {
      btn.removeEventListener("click", _mobileWalletDeleteHandler);
    });
    _mobileWalletDeleteHandler = null;
  }

};

export default ActionToolbar;
