const HistoryChart = () => {
  const periods = [
    { label: "24h", active: false },
    { label: "7d", active: false },
    { label: "30d", active: true },
    { label: "90d", active: false },
    { label: "All", active: false },
  ];

  const periodButtons = periods
    .map(({ label, active }) =>
      active
        ? `<button class="bg-primary/20 text-primary rounded px-3 py-1 text-xs font-medium shadow-sm transition-all" aria-label="Show ${label} history">${label}</button>`
        : `<button class="rounded px-3 py-1 text-xs font-medium text-slate-400 transition-all hover:bg-slate-700/50 hover:text-white" aria-label="Show ${label} history">${label}</button>`
    )
    .join("");

  const view = `
    <div class="glass-panel flex h-full flex-col rounded-xl p-6 lg:col-span-8">
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-bold text-white">History</h3>
          <span class="material-symbols-outlined cursor-help text-sm text-slate-500" aria-label="Portfolio value over time">info</span>
        </div>
        <div class="flex rounded-lg border border-slate-700/50 bg-slate-800/50 p-1" role="group" aria-label="Time period selector">
          ${periodButtons}
        </div>
      </div>
      <div class="relative h-full w-full flex-1">
        <svg class="h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 300" aria-label="Portfolio history line chart">
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#0bd570" stop-opacity="0.2"></stop>
              <stop offset="100%" stop-color="#0bd570" stop-opacity="0"></stop>
            </linearGradient>
          </defs>
          <line stroke="#1e293b" stroke-dasharray="4 4" x1="0" x2="800" y1="50" y2="50"></line>
          <line stroke="#1e293b" stroke-dasharray="4 4" x1="0" x2="800" y1="125" y2="125"></line>
          <line stroke="#1e293b" stroke-dasharray="4 4" x1="0" x2="800" y1="200" y2="200"></line>
          <line stroke="#1e293b" stroke-dasharray="4 4" x1="0" x2="800" y1="275" y2="275"></line>
          <path
            class="path-anim"
            d="M0,250 L40,240 L80,260 L120,220 L160,230 L200,200 L240,210 L280,180 L320,190 L360,150 L400,160 L440,120 L480,130 L520,100 L560,110 L600,80 L640,90 L680,60 L720,70 L760,40 L800,50"
            fill="url(#chartGradient)"
            stroke="none"
          ></path>
          <path
            class="path-anim"
            d="M0,250 L40,240 L80,260 L120,220 L160,230 L200,200 L240,210 L280,180 L320,190 L360,150 L400,160 L440,120 L480,130 L520,100 L560,110 L600,80 L640,90 L680,60 L720,70 L760,40 L800,50"
            fill="none"
            filter="drop-shadow(0 0 8px rgba(11,213,112,0.3))"
            stroke="#0bd570"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
          ></path>
        </svg>
        <div class="mt-2 flex justify-between font-mono text-xs text-slate-500">
          <span>01 Feb</span>
          <span>05 Feb</span>
          <span>10 Feb</span>
          <span>15 Feb</span>
          <span>20 Feb</span>
          <span>25 Feb</span>
          <span>Today</span>
        </div>
        <div class="pointer-events-none absolute top-0 right-0 bottom-8 flex flex-col justify-between text-right font-mono text-xs text-slate-500">
          <span>$45k</span>
          <span>$40k</span>
          <span>$35k</span>
          <span>$30k</span>
          <span>$25k</span>
        </div>
      </div>
    </div>
  `;

  return view;
};

export default HistoryChart;
