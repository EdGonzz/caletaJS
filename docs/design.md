# CaletaJS — Design System Standard

> Estándar de diseño para la creación de componentes y páginas en CaletaJS.
> Versión 1.0.0 — última actualización: mayo 2026.

---

## 1. Filosofía de diseño

CaletaJS es una **SPA financiera de alto rendimiento** construida con **Vanilla JS + Tailwind CSS v4**. La experiencia visual debe transmitir **precisión, seguridad y sofisticación técnica**.

### Principios rectores

| Principio | Aplicación |
|-----------|-----------|
| **Oscuridad funcional** | Fondo casi negro con gradientes sutiles. El tema oscuro reduce fatiga visual en sesiones de trading. |
| **Acentos cromáticos intencionales** | Púrpura (`#9079ff`) para identidad y acciones primarias. Verde neón (`#0bd570`) para datos positivos, crecimiento y acentos visuales. Rojo (`#ef4444`) exclusivamente para datos negativos. |
| **Tipografía de confianza** | `Space Grotesk` para títulos (personalidad moderna). `Inter` para cuerpo (legibilidad). Monoespaciada para cifras financieras (alineación y escaneo rápido). |
| **Jerarquía por opacidad** | Capas de vidrio (`backdrop-filter: blur`), bordes sutiles (`border-white/8`), y opacidades progresivas crean profundidad sin romper el fondo oscuro. |
| **Zero-JS por defecto** | Todo lo que pueda resolverse con CSS nativo (transiciones, animaciones, scroll) se mantiene en CSS. JS solo para interactividad y datos dinámicos. |
| **Datos primero** | Las visualizaciones (tablas, gráficos, donas) deben priorizar la legibilidad de cifras sobre decoración. |

---

## 2. Design Tokens de referencia

Definidos en `src/styles/main.css` vía la directiva `@theme` de Tailwind CSS v4.

### 2.1. Paleta de colores

| Token | Valor HEX | Uso |
|-------|-----------|-----|
| `--color-primary` | `#9079ff` | Acción principal, badges, iconos seleccionados, bordes activos |
| `--color-primary-glow` | `#0bd570` | Botón de submit principal (Add Transaction), sombras neón, datos positivos |
| `--color-accent-red` | `#ef4444` | Datos negativos (pérdidas), errores de validación |
| `--color-background-dark` | `#120f23` | Texto sobre botones primary (contraste) |
| `--color-background-darker` | `#020617` | — |
| `--color-card-dark` | `#1e293b` | Fondos de cards, skeleton shimmer |
| `--color-background-light` | `#f6f5f8` | — (reservado para modo claro futuro) |

**Clases Tailwind generadas**: `bg-primary`, `text-primary`, `border-primary`, `bg-primary/10`, `text-primary-glow`, `text-accent-red`, etc.

**Colores de Tailwind nativos usados**:
- `slate` (escala completa): fondos, bordes, texto secundario
- `emerald-400`, `emerald-500`: gradiente del logo
- `cyan-500`: gradiente del logo

**Colores contextuales en gráficos**:

| Dataset | Color |
|---------|-------|
| Positivo / crecimiento | `#0bd570` (primary-glow) |
| Negativo / pérdida | `#ef4444` (accent-red) |
| Neutro / stablecoin | `#64748b` (slate-500) |
| Fondo de chart | `transparent` |
| Grid de chart | `rgba(30, 41, 59, 0.5)` (slate-800/50) |

### 2.2. Tipografía

| Token | Stack | Clase Tailwind | Uso |
|-------|-------|----------------|-----|
| `--font-display` | `"Space Grotesk", sans-serif` | `font-display` | Títulos, headings, cifras destacadas en modales |
| `--font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` | `font-mono` | Precios, balances, valores USD, datos financieros |
| Body (default) | `"Inter", sans-serif` | (implícito en `body`) | Texto general, labels, descripciones |

### 2.3. Radios de borde

| Token | Valor | Clase Tailwind |
|-------|-------|----------------|
| `--radius-default` | `0.25rem` | `rounded` (4px) |
| `--radius-lg` | `0.5rem` | `rounded-lg` (8px) |
| `--radius-xl` | `0.75rem` | `rounded-xl` (12px) |

**Uso por contexto**: `rounded-xl` para cards y modales, `rounded-lg` para botones e inputs, `rounded-full` para avatares y badges.

### 2.4. Sombras

