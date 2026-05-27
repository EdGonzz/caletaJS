import ActionToolbar from "../components/ActionToolbar";
import StatsGrid from "../components/StatsGrid";
import HistoryChart from "../components/HistoryChart";
import AllocationDonut from "../components/AllocationDonut";
import HoldingsTable from "../components/HoldingsTable";
import AddAssetModal from "../components/AddAssetModal";
import sprite from "../assets/sprite.svg";

const Home = () => {
  const view = `
  <div class="px-4 pt-6 pb-20 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[1600px] space-y-6">

      <!-- Dashboard Header -->
      <header class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-700/50">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-white tracking-tight">Portfolio Dashboard</h1>
          <span class="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full" role="status" aria-label="Precios en vivo">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live
          </span>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-400">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" aria-hidden="true"><use href="${sprite}#refresh" /></svg>
            <span id="last-updated-time" aria-live="polite">Just now</span>
          </div>
          <span class="text-slate-700" aria-hidden="true">|</span>
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-primary pulse-dot" aria-hidden="true"><use href="${sprite}#chart-area-line" /></svg>
            <span>Market open</span>
          </div>
        </div>
      </header>

      ${ActionToolbar()}
      ${StatsGrid()}

      <section class="grid grid-cols-1 gap-6 lg:min-h-[400px] lg:grid-cols-12">
        ${HistoryChart()}
        ${AllocationDonut()}
      </section>

      ${HoldingsTable()}
    </div>
  </div>
  ${AddAssetModal()}
`;

  return view;
};

export default Home;
