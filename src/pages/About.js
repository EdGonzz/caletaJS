import sprite from "../assets/sprite.svg";

const About = () => {
  return `
    <div class="container mx-auto px-4 py-10 max-w-2xl">
      <article class="glass-panel rounded-2xl p-8 sm:p-10 border border-slate-700/50 space-y-8">
        <header class="text-center space-y-3">
          <h1 class="text-3xl font-bold text-white tracking-tight">Acerca de CaletaJS</h1>
          <p class="text-slate-400 text-sm max-w-md mx-auto">Simulador y rastreador de portafolios cripto de alto rendimiento</p>
        </header>

        <hr class="border-slate-800" />

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white">¿Qué es CaletaJS?</h2>
          <p class="text-slate-300 text-sm leading-relaxed">
            CaletaJS es una Single Page Application (SPA) ultra ligera diseñada para monitorear, organizar
            y simular inversiones en criptomonedas en tiempo real. Todos tus datos se almacenan de forma local e
            inicialmente anónima en tu navegador utilizando <code class="bg-slate-800 px-1.5 py-0.5 rounded text-primary text-xs font-mono">localStorage</code>,
            lo que garantiza privacidad absoluta y cero fricción de registro.
          </p>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-bold text-white">Tecnologías e Integraciones</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-slate-800/40 p-5 rounded-xl border border-slate-700/30 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="bg-slate-700/50 p-1.5 rounded-lg">
                  <svg class="w-5 h-5 text-primary" aria-hidden="true"><use href="${sprite}#chart-area-line" /></svg>
                </div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gráficos</span>
              </div>
              <p class="text-slate-200 text-sm leading-relaxed">
                Desarrollado con <a href="https://www.tradingview.com/lightweight-charts/" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium">Lightweight Charts</a> de TradingView, ofreciendo gráficos de velas, líneas y áreas con rendimiento nativo en Canvas.
              </p>
            </div>

            <div class="bg-slate-800/40 p-5 rounded-xl border border-slate-700/30 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="bg-slate-700/50 p-1.5 rounded-lg">
                  <svg class="w-5 h-5 text-primary" aria-hidden="true"><use href="${sprite}#wallet" /></svg>
                </div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Datos del Mercado</span>
              </div>
              <p class="text-slate-200 text-sm leading-relaxed">
                Precios e información proveídos por la API pública de <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium">CoinGecko</a>, con datos de más de 15,000 criptomonedas y 800 exchanges.
              </p>
            </div>

            <div class="bg-slate-800/40 p-5 rounded-xl border border-slate-700/30 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="bg-slate-700/50 p-1.5 rounded-lg">
                  <svg class="w-5 h-5 text-primary" aria-hidden="true"><use href="${sprite}#layout-dashboard" /></svg>
                </div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stack</span>
              </div>
              <p class="text-slate-200 text-sm leading-relaxed">
                Construido con JavaScript Vanilla (ES6+), Webpack 5, Tailwind CSS v4 y un router SPA hash-based. Cero dependencias de frameworks — máximo rendimiento.
              </p>
            </div>

            <div class="bg-slate-800/40 p-5 rounded-xl border border-slate-700/30 flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <div class="bg-slate-700/50 p-1.5 rounded-lg">
                  <svg class="w-5 h-5 text-primary" aria-hidden="true"><use href="${sprite}#circle-check" /></svg>
                </div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Privacidad</span>
              </div>
              <p class="text-slate-200 text-sm leading-relaxed">
                Todos los datos se almacenan localmente. Sin registros, sin servidores, sin rastreo. Tu portafolio es solo tuyo.
              </p>
            </div>
          </div>
        </section>

        <footer class="text-center pt-6 text-xs text-slate-500 border-t border-slate-800 space-y-1">
          <p>&copy; ${new Date().getFullYear()} CaletaJS. Creado con JavaScript Vanilla y Tailwind CSS v4.</p>
          <p class="text-slate-600">Hecho con ❤️ para la comunidad cripto</p>
        </footer>
      </article>
    </div>
  `;
};

export default About;
