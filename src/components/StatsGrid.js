import StatCard from "./StatCard";
import { formatUsd, formatPercent } from "../utils/formatters";

const StatsGrid = () => {
  return `
    <section id="stats-grid-container" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Portfolio Statistics">
      ${renderSkeletons()}
    </section>
  `;
};

const renderSkeletons = () => {
  const labels = ["Total Balance", "24h Portfolio Change", "Total Assets", "Top Mover (24h)"];
  return labels.map(title => StatCard({ title, skeleton: true })).join("");
};

const renderCards = (holdings = []) => {
  const totalBalance = holdings.reduce((acc, curr) => acc + curr.value, 0);

  const totalChange24h = totalBalance > 0
    ? holdings.reduce((acc, curr) => acc + (curr.change24h * curr.value), 0) / totalBalance
    : 0;

  const formatChangeValue = totalBalance > 0
    ? `${totalChange24h >= 0 ? '+' : ''}${formatUsd(totalBalance * (totalChange24h / 100))}`
    : formatUsd(0);

  const topMover = holdings.length > 0
    ? [...holdings].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0]
    : null;

  const cards = [
    {
      title: "Total Balance",
      value: formatUsd(totalBalance),
      description: holdings.length > 0 ? `Across ${holdings.length} unique coin${holdings.length !== 1 ? 's' : ''}` : "No assets added",
      iconLabel: "Wallet",
      icon: "wallet",
      extra: `
        <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
          <div class="bg-primary h-full w-full rounded-full shadow-[0_0_10px_#0bd570]"></div>
        </div>
      `,
    },
    {
      title: "24h Portfolio Change",
      value: formatChangeValue,
      badge: formatPercent(totalChange24h),
      description: "vs. previous 24h",
      iconLabel: "Trending Up",
      icon: totalChange24h >= 0 ? "trending-up" : "trending-down",
      extra: `
        <div class="mt-2 -mb-1 h-8 w-full" aria-hidden="true">
          <svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path d="M0,${totalChange24h >= 0 ? '15 Q25,18 50,10 T100,5' : '5 Q25,2 50,10 T100,15'}" fill="none" stroke="${totalChange24h >= 0 ? '#0bd570' : '#ef4444'}" stroke-width="2" vector-effect="non-scaling-stroke"></path>
          </svg>
        </div>
      `,
    },
    {
      title: "Total Assets",
      value: holdings.length.toString(),
      description: "Unique coins in wallet",
      iconLabel: "Chart Area Line",
      icon: "chart-area-line",
      extra: `
        <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div class="h-full w-full bg-gradient-to-r from-blue-500 to-primary rounded-full"></div>
        </div>
      `,
    },
    {
      title: "Top Mover (24h)",
      value: topMover ? formatPercent(topMover.change24h) : "—",
      badge: topMover ? `${topMover.symbol.toUpperCase()}` : "",
      description: topMover ? topMover.name : "Add assets to see movers",
      iconLabel: "Rocket",
      icon: topMover ? "rocket" : "",
      extra: topMover ? `
        <div class="mt-2 flex items-center gap-3">
          <div class="size-10 rounded-xl border border-slate-700 bg-slate-800 p-1.5">
            <img alt="${topMover.name} logo" class="h-full w-full object-contain rounded" src="${topMover.logoUrl}" width="40" height="40" loading="lazy" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-bold text-white truncate">${topMover.name}</span>
            </div>
            <span class="text-xs text-slate-400">${formatUsd(topMover.price ?? 0)}</span>
          </div>
        </div>
      ` : "",
    }
  ];

  return cards.map((card) => StatCard(card)).join("");
};

export const initStatsGrid = () => {
  const container = document.getElementById("stats-grid-container");
  if (!container) return;

  if (_statsHandler) {
    window.removeEventListener('prices-updated', _statsHandler);
  }

  _statsHandler = (e) => {
    const { holdings } = e.detail;
    container.innerHTML = renderCards(holdings);
  };

  window.addEventListener('prices-updated', _statsHandler);
};

/** @type {((e: Event) => void) | null} */
let _statsHandler = null;

export const cleanupStatsGrid = () => {
  if (_statsHandler) {
    window.removeEventListener('prices-updated', _statsHandler);
    _statsHandler = null;
  }
};

export default StatsGrid;
