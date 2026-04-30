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
Funciones que limitan la frecuencia de ejecución de otras operaciones pesadas, como peticiones a APIs externas (ej. búsqueda de criptomonedas). Se combina con **Skeleton Loading** para dar feedback inmediato.

```javascript
// Implementado en CoinPicker.js y AddAssetModal.js
const optimizedSearch = debounce(searchInAPI, 500);
searchInput.addEventListener('input', (e) => {
  showSkeleton(); // Feedback inmediato
  optimizedSearch(e.target.value); // Ejecución diferida
});
```

### Trade-offs
✅ **Pros:** Disminuye el número de peticiones a la API, optimizando el uso de recursos de red y evitando límites de la API de CoinGecko.
⚠️ **Cons:** Introduce una pequeña latencia intencional antes de obtener los resultados en UI.

*Ver ADR:* `docs/decisions/007-debounce-busquedas.md` y `008-optimizacion-busqueda-coingecko.md`

## 5. SVG Sprite System

### ¿Qué es y cómo funciona?
Centralización de assets vectoriales en un único archivo `src/assets/sprite.svg`. Los iconos se instancian en el DOM mediante el elemento `<use>` de SVG.

```html
<svg class="icon"><use href="assets/sprite.svg#icon-id"></use></svg>
```

### Trade-offs
✅ **Pros:** Reduce el número de peticiones HTTP, permite cachear todos los iconos y facilita el cambio de estilos vía CSS.
⚠️ **Cons:** Requiere mantenimiento manual del archivo sprite y cuidado con los IDs para evitar colisiones.

*Ver ADR:* `docs/decisions/009-correccion-sprite-svg.md`

## 6. Lazy Loading con Skeletons Contenidos

### ¿Qué es y cómo funciona?
Al diferir la carga de datos (Lazy Loading) para optimizar el renderizado inicial, los estados de carga no reemplazan la estructura base de la vista. Los componentes reciben un parámetro `isLoading` que les permite renderizar toda su "cáscara" (encabezados, botones de acción y contenedores restrictivos) e inyectar animaciones de carga (skeletons) únicamente en el área designada para los datos.

```javascript
const Componente = (datos, isLoading = false) => `
  <div class="vista-base" style="max-height: 360px">
    <header>Mis Datos</header>
    <div class="contenido">
      ${isLoading ? SkeletonLoader() : renderDatos(datos)}
    </div>
  </div>
`;
```

### Trade-offs
✅ **Pros:** Elimina el *Layout Shift* al mantener restricciones físicas exactas y permite interacción prematura con botones de navegación/cierre.
⚠️ **Cons:** Requiere lógica condicional y paramétrica adicional dentro de cada componente de presentación.

*Ver ADR:* `docs/decisions/011-lazy-loading-skeletons.md`

---
*Última actualización: 2026-04-30*
