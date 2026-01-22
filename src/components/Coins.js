const Coins = ( href, src, alt, name, price, change) => {
    const view = `
        <a href="${href}" class="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer flex justify-between items-center group">
          <div class="flex items-center gap-4">
            <img src="${src}" alt="${alt}" class="w-10 h-10 rounded-full shadow-sm">
            <div>
              <h4 class="font-bold group-hover:text-emerald-400 transition">${name}</h4>
              <p class="text-xs text-slate-400">${price}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold">${price}</p>
            <p class="text-xs text-emerald-400 font-medium">${change}</p>
          </div>
        </a>
    `
    return view;
}

export default Coins;