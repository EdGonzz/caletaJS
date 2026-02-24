const AllocationDonut = () => {
  const allocations = [
    { name: "Bitcoin", pct: "67.55%", color: "bg-primary", shadow: "shadow-[0_0_8px_#0bd570]", stroke: "#0bd570", dasharray: "168 251", offset: "0" },
    { name: "Ethereum", pct: "19.20%", color: "bg-blue-500", shadow: "shadow-[0_0_8px_#3b82f6]", stroke: "#3b82f6", dasharray: "50 251", offset: "-175" },
    { name: "Solana", pct: "13.25%", color: "bg-accent-red", shadow: "shadow-[0_0_8px_#ef4444]", stroke: "#ef4444", dasharray: "33 251", offset: "-230" },
  ];

  const legendItems = allocations
    .map(
      ({ name, pct, color, shadow }) => `
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="${color} size-2 rounded-full ${shadow}"></span>
          <span class="text-slate-300">${name}</span>
        </div>
        <span class="font-mono text-white">${pct}</span>
      </div>`
    )
    .join("");

  const donutSegments = allocations
    .map(
      ({ stroke, dasharray, offset }) => `
      <circle cx="50" cy="50" fill="transparent" r="40"
        stroke="${stroke}" stroke-dasharray="${dasharray}"
        stroke-dashoffset="${offset}" stroke-linecap="round"
        stroke-width="12"></circle>`
    )
    .join("");

  const view = `
    <div class="glass-panel flex h-full flex-col rounded-xl p-6 lg:col-span-4">
      <div class="mb-6 flex items-center justify-between">
        <h3 class="text-lg font-bold text-white">Allocation</h3>
        <div class="flex rounded-lg border border-slate-700/50 bg-slate-800/50 p-0.5" role="group" aria-label="Allocation view toggle">
          <button class="rounded bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm" aria-label="View by token">Token</button>
          <button class="rounded px-2 py-0.5 text-[10px] font-medium text-slate-400 hover:text-white" aria-label="View by portfolio">Portfolio</button>
        </div>
      </div>
      <div class="relative flex flex-1 flex-col items-center justify-center">
        <div class="relative size-48">
          <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-label="Portfolio allocation donut chart">
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#1e293b" stroke-width="12"></circle>
            ${donutSegments}
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-2xl font-bold text-white">100%</span>
            <span class="text-xs text-slate-400">Deployed</span>
          </div>
        </div>
        <nav class="mt-6 w-full space-y-3" aria-label="Allocation breakdown">
          ${legendItems}
        </nav>
      </div>
    </div>
  `;

  return view;
};

export default AllocationDonut;
