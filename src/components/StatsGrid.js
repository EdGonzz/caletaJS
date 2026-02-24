import StatCard from "./StatCard";

const StatsGrid = () => {
  // Configuración de las tarjetas estándar
  const cards = [
    {
      title: "Total Balance",
      value: "$42,069.00",
      description: "~ 1.45 BTC",
      icon: "account_balance_wallet",
      extra: `
        <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-value="75" aria-valuemin="0" aria-valuemax="100">
          <div class="bg-primary h-full w-[75%] shadow-[0_0_10px_#0bd570]"></div>
        </div>
      `,
    },
    {
      title: "24h Change",
      value: "+$2,154.32",
      badge: "+5.4%",
      description: "vs. previous day",
      icon: "trending_up",
      extra: `
        <div class="mt-2 -mb-2 h-8 w-full" aria-hidden="true">
          <svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 20">
            <path d="M0,15 Q25,18 50,10 T100,5" fill="none" stroke="#0bd570" stroke-width="2" vector-effect="non-scaling-stroke"></path>
          </svg>
        </div>
      `,
    },
    {
      title: "Total Profit",
      value: "$12,402.10",
      badge: "+41.2%",
      description: "All time earnings",
      icon: "monitoring",
      extra: `
        <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-value="60" aria-valuemin="0" aria-valuemax="100">
          <div class="to-primary h-full w-[60%] bg-linear-to-r from-blue-500"></div>
        </div>
      `,
    },
    {
      title: "Top Mover (24h)",
        icon: "rocket_launch",
        content: `
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-lg border border-slate-700 bg-slate-800 p-1.5">
              <img alt="Solana logo" class="h-full w-full object-contain" src="https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756" loading="lazy" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-white">Solana</span>
                <span class="text-xs text-slate-400">SOL</span>
              </div>
              <span class="text-primary text-sm font-bold" aria-label="Subida del 12.05%">+12.05%</span>
            </div>
          </div>
        `,
        extra: `<div class="mt-2 text-right"><span class="text-xs text-slate-500">Vol: $4.2B</span></div>`,
    }
  ];

  const view = `
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Estadísticas de inversión">
      ${cards.map((card) => StatCard(card)).join("")}
    </section>
  `;

  return view;
};

export default StatsGrid;