| Token | Valor | Aplicación |
|-------|-------|-----------|
| `--shadow-neon` | `0 0 15px rgba(11,213,112,0.4), 0 0 30px rgba(11,213,112,0.1)` | Elementos que requieren énfasis extremo (no usado actualmente en componentes) |
| `--shadow-glass` | `0 8px 32px 0 rgba(0,0,0,0.37)` | Paneles glass |

### 2.5. Breakpoints

Tailwind CSS v4 defaults:

| Breakpoint | Min-width | Uso típico |
|------------|-----------|------------|
| `sm` | 640px | Formularios en 2 columnas |
| `md` | 768px | Stats grid pasa a 2 columnas |
| `lg` | 1024px | Stats grid a 4 columnas, layout chart+donut a 12 columnas |
| `xl` | 1280px | — |
| `2xl` | 1536px | — |

---

## 3. Convenciones de componentes

### 3.1. Estructura de archivo

Cada componente reside en `src/components/NombreComponente.js`:

```javascript
// 1. Imports (sprite, dependencias, otros componentes, utils)
import sprite from "../assets/sprite.svg";
import { formatUsd } from "../utils/formatters";

// 2. Tipado JSDoc (obligatorio para props y parámetros)
/**
 * @param {{ title: string, value: number }} props
 * @returns {string}
 */

// 3. Función pura que retorna HTML string
const NombreComponente = ({ prop1, prop2 }) => {
  const view = `
    <div class="...">
      ${/* template literal con interpolación */}
    </div>
  `;
  return view;
};

// 4. Init function exportada (para interactividad post-render)
export const initNombreComponente = () => {
  const el = document.getElementById("id-elemento");
  if (!el) return;
  el.addEventListener("click", () => { /* lógica */ });
};

// 5. Export default (el render estático)
export default NombreComponente;
```

### 3.2. Patrón fundamental: render estático + init dinámico

Los componentes retornan **strings HTML**. Esto implica:

- **No se pueden usar inline event handlers** (`onclick`, `onchange`). No existen en strings.
- Toda interactividad se cablea en una función `init*()` exportada, usando `document.getElementById` / `querySelector` + `addEventListener`.
- Las funciones `init*()` **se llaman después de que el router inyecta el HTML en el DOM**.

```javascript
// En el router (routes.js):
root.innerHTML = await render();
// Solo después del render:
initActionToolbar();
initStatsGrid();
initHoldingsTable();
// ...
```

### 3.3. Comunicación entre componentes

Se usa **eventos personalizados del DOM** (`CustomEvent`) porque los componentes no comparten un estado centralizado:

| Evento | Dispatcher | Listeners | Payload |
|--------|-----------|-----------|---------|
| `prices-updated` | `HoldingsTable` al obtener precios | `StatsGrid`, `AllocationDonut` | `{ holdings: Array }` |
| `holdings-updated` | `AddAssetModal` al guardar transacción | `HoldingsTable` | `{ holding: Object }` |
| `caleta-filter-changed` | `ActionToolbar` al cambiar tab | `HoldingsTable` | `{ source: string }` |

```javascript
// Dispatch
window.dispatchEvent(new CustomEvent('prices-updated', { detail: { holdings } }));

// Listen
window.addEventListener('prices-updated', (e) => {
  const { holdings } = e.detail;
  // actualizar UI
});
```

### 3.4. Estado interno de componentes

Componentes con estado complejo (ej. `AddAssetModal`, `AddExchangeModal`) usan **variables a nivel de módulo**:

```javascript
/** @type {'buy'|'sell'|'transfer'} */
let activeTab = "buy";
let selectedCoin = DEFAULT_COIN;
let searchState = 'idle';
```

Esto funciona porque en una SPA con Vanilla JS no hay re-renders automáticos. La mutación de estado va seguida de una llamada explícita a `renderInner()` o manipulación directa del DOM.

### 3.5. Sub-componentes internos

Cuando un componente tiene variantes visuales significativas, se definen como funciones helper en el mismo archivo:

```javascript
const TabBtn = (value, label) => { /* ... */ };
const EmptyState = () => `...`;
const changeBadge = (change) => { /* ... */ };
```

Estas funciones **no se exportan** — son detalles de implementación del componente padre.

---

## 4. Convenciones de naming

### 4.1. Archivos y módulos

| Tipo | Convención | Ejemplos |
|------|-----------|----------|
| Componentes | `PascalCase.js` | `HoldingsTable.js`, `StatCard.js` |
| Páginas | `PascalCase.js` | `Home.js`, `About.js` |
| Utilidades | `camelCase.js` | `formatters.js`, `holdingsStorage.js` |
| Funciones exportadas | `camelCase` | `formatUsd()`, `getHoldings()` |
| Funciones init | `init` + `PascalCase` | `initHoldingsTable()`, `initActionToolbar()` |
| Constantes | `UPPER_SNAKE_CASE` | `PAGE_SIZE`, `DEFAULT_SOURCE`, `COLOR_PALETTE` |

