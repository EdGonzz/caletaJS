import StatCard from "./StatCard";
import { formatUsd } from "../utils/formatters";

/**
 * Renders the initial shell for the stats cards.
 */
const StatsGrid = () => {
  return `
    <section id="stats-grid-container" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Portfolio Statistics">
      ${renderCards([])}
    </section>
  `;
};

/**
 * Internal helper to render the card list based on holdings data.
 * @param {Array} holdings 
 * @returns {string}
 */
const renderCards = (holdings = []) => {
  const totalBalance = holdings.reduce((acc, curr) => acc + curr.value, 0);
  
  // Calculate weighted average 24h change
  const totalChange24h = totalBalance > 0 
    ? holdings.reduce((acc, curr) => acc + (curr.change24h * curr.value), 0) / totalBalance
    : 0;

  // Find top mover
  const topMover = holdings.length > 0 
    ? [...holdings].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))[0]
    : null;

  const cards = [
    {
      title: "Total Balance",
      value: formatUsd(totalBalance),
      description: holdings.length > 0 ? `Across ${holdings.length} assets` : "No assets added",
      iconLabel: "Wallet",
      icon: "wallet",
      extra: `
        <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
          <div class="bg-primary h-full w-full shadow-[0_0_10px_#0bd570]"></div>
        </div>
      `,
    },
    {
      title: "24h Portfolio Change",
      value: `${totalChange24h >= 0 ? '+' : ''}${formatUsd(totalBalance * (totalChange24h / 100))}`,
      badge: `${totalChange24h >= 0 ? '+' : ''}${totalChange24h.toFixed(2)}%`,
      description: "vs. previous 24h",
      iconLabel: "Trending Up",
      icon: totalChange24h >= 0 ? "trending-up" : "trending-down",
      extra: `
        <div class="mt-2 -mb-2 h-8 w-full" aria-hidden="true">
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
        <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div class="to-primary h-full w-full bg-linear-to-r from-blue-500"></div>
        </div>
      `,
    },
    {
      title: "Top Mover (24h)",
      iconLabel: "Rocket",
      icon: "rocket",
      content: topMover ? `
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg border border-slate-700 bg-slate-800 p-1.5">
              <img alt="${topMover.name} logo" class="h-full w-full object-contain" src="${topMover.logoUrl}" loading="lazy" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-white">${topMover.name}</span>
                <span class="text-xs text-slate-400">${topMover.symbol.toUpperCase()}</span>
              </div>
              <span class="${topMover.change24h >= 0 ? 'text-primary' : 'text-accent-red'} text-sm font-bold">
                ${topMover.change24h >= 0 ? '+' : ''}${topMover.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        ` : `<div class="text-slate-500 text-sm italic py-2">Add assets to see movers</div>`,
    }
  ];

  return cards.map((card) => StatCard(card)).join("");
};

/**
 * Initializes the stats grid by listening to price updates.
 */
export const initStatsGrid = () => {
  const container = document.getElementById("stats-grid-container");
  if (!container) return;

  window.addEventListener('prices-updated', (e) => {
    const { holdings } = e.detail;
    container.innerHTML = renderCards(holdings);
  });
};

export default StatsGrid;
