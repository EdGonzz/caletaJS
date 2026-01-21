const Home = () => {
  const view = `
  <section class="mb-8 text-center">
    <p class="text-slate-400 text-sm uppercase tracking-wide mb-1">Balance Total Estimado</p>
    <h2 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
      $ 12,450.00
    </h2>
    <div class="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
      +2.5% (24h)
    </div>
  </section>

  <section class="grid grid-cols-2 gap-4 mb-8">
    <button class="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-emerald-500/20">
      <span>+</span> Agregar
    </button>
    <button class="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition border border-slate-700">
      <span>👁️</span> Ocultar
    </button>
  </section>

  <section>
    <h3 class="text-xl font-bold mb-4 flex justify-between items-end">
      Tus Activos
      <span class="text-xs text-slate-500 font-normal">Actualizado hace 1m</span>
    </h3>

    <div class="space-y-3">
      <a href="#/coin/bitcoin" class="block bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer flex justify-between items-center group">
        <div class="flex items-center gap-4">
          <img src="https://assets.coingecko.com/coins/images/1/large/bitcoin.png" alt="BTC" class="w-10 h-10 rounded-full shadow-sm">
          <div>
            <h4 class="font-bold group-hover:text-emerald-400 transition">Bitcoin</h4>
            <p class="text-xs text-slate-400">0.45 BTC</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold">$42,000.00</p>
          <p class="text-xs text-emerald-400 font-medium">+1.2%</p>
        </div>
      </a>

      <a href="#/coin/ethereum" class="block bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer flex justify-between items-center group">
        <div class="flex items-center gap-4">
          <img src="https://assets.coingecko.com/coins/images/279/large/ethereum.png" alt="ETH" class="w-10 h-10 rounded-full shadow-sm">
          <div>
            <h4 class="font-bold group-hover:text-emerald-400 transition">Ethereum</h4>
            <p class="text-xs text-slate-400">1.2 ETH</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold">$3,100.00</p>
          <p class="text-xs text-red-400 font-medium">-0.5%</p>
        </div>
      </a>
    </div>
  </section>
`;

  return view;
}

export default Home;