### 4.2. IDs de elementos DOM

**Formato**: `kebab-case`, descriptivo, con prefijo de contexto.

```
{componente-abreviado}-{elemento}-{subelemento}
```

| ID | Componente |
|----|-----------|
| `holdings-table` | Tabla principal |
| `holdings-tbody` | Cuerpo de la tabla |
| `holdings-pagination` | Contenedor de paginación |
| `add-asset-modal` | Modal de transacción |
| `add-exchange-modal` | Modal de agregar exchange |
| `modal-backdrop` | Fondo del modal |
| `quantity-input` | Input de cantidad (dentro de modal) |
| `refresh-prices-btn` | Botón de refrescar precios |
| `stats-grid-container` | Contenedor de stats |
| `history-chart-container` | Contenedor del gráfico histórico |
| `allocation-donut-container` | Contenedor de la dona |

### 4.3. Data attributes

Todos en `kebab-case`, para binding desde JS y como selectores:

| Atributo | Uso |
|----------|-----|
| `data-page` | Número de página en paginación |
| `data-tab` | Valor del tab (`buy`, `sell`, `transfer`) |
| `data-filter` | Nombre del filtro de exchange |
| `data-coin-id` | ID de moneda en CoinPicker |
| `data-exchange-id` | ID de exchange |
| `data-exchange-name` | Nombre de exchange |
| `data-exchange-image` | URL de imagen de exchange |
| `data-days` | Días de historial en period selector |
| `data-current-page` | Página actual (en tabla) |
| `data-total-pages` | Total de páginas |
| `data-total-items` | Total de items |
| `data-page-size` | Items por página |

### 4.4. Clases CSS

- **99% clases utilitarias de Tailwind**. Evitar clases custom innecesarias.
- Las clases custom existentes son utilitarias atómicas:

| Clase | Propósito |
|-------|-----------|
| `.glass-panel` | Card con blur, fondo semitransparente y borde sutil |
| `.glass-nav` | Header con blur más intenso |
| `.neon-text` | Texto con glow verde |
| `.custom-scrollbar` | Scrollbar estilizada dark |
| `.skeleton-shimmer` | Animación de skeleton loading |
| `.modal-enter` | Animación de entrada de modal (slide-up + fade) |
| `.path-anim` | Animación de trazado SVG (stroke dash) |

- **NO** usar clases como `.card`, `.btn-primary`, `.modal`. Usar composición Tailwind directamente.

### 4.5. Clases de estado dinámico

Para estados toggleables, usar clases utilitarias de Tailwind directamente en la manipulación del DOM:

```javascript
el.classList.add("hidden");
el.classList.remove("opacity-0", "pointer-events-none");
el.classList.toggle("bg-primary/20");
```

---

## 5. Guía de componentes: clases Tailwind por tipo de elemento

### 5.1. Botones

#### Botón primario (CTA principal)
```html
<button class="bg-primary text-background-dark text-md font-bold hover:brightness-110 px-3 py-1 focus:outline-none">
  Label
</button>
```
Variante submit (verde):
```html
<button class="w-full py-4 bg-primary-glow hover:brightness-110 text-slate-900 font-bold rounded-xl shadow-lg shadow-primary-glow/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:outline-none">
  Add Transaction
</button>
```

#### Botón secundario (fondo oscuro)
```html
<button class="rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
  <svg>...</svg>
</button>
```

#### Botón de icono (toolbar)
```html
<button class="flex size-8 items-center justify-center rounded bg-slate-800 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
  <svg>...</svg>
</button>
```

#### Botón de filtro/pestaña (activo/inactivo)
```html
<!-- Activo -->
<button class="bg-primary text-background-dark text-md font-bold hover:brightness-110 px-3 py-1">
<!-- Inactivo -->
<button class="border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1">
```

#### Botón de modal tab (tipo segmented control)
```html
<!-- Activo -->
<button class="bg-slate-700 text-white shadow-sm ring-1 ring-white/10 flex-1 py-2 text-sm font-medium rounded-lg transition-all">
<!-- Inactivo -->
<button class="text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 flex-1 py-2 text-sm font-medium rounded-lg transition-all">
```

### 5.2. Tarjetas (cards)

**Card con glass effect** (paneles principales):
```html
<div class="glass-panel rounded-xl p-5">
  <!-- Contenido -->
</div>
```

