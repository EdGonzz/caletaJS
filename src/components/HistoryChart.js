/**
 * @fileoverview HistoryChart — Gráfico de historial de portafolio con manejo robusto de errores.
 */

import { createChart, AreaSeries } from "lightweight-charts";
import { buildPortfolioHistorySeries } from "../utils/chartDataAdapter.js";
import { currentFilter } from "./ActionToolbar.js";
import { ApiError, ErrorType, getErrorMessage } from "../utils/errors.js";
import sprite from "../assets/sprite.svg";

const HistoryChart = () => {
  const periods = [
    { label: "1d", days: 1 },
    { label: "7d", days: 7 },
    { label: "30d", days: 30, active: true },
    { label: "90d", days: 90 },
    { label: "1y", days: 365 },
  ];

  const periodButtons = periods
    .map(
      ({ label, days, active }, i, arr) => {
        const isFirst = i === 0;
        const isLast = i === arr.length - 1;
        const radius = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
        return `<button
        class="${active ? "bg-primary/20 text-primary font-semibold" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} ${radius} px-3 py-1 text-xs transition-all btn-press"
        data-days="${days}"
        aria-label="Mostrar historial de ${label}"
        aria-pressed="${active ? "true" : "false"}"
      >${label}</button>`;
      },
    )
    .join("");

  return `
    <div class="glass-panel flex h-full flex-col rounded-xl p-6 lg:col-span-8">
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-bold text-white">History</h3>
          <span class="material-symbols-outlined cursor-help text-sm text-slate-500" aria-label="Portfolio value over time">info</span>
        </div>
        <div id="history-period-selector" class="flex rounded-full border border-slate-700/50 bg-slate-800/50 p-0.5" role="group" aria-label="Selector de período">
          ${periodButtons}
        </div>
      </div>
      <div id="history-chart-container" class="relative flex-1 w-full min-h-55 flex items-center justify-center">
        <!-- Renderizado dinámico o estados de carga/vacío/error -->
      </div>
    </div>
  `;
};

/** @type {ReturnType<typeof createChart> | null} */
let _chart = null;
/** @type {import('lightweight-charts').ISeriesApi<'Area'> | null} */
let _series = null;
/** @type {AbortController | null} */
let _abortController = null;
/** @type {number} */
let _requestId = 0;
/** @type {(() => void) | null} */
let _holdingsHandler = null;
/** @type {(() => void) | null} */
let _filterHandler = null;
/** @type {number} */
let _currentDays = 30;

