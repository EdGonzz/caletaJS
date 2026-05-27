const NotFound = () => {
  return `
    <div class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 class="text-6xl font-extrabold text-slate-400">404</h1>
      <p class="mt-4 text-xl text-slate-300">Page not found</p>
      <p class="mt-2 text-sm text-slate-500 max-w-md">The page you are looking for does not exist or has been moved.</p>
      <a href="#/" class="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors" aria-label="Return to home page">
        <svg class="h-4 w-4" aria-hidden="true"><use href="./src/assets/sprite.svg#home"></use></svg>
        Go back home
      </a>
    </div>
  `
}

export default NotFound;