**Card con hover interactivo** (StatCard):
```html
<article class="glass-panel group hover:border-primary/40 relative overflow-hidden rounded-xl p-5 transition-all duration-300">
  <h3 class="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">Title</h3>
  <span class="font-mono text-2xl font-bold text-white">$1,234.56</span>
</article>
```

**Card interna de feature** (About page):
```html
<div class="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30 flex flex-col gap-1.5">
```

### 5.3. Tablas

```html
<div class="custom-scrollbar overflow-x-auto min-h-[300px]">
  <table class="w-full border-collapse text-left" aria-label="Descriptive label">
    <thead>
      <tr class="border-b border-slate-700/50 bg-slate-800/30 text-xs tracking-wider text-slate-400 uppercase">
        <th class="px-6 py-4 font-semibold" scope="col">Column</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-700/30 text-sm" id="tbody-id">
      <!-- Filas -->
    </tbody>
  </table>
</div>
```

**Fila de tabla con hover**:
```html
<tr class="group transition-colors hover:bg-white/5">
  <td class="px-6 py-4">
    <div class="font-bold text-white">Name</div>
    <div class="text-xs text-slate-500">symbol</div>
  </td>
  <td class="px-6 py-4 text-right font-mono text-slate-300">$1,234</td>
</tr>
```

**Reglas de tabla**:
- Headers: `scope="col"` obligatorio
- Alineación de números: `text-right`
- Monospace para datos numéricos: `font-mono`
- Padding consistente: `px-6 py-4`

### 5.4. Modales

**Backdrop**:
```html
<div id="modal-backdrop" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] transition-opacity opacity-0 pointer-events-none" aria-hidden="true"></div>
```

**Contenedor del modal**:
```html
<div id="modal-id" class="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none opacity-0 transition-all duration-300" role="dialog" aria-modal="true" aria-label="Título accesible">
  <div id="modal-content" class="relative w-full max-w-lg bg-[#151e32] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden transform scale-95 transition-all duration-300 pointer-events-none max-h-[90vh] overflow-y-auto custom-scrollbar">
    <!-- Contenido -->
  </div>
</div>
```

**Reglas de modal**:
- `role="dialog"` y `aria-modal="true"` obligatorios
- `aria-label` en el modal describiendo su propósito
- Estado inicial: `opacity-0 pointer-events-none`
- `bg-[#151e32]` (un tono más claro que el fondo para contraste)
- `max-h-[90vh]` con `overflow-y-auto`
- Ancho máximo: `max-w-lg` (512px) para formularios, `max-w-[600px]` para listas
- Cerrar con Escape y click en backdrop
- `z-[100]` para backdrop, `z-[101]` para modal, `z-[110]`/`z-[111]` para modales anidados

### 5.5. Inputs de formulario

```html
<div class="space-y-2">
  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Label</label>
  <input type="text" class="w-full px-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-medium placeholder-slate-500 transition-all outline-none" placeholder="Placeholder" />
</div>
```

**Input con icono izquierdo**:
```html
<div class="relative group">
  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <svg class="w-4 h-4 text-slate-500"><use href="${sprite}#search"></use></svg>
  </div>
  <input class="block w-full pl-10 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-white transition-all" />
</div>
```

**Input con unidad derecha**:
```html
<div class="relative">
  <input class="w-full pl-4 pr-14 py-3 ..." />
  <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
    <span class="text-xs font-bold text-slate-400">BTC</span>
  </div>
</div>
```

**Variantes de input**:
- `type="number"`: agregar `step="any"`, `min="0"`
- `type="datetime-local"`: agregar `[&::-webkit-calendar-picker-indicator]:invert` para el icono en dark mode

### 5.6. Badges

**Badge de cambio positivo**:
```html
<span class="text-primary bg-primary/10 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold">
  <svg class="h-4 w-4"><use href="${sprite}#arrow-upward"></use></svg>
  +12.50%
</span>
```

**Badge de cambio negativo**:
```html
<span class="text-accent-red bg-accent-red/10 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold">
  <svg class="h-4 w-4"><use href="${sprite}#arrow-downward"></use></svg>
  5.23%
</span>
```

**Badge de cambio neutro (≤0.05%)**:
```html
<span class="inline-flex items-center gap-1 rounded bg-slate-700/30 px-2 py-0.5 text-xs font-bold text-slate-400">
  <svg class="h-4 w-4"><use href="${sprite}#minus"></use></svg>
  0.04%
</span>
```