export const initHistoryChart = async () => {
  const container = document.getElementById("history-chart-container");
  if (!container) return;

  // Cleanup de cualquier instancia previa
  cleanupHistoryChart(false);

  const currentRequest = ++_requestId;
  _abortController = new AbortController();

  // Registrar handler para cuando se actualizan holdings y recargar gráfico
  if (!_holdingsHandler) {
    _holdingsHandler = () => {
      initHistoryChart();
    };
    window.addEventListener("holdings-updated", _holdingsHandler);
  }

  // Registrar handler para cuando cambia el filtro de caleta (filter changed)
  if (!_filterHandler) {
    _filterHandler = () => {
      initHistoryChart();
    };
    window.addEventListener("caleta-filter-changed", _filterHandler);
  }

  // Mostrar loading state
  showLoadingState(container);

  // Cargar datos iniciales (período seleccionado actual y filtro activo)
  let data;
  try {
    data = await buildPortfolioHistorySeries(_currentDays, _abortController.signal, currentFilter);
  } catch (err) {
    // Guard: si la petición fue cancelada, no hacer nada (stale request)
    if (err instanceof ApiError && err.type === ErrorType.ABORT) return;
    if (err?.name === 'AbortError') return;

    // Guard: si el request es stale, ignorar
    if (currentRequest !== _requestId) return;

    // Error real de API → mostrar estado de error con mensaje personalizado
    if (!document.body.contains(container)) return;
    showErrorState(container, err instanceof ApiError ? err.type : ErrorType.UNKNOWN, _currentDays);
    return;
  }

  // Guard: invalidar si el request es stale o el contenedor fue removido
  if (currentRequest !== _requestId || !document.body.contains(container)) {
    return;
  }

  if (!data || data.length === 0) {
    showEmptyState(container);
    return;
  }

  // Limpiar loading state previo
  container.innerHTML = "";

  // Crear el chart
  _chart = createChart(container, {
    autoSize: true,
    layout: {
      background: { color: "transparent" },
      textColor: "#94a3b8",
    },
    grid: {
      vertLines: { color: "rgba(30, 41, 59, 0.5)" },
      horzLines: { color: "rgba(30, 41, 59, 0.5)" },
    },
    crosshair: {
      mode: 1,
      vertLine: { color: "#0bd570", width: 1, style: 3 },
      horzLine: { color: "#0bd570", width: 1, style: 3 },
    },
    rightPriceScale: { borderColor: "rgba(51, 65, 85, 0.5)" },
    timeScale: { borderColor: "rgba(51, 65, 85, 0.5)", timeVisible: true, secondsVisible: false },
    handleScroll: false,
    handleScale: false,
  });

  _series = _chart.addSeries(AreaSeries, {
    lineColor: "#0bd570",
    topColor: "rgba(11, 213, 112, 0.2)",
    bottomColor: "rgba(11, 213, 112, 0.0)",
    lineWidth: 2,
    priceFormat: { type: "price", precision: 2, minMove: 0.01 },
  });

  // Inyectar datos ya fetcheados
  _series.setData(data);
  _chart.timeScale().fitContent();

  // Configurar botones de período
  const selector = document.getElementById("history-period-selector");
  if (selector) {
    // Clonar para limpiar event listeners previos
    const newSelector = selector.cloneNode(true);
    if (selector.parentNode) {
      selector.parentNode.replaceChild(newSelector, selector);
    }

    const buttons = newSelector.querySelectorAll("button");
    buttons.forEach((btn, index) => {
      const btnDays = Number(btn.dataset.days);
      const isActive = btnDays === _currentDays;

      // Sincronizar estilo inicial con _currentDays (conservando el radius original)
      const isFirst = index === 0;
      const isLast = index === buttons.length - 1;
      const radius = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
      const activeClass = isActive ? "bg-primary/20 text-primary font-semibold" : "text-slate-400 hover:bg-slate-700/50 hover:text-white";
      btn.className = `${activeClass} ${radius} px-3 py-1 text-xs transition-all btn-press`;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");

      btn.addEventListener("click", async (e) => {
        const days = Number(e.currentTarget.dataset.days);
        _currentDays = days;

        // Guardar referencia al botón anteriormente activo para fallback
        const prevActiveButton = Array.from(buttons).find((b) => b.getAttribute("aria-pressed") === "true") || btn;

        // Actualizar UI activa de los botones eager
        buttons.forEach((b, bi) => {
          const isBFirst = bi === 0;
          const isBLast = bi === buttons.length - 1;
          const bRadius = isBFirst ? 'rounded-l-full' : isBLast ? 'rounded-r-full' : '';
          const bActive = b === e.currentTarget;
          b.className = `${bActive ? "bg-primary/20 text-primary font-semibold" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} ${bRadius} px-3 py-1 text-xs transition-all btn-press`;
          b.setAttribute("aria-pressed", bActive ? "true" : "false");
        });

        // Cancelar petición previa y crear nueva
        const periodRequest = ++_requestId;
        if (_abortController) {
          _abortController.abort();
        }
        _abortController = new AbortController();

        // Mostrar loading en el container del chart
        if (container) showLoadingState(container);

        // Fetch nuevos datos y actualizar serie
        let newData;
        try {
          newData = await buildPortfolioHistorySeries(days, _abortController.signal, currentFilter);
        } catch (err) {
          if (err instanceof ApiError && err.type === ErrorType.ABORT) return;
          if (err?.name === 'AbortError') return;
          if (periodRequest !== _requestId) return;

          // Error real → mostrar en el contenedor y revertir botón
          if (container) showErrorState(container, err instanceof ApiError ? err.type : ErrorType.UNKNOWN, days);
          // Revertir UI al botón previamente activo
          buttons.forEach((b, bi) => {
            const isBFirst = bi === 0;
            const isBLast = bi === buttons.length - 1;
            const bRadius = isBFirst ? 'rounded-l-full' : isBLast ? 'rounded-r-full' : '';
            const bActive = b === prevActiveButton;
            b.className = `${bActive ? "bg-primary/20 text-primary font-semibold" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} ${bRadius} px-3 py-1 text-xs transition-all btn-press`;
            b.setAttribute("aria-pressed", bActive ? "true" : "false");
          });
          _currentDays = Number(prevActiveButton.dataset.days);
          return;
        }

        if (periodRequest !== _requestId || _abortController.signal.aborted) {
          return;
        }

        // Remover el overlay de carga si existe
        container.querySelector('.chart-loading-overlay')?.remove();

        if (newData.length > 0) {
          if (_series && _chart) {
            // Chart vivo: actualizar datos directamente
            _series.setData(newData);
            _chart.timeScale().fitContent();
          } else {
            // Chart destruido (estado de error previo) — re-inicializar
            initHistoryChart();
          }
        } else {
          // Sin datos: revertir UI al botón previamente activo
          buttons.forEach((b, bi) => {
            const isBFirst = bi === 0;
            const isBLast = bi === buttons.length - 1;
            const bRadius = isBFirst ? 'rounded-l-full' : isBLast ? 'rounded-r-full' : '';
            const bActive = b === prevActiveButton;
            b.className = `${bActive ? "bg-primary/20 text-primary font-semibold" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} ${bRadius} px-3 py-1 text-xs transition-all btn-press`;
            b.setAttribute("aria-pressed", bActive ? "true" : "false");
          });
          // Revertir _currentDays al valor del botón previamente activo
          _currentDays = Number(prevActiveButton.dataset.days);
          if (_chart) { _chart.remove(); _chart = null; _series = null; }
          if (container) showEmptyState(container);
        }
      });
    });
  }
};

