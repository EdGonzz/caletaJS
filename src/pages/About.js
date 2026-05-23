const About = () => {
  return `
    <main class="container mx-auto px-4 py-8 max-w-2xl">
      <article class="glass-panel rounded-2xl p-8 border border-slate-700/50 space-y-6">
        <header class="text-center space-y-2">
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Acerca de CaletaJS</h1>
          <p class="text-slate-400 text-sm">Simulador y rastreador de portafolios cripto de alto rendimiento</p>
        </header>

        <hr class="border-slate-800" />

        <section class="space-y-4">
          <h2 class="text-lg font-bold text-white">¿Qué es CaletaJS?</h2>
          <p class="text-slate-300 text-sm leading-relaxed">
            CaletaJS es una Single Page Application (SPA) ultra ligera diseñada para monitorear, organizar
            y simular inversiones en criptomonedas en tiempo real. Todos tus datos se almacenan de forma local e
            inicialmente anónima en tu navegador utilizando <code class="bg-slate-800/80 px-1.5 py-0.5 rounded text-primary text-xs">localStorage</code>,
            lo que garantiza privacidad absoluta y cero fricción de registro.
          </p>
        </section>

        <section class="space-y-4">
          <h2 class="text-lg font-bold text-white">Tecnologías e Integraciones</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30 flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gráficos Financieros</span>
              <p class="text-slate-200 text-sm font-medium">
                Desarrollado con <a href="https://www.tradingview.com/lightweight-charts/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline" aria-label="Visitar sitio de Lightweight Charts de TradingView">Lightweight Charts de TradingView</a>.
              </p>
            </div>
            <div class="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30 flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Datos del Mercado</span>
              <p class="text-slate-200 text-sm font-medium">
                Precios e información proveídos por la API pública de <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline" aria-label="Visitar sitio web oficial de CoinGecko">CoinGecko</a>.
              </p>
            </div>
          </div>
        </section>

        <footer class="text-center pt-4 text-xs text-slate-500 border-t border-slate-800">
          <p>© ${new Date().getFullYear()} CaletaJS. Creado con JavaScript Vanilla y Tailwind CSS v4.</p>
        </footer>
      </article>
    </main>
  `;
};

export default About;