**Badge de exchange/source**:
```html
<span class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-700/50 px-2.5 py-1 text-xs font-medium text-slate-300">
  <img src="..." class="h-4 w-4 rounded-sm object-contain" />
  Exchange Name
</span>
```

**Badge de overflow count**:
```html
<span class="inline-flex items-center rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-400">+3</span>
```

### 5.7. Selectores de lista (coin picker, exchange picker)

```html
<button class="coin-row w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary/40
  border-primary/60 bg-primary/5">   <!-- Seleccionado -->
<button class="... border-slate-700 bg-slate-800/40 hover:border-slate-500">   <!-- No seleccionado -->
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
      <img src="..." class="w-7 h-7 object-contain" />
    </div>
    <div class="text-left">
      <span class="font-bold text-white text-sm">Name</span>
      <span class="text-xs text-slate-400 font-medium ml-2">SYM</span>
    </div>
  </div>
  <!-- Indicador de selección -->
  <svg class="w-6 h-6 text-primary"><use href="${sprite}#circle-check"></use></svg>
  <!-- o -->
  <span class="text-xs font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mr-1">Seleccionar</span>
  <svg class="w-6 h-6 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"><use href="${sprite}#chevron-right"></use></svg>
</button>
```

---

## 6. Guía de layout

### 6.1. Contenedor principal

```html
<main class="px-4 pt-6 pb-20 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-[1600px] space-y-6">
    <!-- Secciones -->
  </div>
</main>
```

- Ancho máximo: `1600px` (`max-w-[1600px]`)
- Padding responsive: `px-4 sm:px-6 lg:px-8`
- Espaciado vertical entre secciones: `space-y-6` (24px)
- Padding inferior generoso: `pb-20` para scroll comfort

### 6.2. Grid system

**Stats grid** (4 columnas, responsive):
```html
<section class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
```

**Layout chart + donut** (8 + 4 columnas):
```html
<section class="grid grid-cols-1 gap-6 lg:min-h-[400px] lg:grid-cols-12">
  <div class="lg:col-span-8"><!-- Chart --></div>
  <div class="lg:col-span-4"><!-- Donut --></div>
</section>
```

**Formulario en 2 columnas** (responsive):
```html
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

### 6.3. Alturas mínimas

- Tablas: `min-h-[300px]` para evitar saltos de layout durante carga
- Charts/donas: `min-h-55` (220px)
- Modales: `max-h-[90vh]`

### 6.4. Barras de scroll

- Tablas con overflow horizontal: `custom-scrollbar overflow-x-auto`
- Listas con overflow vertical: `custom-scrollbar overflow-y-auto` + altura máxima explícita (`max-h-[320px]`, `max-h-[360px]`)

### 6.5. Stacking context (z-index)

| Capa | z-index | Elemento |
|------|---------|----------|
| Fondo decorativo | `-z-10` | Blobs del modal |
| Contenido normal | auto | — |
| Header sticky | `z-50` | Nav principal |
| Modal backdrop | `z-[100]` | Overlay oscuro |
| Modal content | `z-[101]` | Modal principal |
| Modal anidado backdrop | `z-[110]` | Overlay de AddExchangeModal |
| Modal anidado content | `z-[111]` | Contenido de AddExchangeModal |

---

## 7. Estados visuales

### 7.1. Loading / Skeleton

**Lista con skeleton rows** (usar utilidad `SkeletonRow` de `src/utils/skeletonRow.js`):
```javascript
import SkeletonRow from "../utils/skeletonRow";
// ...
container.innerHTML = Array.from({ length: 4 }, () => SkeletonRow()).join("");
```

La clase `.skeleton-shimmer` aplica la animación de shimmer.

**Spinner circular** (para charts y áreas de carga):
```html
<div class="flex flex-col items-center justify-center gap-3 py-12">
  <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" role="status" aria-label="Loading..."></div>
  <span class="text-xs text-slate-400 font-medium">Mensaje descriptivo...</span>
</div>
```

### 7.2. Empty state

Patrón: icono decorativo grande (con glow opcional) + título + descripción + CTA opcional.

```html
<div class="flex flex-col items-center justify-center py-10 text-center gap-3">
  <svg class="w-12 h-12 text-slate-600" aria-hidden="true">
    <use href="${sprite}#icon-name"></use>
  </svg>
  <p class="text-slate-400 font-semibold text-sm">Título descriptivo</p>
  <p class="text-slate-500 text-xs max-w-52">Descripción con siguiente paso.</p>
  <!-- CTA opcional -->
  <button class="inline-flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg border border-primary/20 transition-all focus:outline-none">
    <svg class="w-4 h-4 mr-2"><use href="${sprite}#plus" /></svg>
    Acción
  </button>
