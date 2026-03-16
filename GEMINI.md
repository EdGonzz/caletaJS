# Caleta - AI Assistant Quick-Start Reference

**CaletaJS** is a high-performance, simulated cryptocurrency investment tracker SPA built with Vanilla JavaScript and Webpack 5.

## Tech Stack

| Layer       | Technology              | Purpose                          |
|-------------|-------------------------|----------------------------------|
| Language    | JavaScript ES6+         | App logic (no TypeScript)        |
| Bundler     | Webpack 5 + Babel       | Build, HMR, asset processing     |
| Styles      | Tailwind CSS v4 + PostCSS | Utility-first design system   |
| Routing     | Custom Hash Router      | SPA navigation (`#/path`)        |
| Components  | Template Literals       | Pure functions returning HTML strings |
| Package Mgr | **pnpm** (v10.x)        | Dependency management            |

## Dev Commands

```bash
pnpm start   # Webpack dev server with HMR → http://localhost:8080
pnpm build   # Production bundle → /dist
```

## Architecture Rules (CRITICAL)

1. **No frameworks** — No React, Vue, Svelte, Angular. Components = `string`-returning functions.
2. **Event wiring happens after render** — Use `init*` named exports called from `router/routes.js`.
3. **Hash routes only** — Add routes to `routes.js` object + `resolveRoutes.js` static list.
4. **pnpm only** — Never `npm install` or `yarn add`.

## Key Files

| File                       | Purpose                                          |
|----------------------------|--------------------------------------------------|
| `src/router/routes.js`     | Route map + init calls after DOM inject          |
| `src/utils/resolveRoutes.js` | Maps hash segment → route key               |
| `src/styles/main.css`      | Global CSS + Tailwind `@theme` tokens            |
| `public/index.html`        | HTML shell (meta tags, `#header`, `#app`)        |

## Documentation Map

| Topic                | Link                                                  |
|----------------------|-------------------------------------------------------|
| Architecture Index   | [docs/arquitectura/README.md](docs/arquitectura/README.md) |
| Design Patterns      | [docs/arquitectura/patrones.md](docs/arquitectura/patrones.md) |
| Data Flow            | [docs/arquitectura/flujo-de-datos.md](docs/arquitectura/flujo-de-datos.md) |
| Design System        | [docs/arquitectura/sistema-de-diseno.md](docs/arquitectura/sistema-de-diseno.md) |
| Accessibility        | [docs/arquitectura/accesibilidad.md](docs/arquitectura/accesibilidad.md) |
| SEO                  | [docs/arquitectura/seo.md](docs/arquitectura/seo.md) |
| Testing              | [docs/arquitectura/testing.md](docs/arquitectura/testing.md) |
| Local Dev Setup      | [docs/runbooks/desarrollo-local.md](docs/runbooks/desarrollo-local.md) |
| Add a Route/View     | [docs/runbooks/agregar-ruta.md](docs/runbooks/agregar-ruta.md) |
| Troubleshooting      | [docs/runbooks/troubleshooting.md](docs/runbooks/troubleshooting.md) |
| Deploy               | [docs/runbooks/deploy.md](docs/runbooks/deploy.md) |
| ADRs                 | [docs/decisions/](docs/decisions/)                   |
