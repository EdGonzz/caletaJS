# Patrones de Diseño

El proyecto aplica patrones funcionales y declarativos, priorizando el rendimiento y evitando dependencias externas donde las APIs nativas del navegador son suficientes.

## 1. Componentes como Funciones Puras (Template Literals)

### ¿Qué es y cómo funciona?
Los componentes de UI (`src/components/` y `src/pages/`) no mantienen un ciclo de vida complejo. Son funciones puras que reciben datos (parámetros) y retornan un string HTML utilizando *template literals*.

```javascript
const StatCard = (title, value) => `
  <div class="stat-card">
    <h3>${title}</h3>
    <p>${value}</p>
  </div>
`;
```

### Trade-offs
✅ **Pros:** Extremadamente rápido, cero dependencias, fácil de probar de manera aislada (pruebas unitarias sobre strings).
⚠️ **Cons:** No soporta *event listeners* integrados (`onClick`). Los eventos deben adjuntarse manualmente después de que el HTML es insertado en el DOM.

*Ver ADR:* `docs/decisions/002-arquitectura-sin-framework.md`

## 2. Inicializadores de DOM Diferidos (Post-Render Event Wiring)

### ¿Qué es y cómo funciona?
Dado que los componentes retornan strings de HTML puro, la interactividad es gestionada por funciones exportadas con el prefijo `init` (e.g., `initHoldingsTable()`). Estas se llaman desde el enrutador **después** de inyectar el HTML en `#app`.

### Trade-offs
✅ **Pros:** Mantiene estricta separación de responsabilidades entre el marcado y el comportamiento.
⚠️ **Cons:** Mayor posibilidad de fugas de memoria si no se gestiona bien la destrucción de eventos al cambiar de ruta, aunque el reemplazo mediante `innerHTML` recolecta eventos básicos del DOM.

## 3. Custom Hash Router

### ¿Qué es y cómo funciona?
Un manejador de rutas basado en los eventos `hashchange` y `load` del objeto `window`. Lee la URL actual (`window.location.hash`), determina el componente a renderizar mediante un objeto de configuración (`resolveRoutes`), e inyecta la vista en el elemento raíz de la app.

### Trade-offs
✅ **Pros:** Permite SPAs sin requerir configuración adicional en el servidor para el manejo de rutas (a diferencia de la API de HTML5 History).
⚠️ **Cons:** Las URLs incluyen `#`, lo cual es menos elegante estéticamente y menos favorable para SEO nativo que las URLs limpias.

*Ver ADR:* `docs/decisions/003-hash-router.md`

## 4. Debounce Optimization en Entradas de Texto

### ¿Qué es y cómo funciona?
Funciones que limitan la frecuencia de ejecución de otras operaciones pesadas, como peticiones a APIs externas (ej. búsqueda de criptomonedas). 

```javascript
// Implementado en CoinPicker.js y AddAssetModal.js
let debounceTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    searchInAPI(e.target.value);
  }, 300);
});
```

### Trade-offs
✅ **Pros:** Disminuye el número de peticiones a la API, optimizando el uso de recursos de red y evitando límites de la API de CoinGecko.
⚠️ **Cons:** Introduce una pequeña latencia intencional antes de obtener los resultados en UI.

*Ver ADR:* `docs/decisions/007-debounce-busquedas.md` y `008-optimizacion-busqueda-coingecko.md`

---
*Última actualización: 2026-04-26*
