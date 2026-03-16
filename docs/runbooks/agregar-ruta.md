# Cómo Agregar una Nueva Ruta o Vista

Guía paso a paso para extender el router de CaletaJS con una nueva vista.

---

## Ejemplo: Agregar la vista `/portfolio`

### Paso 1 — Crear el componente de página

```javascript
// src/pages/Portfolio.js

const Portfolio = () => {
  return `
    <main class="px-4 pt-6 pb-20 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-[1600px]">
        <h1 class="text-2xl font-bold text-white mb-6">Mi Portfolio</h1>
        <!-- Contenido de la vista -->
      </div>
    </main>
  `;
};

export default Portfolio;
```

Si la vista tiene interactividad, exporta también una función `init`:

```javascript
// Al final del mismo archivo
export const initPortfolio = () => {
  const btn = document.getElementById("portfolio-action-btn");
  btn?.addEventListener("click", () => { /* ... */ });
};
```

---

### Paso 2 — Registrar el componente en el router

```javascript
// src/router/routes.js
import Portfolio from "../pages/Portfolio";       // ← Añadir import
import { initPortfolio } from "../pages/Portfolio"; // ← Si tiene init

const routes = {
  "/": Home,
  "/about": About,
  "/coin/:id": CoinDetails,
  "/portfolio": Portfolio,   // ← Añadir aquí
  "/404": Error404,
};

const router = async () => {
  // ... (código existente)
  root.innerHTML = await render();

  if (path === "/") {
    initHoldingsTable();
    initAddAssetModal();
  }

  if (path === "/portfolio") {   // ← Añadir bloque init
    initPortfolio();
  }
};
```

---

### Paso 3 — Configurar resolveRoutes (si es necesario)

Si la ruta es **estática** (sin parámetros dinámicos), agregarla al array:

```javascript
// src/utils/resolveRoutes.js
const staticRoutes = ["about", "404", "portfolio"]; // ← Añadir aquí
```

Si es **dinámica** (ej. `/portfolio/:id`), agregar un caso:

```javascript
if (path === "portfolio") return "/portfolio/:id";
```

---

### Paso 4 — Agregar enlace en el Header (opcional)

```javascript
// src/components/Header.js
<a href="#/portfolio" class="text-slate-300 hover:text-emerald-400 transition font-medium">
  Portfolio
</a>
```

---

## Checklist

- [ ] Crear `src/pages/NombrePagina.js` con `export default` del render fn
- [ ] Si es interactiva: exportar `initNombrePagina`
- [ ] Importar en `src/router/routes.js`
- [ ] Añadir al objeto `routes`
- [ ] Llamar `init*` en el bloque correspondiente del router
- [ ] Actualizar `resolveRoutes.js` si aplica
- [ ] Añadir enlace en `Header.js` si aplica

---

*Última actualización: 2026-03-15*
