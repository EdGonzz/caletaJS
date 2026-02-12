import sprite from "../assets/sprite.svg";

const ActionToolbar = () => {
  const view = `
    <div class="flex items-center justify-between overflow-x-auto p-4">
      <div class="flex items-center gap-3">

        <button class="bg-primary text-background-dark shadow-neon flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all">
          <svg class="size-6">
            <use href="${sprite}#layout-dashboard"></use>
          </svg>
          Overview
        </button>
        
        <button class="hover:border-primary/50 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-slate-700/60 hover:text-white">
          <span class="material-symbols-outlined text-[18px]">lock</span>
          Cold Storage
        </button>
        <button class="hover:border-primary/50 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-slate-700/60 hover:text-white">
          <span class="material-symbols-outlined text-[18px]">candlestick_chart</span>
          Trading Wallet
        </button>
        <button class="hover:border-primary/50 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-slate-700/60 hover:text-white">
          <span class="material-symbols-outlined text-[18px]">savings</span>
          DeFi Staking
        </button>
      </div>
      <button class="bg-primary text-background-dark shadow-neon hover:shadow-neon-hover flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all">
        <span class="material-symbols-outlined text-sm">add</span>
        <span>Add Funds</span>
      </button>
    </div>
`;

  return view;
}

export default ActionToolbar;