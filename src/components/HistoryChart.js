import { createChart, AreaSeries } from "lightweight-charts";
import { buildPortfolioHistorySeries } from "../utils/chartDataAdapter.js";
import { currentFilter } from "./ActionToolbar.js";
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
      ({ label, days, active }) =>
        `<button
        class="${active ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} rounded px-3 py-1 text-xs font-medium transition-all"
        data-days="${days}"
        aria-label="Show ${label} history"
        aria-pressed="${active ? "true" : "false"}"
      >${label}</button>`,
    )
    .join("");

  return `
    <div class="glass-panel flex h-full flex-col rounded-xl p-6 lg:col-span-8">
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-bold text-white">History</h3>
          <span class="material-symbols-outlined cursor-help text-sm text-slate-500" aria-label="Portfolio value over time">info</span>
        </div>
        <div id="history-period-selector" class="flex rounded-lg border border-slate-700/50 bg-slate-800/50 p-1" role="group" aria-label="Time period selector">
          ${periodButtons}
        </div>
      </div>
      <div id="history-chart-container" class="relative flex-1 w-full min-h-55 flex items-center justify-center">
        <!-- Renderizado dinámico o estados de carga/vacío -->
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
  const data = await buildPortfolioHistorySeries(_currentDays, _abortController.signal, currentFilter);

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
    buttons.forEach((btn) => {
      const btnDays = Number(btn.dataset.days);
      const isActive = btnDays === _currentDays;

      // Sincronizar estilo inicial con _currentDays
      btn.className = `${isActive ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} rounded px-3 py-1 text-xs font-medium transition-all`;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");

      btn.addEventListener("click", async (e) => {
        const days = Number(e.currentTarget.dataset.days);
        _currentDays = days; // Guardar el día seleccionado

        // Guardar referencia al botón anteriormente activo para fallback
        const prevActiveButton = Array.from(buttons).find((b) => b.getAttribute("aria-pressed") === "true") || btn;

        // Actualizar UI activa de los botones eager
        buttons.forEach((b) => {
          const isActive = b === e.currentTarget;
          b.className = `${isActive ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} rounded px-3 py-1 text-xs font-medium transition-all`;
          b.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        // Cancelar petición previa y crear nueva
        const periodRequest = ++_requestId;
        if (_abortController) {
          _abortController.abort();
        }
        _abortController = new AbortController();

        // Fetch nuevos datos y actualizar serie
        const newData = await buildPortfolioHistorySeries(days, _abortController.signal, currentFilter);

        if (periodRequest !== _requestId || _abortController.signal.aborted) {
          return;
        }

        if (_series && _chart && newData.length > 0) {
          _series.setData(newData);
          _chart.timeScale().fitContent();
        } else {
          // Revertir UI al botón previamente activo si no hay datos nuevos
          buttons.forEach((b) => {
            const isActive = b === prevActiveButton;
            b.className = `${isActive ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-slate-700/50 hover:text-white"} rounded px-3 py-1 text-xs font-medium transition-all`;
            b.setAttribute("aria-pressed", isActive ? "true" : "false");
          });
          // Revertir _currentDays al valor del botón previamente activo
          _currentDays = Number(prevActiveButton.dataset.days);
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
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-3 py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" role="status" aria-label="Loading historical data"></div>
      <span class="text-xs text-slate-400 font-medium">Cargando historial...</span>
    </div>
  `;
};

/**
 * Muestra un estado vacío o de error en el contenedor.
 * @param {HTMLElement} container
 */
const showEmptyState = (container) => {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center p-6 py-12 max-w-sm mx-auto">
      <svg class="w-10 h-10 text-slate-600 mb-3" aria-hidden="true">
        <use href="${sprite}#trending-up"></use>
      </svg>
        <use href="${sprite}#trending-up"></use>
      </svg>
      <h4 class="text-sm font-semibold text-white mb-1">Sin historial de portafolio</h4>
      <p class="text-xs text-slate-400 leading-relaxed">
        Agrega activos con montos reales para calcular la evolución histórica de tu patrimonio.
      </p>
    </div>
  `;
};

export default HistoryChart;
