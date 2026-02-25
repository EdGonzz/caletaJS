import Button from "./Button";

const ActionToolbar = () => {
  const view = `
    <section class="flex items-center justify-between overflow-x-auto">
        <div class="flex items-center gap-3">

          ${Button("layout-dashboard", "layout-dashboard", "Overview", "bg-primary text-background-dark text-md font-bold hover:brightness-110 px-3 py-1")}
          
          ${Button("cold-storage", "layout-dashboard", "Cold Storage", "hover:border-primary/50 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1")}

          ${Button("trading-wallet", "layout-dashboard", "Trading Wallet", "hover:border-primary/50 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1")}

          ${Button("add-wallet", "plus", "Add Wallet", "text-slate-400 hover:text-white")}
        </div>

        ${Button("add-funds", "plus", "Add Funds", "bg-primary text-background-dark text-md font-bold hover:brightness-110 px-3 py-1")}
    </section>
`;

  return view;
}

export default ActionToolbar;