// HMR: Vanilla JS - cleanup before module replacement
if (typeof module !== "undefined" && module.hot) {
  module.hot.dispose(() => {
    cleanupHistoryChart(true);
  });
  module.hot.accept(() => {
    // Re-inicializar en el próximo ciclo del router
  });
}

/**
 * Cleanup de las instancias del chart para evitar memory leaks.
 * @param {boolean} [isNavigation=false] - Indica si la limpieza es por navegación SPA.
 */
export const cleanupHistoryChart = (isNavigation = false) => {
  // Cancelar cualquier petición en curso
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }

  // Invalidar requests en vuelo para prevenir race conditions
  _requestId++;

  if (_chart) {
    _chart.remove();
    _chart = null;
    _series = null;
  }

  // Si es por navegación SPA, limpiar event listeners y resetear el período por defecto
  if (isNavigation) {
    if (_holdingsHandler) {
      window.removeEventListener("holdings-updated", _holdingsHandler);
      _holdingsHandler = null;
    }

    if (_filterHandler) {
      window.removeEventListener("caleta-filter-changed", _filterHandler);
      _filterHandler = null;
    }

    // Resetear período por defecto al desmontar la vista
    _currentDays = 30;
  }
};

/**
 * Muestra el spinner de carga en el contenedor.
 * @param {HTMLElement} container
 */
const showLoadingState = (container) => {
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) {
    if (container.querySelector('.chart-loading-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'chart-loading-overlay absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-[2px] rounded-xl z-10';
    overlay.innerHTML = `
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" role="status" aria-label="Loading historical data"></div>
      <span class="text-xs text-slate-400 font-medium">Cargando...</span>
    `;
    container.appendChild(overlay);
    return;
  }

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-3 py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" role="status" aria-label="Loading historical data"></div>
      <span class="text-xs text-slate-400 font-medium">Cargando historial...</span>
    </div>
  `;
};

/**
 * Muestra el estado vacío (portfolio sin assets o sin datos para el período).
 * @param {HTMLElement} container
 */
const showEmptyState = (container) => {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center p-6 py-12 max-w-sm mx-auto">
      <svg class="w-10 h-10 text-slate-600 mb-3" aria-hidden="true">
        <use href="${sprite}#trending-up"></use>
      </svg>
      <h4 class="text-sm font-semibold text-white mb-1">Sin historial de portafolio</h4>
      <p class="text-xs text-slate-400 leading-relaxed">
        Agrega activos con montos reales para calcular la evolución histórica de tu patrimonio.
      </p>
    </div>
  `;
};

/**
 * Muestra el estado de error con mensaje personalizado y botón de retry.
 * @param {HTMLElement} container
 * @param {string} errorType - Valor de ErrorType
 * @param {number} [days] - Días del período actual para el retry
 */
const showErrorState = (container, errorType, days) => {
  cleanupHistoryChart(false);
  const message = getErrorMessage(errorType);
  const isRateLimit = errorType === ErrorType.RATE_LIMIT;

  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center p-6 py-10 max-w-sm mx-auto">
      <div class="relative mb-4">
        <div class="absolute inset-0 bg-rose-500/10 blur-xl rounded-full"></div>
        <div class="relative rounded-full bg-slate-800/70 p-4 border border-rose-500/20">
          <svg class="w-8 h-8 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      </div>
      <h4 class="text-sm font-semibold text-white mb-1">Error al cargar historial</h4>
      <p class="text-xs text-slate-400 leading-relaxed mb-4">${message}</p>
      ${!isRateLimit ? `
        <button
          id="history-retry-btn"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg border border-primary/20 transition-all btn-press"
          aria-label="Reintentar carga del historial"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reintentar
        </button>
      ` : `
        <p class="text-xs text-amber-400/80 font-medium">Espera unos segundos antes de reintentar.</p>
      `}
    </div>
  `;

  // Bind retry button
  document.getElementById('history-retry-btn')?.addEventListener('click', () => {
    initHistoryChart();
  });
};

export default HistoryChart;