</div>
```

**Variante con glow** (empty state de tabla):
```html
<div class="relative">
  <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
  <div class="relative rounded-full bg-slate-800/50 p-6 border border-slate-700/50">
    <svg class="h-10 w-10 text-slate-500" aria-hidden="true">
      <use href="${sprite}#wallet" />
    </svg>
  </div>
</div>
```

### 7.3. Error state

```html
<div class="flex flex-col items-center justify-center py-12 text-center">
  <svg class="w-12 h-12 text-rose-500/60 mb-4"><use href="${sprite}#circle-x"></use></svg>
  <p class="text-slate-300 font-medium mb-1">Mensaje de error</p>
  <p class="text-slate-500 text-sm">Sugerencia o causa.</p>
</div>
```

### 7.4. Estados de interacción

| Estado | Clases |
|--------|--------|
| **Hover** (elementos interactivos) | `hover:bg-white/5`, `hover:bg-white/10`, `hover:bg-slate-700`, `hover:text-white`, `hover:border-primary/40` |
| **Hover** (filas de lista) | `group-hover:opacity-100` para revelar acciones |
| **Focus** (inputs, botones) | `focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary` |
| **Active** (botones) | `active:scale-[0.99]` |
| **Disabled** | `disabled:cursor-not-allowed disabled:opacity-50` |
| **Seleccionado / activo** | `bg-primary/10 text-primary border-primary/60` |

---

## 8. Convenciones de iconos

### 8.1. Archivo sprite

Todos los iconos residen en `src/assets/sprite.svg`, un archivo SVG con elementos `<symbol>`.

### 8.2. Importación

```javascript
import sprite from "../assets/sprite.svg";
```

Webpack procesa `.svg` como asset resource (ver `webpack.config.js` → `type: "asset/resource"`), por lo que `sprite` es una URL al archivo procesado.

### 8.3. Uso

```html
<svg class="w-5 h-5" aria-hidden="true">
  <use href="${sprite}#icon-name"></use>
</svg>
```

### 8.4. Iconos disponibles

| ID | Descripción | Tipo |
|----|-------------|------|
| `plus` | Añadir/crear | Stroke |
| `wallet` | Billetera/cartera | Stroke |
| `search` | Búsqueda | Stroke |
| `filter-2` | Filtro | Stroke |
| `close` | Cerrar/× | Stroke |
| `check` | Checkmark | Stroke |
| `circle-check` | Checkmark en círculo (seleccionado) | Fill |
| `circle-plus` | + en círculo (añadir) | Stroke |
| `circle-x` | × en círculo (error) | Stroke |
| `pencil` | Editar/notas | Stroke |
| `refresh` | Refrescar/recargar | Stroke |
| `dots-vertical` | Menú contextual (⋮) | Stroke |
| `arrow-upward` | Flecha arriba | Stroke |
| `arrow-downward` | Flecha abajo | Stroke |
| `arrow-left` | Flecha izquierda (volver) | Stroke |
| `chevron-left` | Chevron izquierdo (paginación) | Stroke |
| `chevron-right` | Chevron derecho (paginación) | Stroke |
| `chevron-down` | Chevron abajo (dropdown) | Stroke |
| `minus` | Guion (neutro/estable) | Stroke |
| `trending-up` | Tendencia alcista | Stroke |
| `trending-down` | Tendencia bajista | Stroke |
| `chart-pie` | Gráfico de torta | Stroke |
| `chart-area-line` | Gráfico de área | Stroke |
| `rocket` | Cohete (top mover) | Stroke |
| `layout-dashboard` | Dashboard/grid | Fill |

### 8.5. Reglas de iconos

- **Iconos decorativos**: `aria-hidden="true"` obligatorio
- **Iconos en botones sin texto**: `aria-label` obligatorio en el botón
- **Dimensiones**: usar `w-{n} h-{n}` de Tailwind, consistente con el contexto:
  - Toolbars y acciones de tabla: `w-5 h-5`
  - Paginación: `h-4 w-4`
  - Estados vacíos: `w-12 h-12`
  - Badges inline: `h-4 w-4`
  - Modales (close, back): `w-6 h-6`

### 8.6. Añadir nuevos iconos

1. Agregar `<symbol>` en `src/assets/sprite.svg` con `id="nombre-en-kebab-case"`
2. Usar iconos de [Tabler Icons](https://tabler.io/icons) (estilo consistente 24×24, stroke-width 2)
3. Preferir `fill="none" stroke="currentColor"` para heredar color del padre

---

## 9. Guía de gráficos y visualizaciones de datos

### 9.1. HistoryChart (gráfico de área)

- **Librería**: `lightweight-charts` v5 (TradingView)
- **Tipo**: `AreaSeries`
- **Colores**: línea `#0bd570`, gradiente `rgba(11,213,112,0.2)` → `rgba(11,213,112,0.0)`
- **Fondo**: transparente (hereda del panel glass)
- **Grid**: `rgba(30,41,59,0.5)` horizontal y vertical
- **Crosshair**: `#0bd570`, dashed (`style: 3`)
- **Responsive**: `autoSize: true`
- **Sin interacción de zoom**: `handleScroll: false, handleScale: false`
- **Limpieza**: exportar y llamar `cleanupHistoryChart()` antes de navegación SPA (evita memory leaks)

