import { buildAllocationData } from "../utils/chartDataAdapter.js";
import { formatUsd } from "../utils/formatters.js";
import sprite from "../assets/sprite.svg";

// Paleta de colores premium cíclica del design system
const COLOR_PALETTE = [
  { class: "bg-primary", stroke: "#0bd570", shadow: "shadow-[0_0_8px_#0bd570]" },
  { class: "bg-blue-500", stroke: "#3b82f6", shadow: "shadow-[0_0_8px_#3b82f6]" },
  { class: "bg-rose-500", stroke: "#f43f5e", shadow: "shadow-[0_0_8px_#f43f5e]" },
  { class: "bg-amber-500", stroke: "#f59e0b", shadow: "shadow-[0_0_8px_#f59e0b]" },
  { class: "bg-purple-500", stroke: "#a855f7", shadow: "shadow-[0_0_8px_#a855f7]" },
  { class: "bg-cyan-500", stroke: "#06b6d4", shadow: "shadow-[0_0_8px_#06b6d4]" },
  { class: "bg-emerald-500", stroke: "#10b981", shadow: "shadow-[0_0_8px_#10b981]" },
];

const AllocationDonut = () => `
  <div class="glass-panel flex h-full flex-col rounded-xl p-6 lg:col-span-4">
    <div class="mb-6 flex items-center justify-between">
      <h3 class="text-lg font-bold text-white">Allocation</h3>
      <div class="flex rounded-lg border border-slate-700/50 bg-slate-800/50 p-0.5" role="group" aria-label="Allocation view type">
        <span class="px-2.5 py-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-md">Token</span>
      </div>
    </div>
    <div id="allocation-donut-container" class="relative flex flex-1 flex-col items-center justify-center min-h-55">
      <!-- Renderizado dinámico via initAllocationDonut() -->
    </div>
  </div>
`;

const renderDonut = (data) => {
  if (data.length === 0) {
    return `
      <div class="flex flex-col items-center justify-center text-center p-4">
        <svg class="text-4xl text-slate-600 mb-2" aria-hidden="true">
          <use href="${sprite}#chart-pie"></use>
        </svg>
        <h4 class="text-sm font-semibold text-white mb-1">Sin distribución</h4>
        <p class="text-xs text-slate-400 max-w-50">
          Agrega transacciones para ver la distribución de tus activos.
        </p>
      </div>
    `;
  }

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const r = 40;
  const circumference = 2 * Math.PI * r;
  let accumulatedPct = 0;

  const donutSegments = data
    .map((item, index) => {
      const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
      const pctValue = (item.pct / 100) * circumference;
      const offset = -(accumulatedPct / 100) * circumference;
      accumulatedPct += item.pct;

      return `
        <circle cx="50" cy="50" fill="transparent" r="${r}"
          stroke="${color.stroke}"
          stroke-dasharray="${pctValue.toFixed(2)} ${circumference.toFixed(2)}"
          stroke-dashoffset="${offset.toFixed(2)}"
          stroke-linecap="${item.pct === 100 ? 'butt' : 'round'}"
          stroke-width="10"
          class="transition-all duration-500"
          aria-label="${item.name}: ${item.pct.toFixed(2)}%">
        </circle>`;
    })
    .join("");

  const legendItems = data
    .map((item, index) => {
      const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
      return `
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="${color.class} size-2.5 rounded-full ${color.shadow}" aria-hidden="true"></span>
            <span class="text-slate-300 font-medium">${item.name} (${item.symbol.toUpperCase()})</span>
          </div>
          <span class="font-mono text-white font-semibold">${item.pct.toFixed(2)}%</span>
        </div>`;
    })
    .join("");

  return `
    <div class="relative size-48 flex items-center justify-center">
      <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-label="Portfolio allocation donut chart">
        <circle cx="50" cy="50" fill="transparent" r="${r}" stroke="#1e293b" stroke-width="10"></circle>
        ${donutSegments}
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-lg font-bold text-white tracking-tight">${formatUsd(totalValue)}</span>
        <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
      </div>
    </div>
    <nav class="mt-6 w-full space-y-3 max-h-40 overflow-y-auto pr-1 scrollbar-thin" aria-label="Allocation breakdown">
      ${legendItems}
    </nav>`;
};

export const initAllocationDonut = () => {
  const container = document.getElementById("allocation-donut-container");
  if (!container) return;

  window.addEventListener('prices-updated', (e) => {
    const { holdings } = e.detail;
    const data = buildAllocationData(holdings);
    container.innerHTML = renderDonut(data);
  });
};

export default AllocationDonut;
