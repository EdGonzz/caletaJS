import Button from "./Button";

const Balance = () => {
  const view = `
    <section class="mb-8 text-center">
      <p class="text-slate-400 text-sm uppercase tracking-wide mb-1">Balance Total Estimado</p>
      <h2 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
        $ 12,450.00
      </h2>
      <div class="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
        +2.5% (24h)
      </  div>
    </section>

      <section class="grid grid-cols-2 gap-4 mb-8">
      ${Button('add-btn', "+", "Agregar", "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20")}
    
      ${Button('hide-btn', "👁️", "Ocultar", "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700")}
    </section>
  `;
  return view;
}

export default Balance;