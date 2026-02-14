const Header = () => {
  const view = `
    <header class="bg-slate-900 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div class="px-4 sm:px-6 lg:px-8">
        <section class="flex items-center justify-between h-12">
          <section class="flex items-center">
            <a href="#/" class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              Caleta
            </a>
          </section>
          
          <nav class="flex items-center gap-6">
            <a href="#/" class="text-slate-300 hover:text-emerald-400 transition font-medium">
              Home
            </a>
            <a href="#/about" class="text-slate-300 hover:text-emerald-400 transition font-medium">
              About
            </a>
          </nav>
        </section>
      </div>
    </header>
  `;

  return view;
};

export default Header;
