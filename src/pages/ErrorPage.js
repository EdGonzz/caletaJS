/**
 * Página de error crítico — se muestra cuando el router falla inesperadamente.
 * @param {Error|unknown} [err]
 * @returns {string}
 */
const ErrorPage = (err) => {
  const isDev = process.env.NODE_ENV === 'development';
  const detail = isDev && err instanceof Error ? err.message : null;

  return `
    <div class="flex flex-col items-center justify-center min-h-screen px-4 text-center" role="main">
      <div class="relative mb-6">
        <div class="absolute inset-0 bg-rose-500/15 blur-2xl rounded-full"></div>
        <div class="relative rounded-full bg-slate-800/80 p-6 border border-rose-500/20">
          <svg class="w-12 h-12 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
      </div>
      <h1 class="text-3xl font-extrabold text-white mb-2">Algo salió mal</h1>
      <p class="text-slate-400 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
        Hubo un error inesperado al cargar esta página. Intenta recargar o regresa al inicio.
      </p>
      ${detail ? `
        <pre class="mb-6 text-left text-xs text-rose-300/70 bg-rose-500/5 border border-rose-500/15 rounded-lg p-4 max-w-md w-full overflow-x-auto">${detail}</pre>
      ` : ''}
      <div class="flex gap-3">
        <button
          onclick="window.location.reload()"
          class="inline-flex items-center gap-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors border border-slate-600/50 btn-press"
          aria-label="Recargar la página"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Recargar
        </button>
        <a
          href="#/"
          class="inline-flex items-center gap-2 rounded-lg bg-primary/10 hover:bg-primary/20 px-5 py-2.5 text-sm font-bold text-primary transition-colors border border-primary/20 btn-press"
          aria-label="Volver al inicio"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Inicio
        </a>
      </div>
    </div>
  `;
};

export default ErrorPage;