### 9.2. AllocationDonut (gráfico de dona SVG)

- **Implementación**: SVG nativo (sin librería)
- **Radio**: `r=40` en viewBox `0 0 100 100`
- **Ancho de trazo**: `10`
- **Gap inicial**: círculo base `#1e293b` (slate-800)
- **Segmentos**: `stroke-linecap="round"` (excepto cuando `pct === 100`)
- **Animación**: `class="transition-all duration-500"` en los círculos
- **Paleta cíclica**: 7 colores premium

```javascript
const COLOR_PALETTE = [
  { stroke: "#0bd570", class: "bg-primary", shadow: "shadow-[0_0_8px_#0bd570]" },
  { stroke: "#3b82f6", class: "bg-blue-500", shadow: "shadow-[0_0_8px_#3b82f6]" },
  { stroke: "#f43f5e", class: "bg-rose-500", shadow: "shadow-[0_0_8px_#f43f5e]" },
  { stroke: "#f59e0b", class: "bg-amber-500", shadow: "shadow-[0_0_8px_#f59e0b]" },
  { stroke: "#a855f7", class: "bg-purple-500", shadow: "shadow-[0_0_8px_#a855f7]" },
  { stroke: "#06b6d4", class: "bg-cyan-500", shadow: "shadow-[0_0_8px_#06b6d4]" },
  { stroke: "#10b981", class: "bg-emerald-500", shadow: "shadow-[0_0_8px_#10b981]" },
];
```

### 9.3. Sparklines (AssetRow, StatsGrid)

- **Implementación**: SVG inline con viewBox `0 0 100 30` (AssetRow) o `0 0 100 20` (StatCard)
- **Atributos**: `preserveAspectRatio="none"`, `vector-effect="non-scaling-stroke"`
- **Stablecoins**: línea plana con `stroke-dasharray="4 4"`, color `#64748b`
- **Colores dinámicos**: `#0bd570` (positivo), `#ef4444` (negativo)
- **Responsive**: `class="h-full w-full"` en el SVG, altura controlada por el contenedor padre

### 9.4. Barras de progreso (StatCard)

```html
<div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
  <div class="bg-primary h-full w-full shadow-[0_0_10px_#0bd570]"></div>
</div>
```

### 9.5. Principios de visualización

- **Colores semánticos**: verde = positivo/crecimiento, rojo = negativo/pérdida, slate = neutro/stable
- **Datos financieros**: siempre `font-mono` para alineación de decimales
- **Estados sin datos**: mostrar empty state informativo, nunca un gráfico vacío
- **Accesibilidad**: `aria-label` en SVGs que contienen datos, `role="img"` o `role="progressbar"` según corresponda
- **Transiciones**: usar `transition-all duration-500` en cambios de datos para suavidad visual

---

## 10. Convenciones de accesibilidad (WCAG 2.1 AA)

### 10.1. Checklist por tipo de elemento

**Tablas**:
- [ ] `<table>` con `aria-label` descriptivo
- [ ] `<th>` con `scope="col"` (o `scope="row"`)
- [ ] `<thead>`, `<tbody>` bien definidos

**Modales**:
- [ ] `role="dialog"` y `aria-modal="true"`
- [ ] `aria-label` en el contenedor del modal describiendo su propósito
- [ ] Foco atrapado (al menos cerrar con Escape)
- [ ] `aria-hidden="true"` en el backdrop
- [ ] Cerrar con Escape implementado

**Formularios**:
- [ ] `<label>` asociado a cada input (implícito por anidamiento o `for`)
- [ ] `aria-label` en inputs sin label visible (ej. búsqueda)
- [ ] Placeholder informativo pero no sustituto del label
- [ ] Estados de error comunicados visualmente y por atributo (`aria-invalid` donde aplique)

