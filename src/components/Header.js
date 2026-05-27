/**
 * @param {string} [currentPath='/'] - Ruta actual resuelta (ej. '/', '/about')
 */
const Header = (currentPath = '/') => {
  const isActive = (path) => currentPath === path ? 'aria-current="page"' : '';

  const view = `
    <header class="glass-nav sticky top-0 z-50">
      <div class="px-4 sm:px-6 lg:px-8">
        <section class="flex items-center justify-between h-12">
          <section class="flex items-center">
            <a href="#/" class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0bd570] to-[#06b6d4]" aria-label="Caleta — Inicio">
              Caleta
            </a>
          </section>

          <nav class="flex items-center gap-6" aria-label="Main navigation">
            <a href="#/" class="text-slate-300 hover:text-primary-light transition font-medium" ${isActive('/')}>
              Home
            </a>
            <a href="#/about" class="text-slate-300 hover:text-primary-light transition font-medium" ${isActive('/about')}>
              About
            </a>
          </nav>
        </section>
      </div>
    </header>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Caleta",
        "alternateName": "CaletaJS",
        "description": "High-performance cryptocurrency portfolio simulator with real-time tracking.",
        "url": "https://caleta.app",
        "inLanguage": "en",
        "publisher": {
          "@type": "Organization",
          "name": "Caleta"
        }
      }
    </script>
  `;

  return view;
};

export default Header;
