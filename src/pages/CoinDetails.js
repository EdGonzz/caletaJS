const CoinDetails = (params = {}) => {
  const { id } = params;
  return `
    <main class="p-6">
      <h1 class="text-2xl font-bold text-white mb-2">Coin Details</h1>
      <p class="text-slate-400">Viewing: <span class="text-white font-medium">${escapeHTML(id || 'unknown')}</span></p>

    </main>
  `;
};

export default CoinDetails;