**Botones**:
- [ ] Texto descriptivo o `aria-label` en botones de solo icono
- [ ] `aria-pressed` en botones toggle (ej. períodos del chart, tabs)
- [ ] `aria-current="page"` en paginación activa

**Navegación**:
- [ ] `<nav>` para navegación principal
- [ ] `role="navigation"` en paginación
- [ ] `role="group"` con `aria-label` para grupos de botones (ej. selector de período)

**Gráficos y SVG**:
- [ ] SVG decorativos: `aria-hidden="true"`
- [ ] SVG con datos: `aria-label` describiendo el contenido
- [ ] `role="img"` en SVGs informativos
- [ ] `role="progressbar"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax` en barras de progreso

**Estados dinámicos**:
- [ ] `aria-live="polite"` en regiones que se actualizan dinámicamente (resultados de búsqueda)
- [ ] `role="status"` en indicadores de carga

### 10.2. Color y contraste

- No usar color como único medio de comunicación. Acompañar con iconos (↑↓) y texto (+/−).
- Los textos `text-slate-400` (#94a3b8) sobre `bg-slate-900` (#0f172a) tienen contraste suficiente para texto secundario.
- Los textos `text-slate-500` (#64748b) solo para elementos decorativos o no esenciales.

### 10.3. Foco y teclado

- **Indicador de foco visible**: `focus:ring-2 focus:ring-primary/20 focus:border-primary` en inputs
- **Orden de tabulación lógico**: el DOM dicta el orden de tab. Mantener estructura semántica.
- **Atajos de teclado**: Escape para cerrar/retroceder en modales. Enter para confirmar (ej. búsqueda).

---

## 11. Checklist de creación de nuevo componente

Usar esta checklist al crear cualquier componente nuevo:

### 11.1. Archivo y estructura

- [ ] Archivo creado en `src/components/NombreComponente.js`
- [ ] Import de sprite: `import sprite from "../assets/sprite.svg";`
- [ ] Tipos JSDoc documentados en props y parámetros
- [ ] Función pura que retorna HTML string (default export)
- [ ] Función `init*()` exportada para cablear interactividad

### 11.2. HTML y CSS

- [ ] Solo clases Tailwind (sin CSS custom a menos que sea estrictamente necesario)
- [ ] IDs en kebab-case con prefijo de contexto
- [ ] Data attributes en kebab-case para binding JS
- [ ] Si necesita clase custom → evaluar con el equipo y agregar a `main.css`

### 11.3. Accesibilidad

- [ ] `aria-label` en todo elemento interactivo sin texto visible
- [ ] `aria-hidden="true"` en SVG decorativos
- [ ] Roles semánticos (`role`, `aria-modal`, `aria-live`, etc.)
- [ ] Estados de foco visibles (`focus:ring-2 focus:ring-primary/20`)
- [ ] Navegación por teclado funcional (Escape, Enter, Tab)

### 11.4. Estados

- [ ] **Loading**: skeleton con `.skeleton-shimmer` o spinner `animate-spin`
- [ ] **Empty**: componente interno con icono + texto + CTA opcional
- [ ] **Error**: componente interno con `circle-x` + mensaje descriptivo
- [ ] **Hover**: transiciones suaves (`transition-colors`, `transition-all`)
- [ ] **Active**: feedback visual (`active:scale-[0.99]`)
- [ ] **Disabled**: `disabled:cursor-not-allowed disabled:opacity-50`

### 11.5. Integración

- [ ] Si requiere datos dinámicos: escucha eventos custom (`addEventListener`) o recibe props
- [ ] Si produce datos: dispara eventos custom (`dispatchEvent`)
- [ ] Registrado en `routes.js` si es una página nueva
- [ ] Init function llamada en el router después del render
- [ ] Si usa gráficos: exportar y llamar función de cleanup en navegación

### 11.6. Datos financieros

- [ ] Usar `formatUsd()`, `formatPercent()`, `formatBalance()` de `src/utils/formatters.js`
- [ ] Cifras en `font-mono`
- [ ] Valores positivos/negativos diferenciados con color + icono (nunca solo color)
- [ ] Escapar contenido dinámico con `escapeHTML()` de `src/utils/helpers.js`

### 11.7. Revisión final

- [ ] Consistencia visual con el resto de la app
- [ ] Sin dependencias externas innecesarias (Zero-JS por defecto)
- [ ] Sin `onclick`, `onchange` ni handlers inline en los strings HTML
- [ ] `import` paths correctos (relativos desde `src/components/`)
- [ ] Funciona en todos los breakpoints (sm, md, lg)
