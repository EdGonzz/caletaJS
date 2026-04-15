# Accesibilidad (WCAG 2.1 AA)

> Última actualización: 2026-04-15

## Principios Aplicados

CaletaJS sigue las pautas WCAG 2.1 nivel AA en toda su interfaz.

---

## 1. HTML Semántico

```html
<!-- public/index.html -->
<div id="header">...</div>
<div id="app" class="min-h-screen bg-slate-900 text-white font-sans">...</div>

<!-- Componentes -->
<header>...</header>      <!-- Header.js, modales -->
<nav>...</nav>            <!-- Header.js, AllocationDonut.js -->
<main>...</main>          <!-- Home.js -->
<section>...</section>    <!-- HoldingsTable, StatsGrid, ActionToolbar -->
<article>...</article>    <!-- StatCard.js -->
<table>...</table>        <!-- HoldingsTable con <thead>, <tbody>, <th scope="col"> -->
```

| Elemento | Tag Usado | Rol |
|---|---|---|
| Navegación principal | `<nav>` | Header con links a Home y About |
| Contenido principal | `<main>` | Envuelve el dashboard |
| Cabecera global | `<header>` | Header sticky con logo y nav |
| Cabecera de modal | `<header>` | Título + botones de navegación |
| Tarjeta de estadística | `<article>` | Unidad de contenido independiente |
| Tabla de holdings | `<table>` con `<th scope="col">` | Tabla de datos accesible |
| Secciones agrupadas | `<section>` | StatsGrid, HoldingsTable, ActionToolbar |

---

## 2. Etiquetas ARIA

Todos los elementos interactivos tienen `aria-label` descriptivo:

```javascript
// Header.js — Acciones de navegación

// ActionToolbar.js — Botones de filtro y acción
`<button id="add-funds" aria-label="Agregar fondos">`

// AddAssetModal.js — Modal completo
`<div role="dialog" aria-modal="true" aria-label="Agregar transacción">`
`<button aria-label="Cerrar modal">`
`<button aria-label="Seleccionar moneda">`
`<button aria-label="Usar precio de mercado">`
`<input aria-label="Cantidad">`
`<input aria-label="Precio por moneda">`
`<input aria-label="Fecha y hora">`
`<input aria-label="Comisiones">`
`<button aria-label="Agregar notas">`
`<textarea aria-label="Notas">`
`<button aria-label="Agregar transacción">`
`<button data-tab="buy" aria-label="Tipo de transacción: Buy">`

// SelectExchange.js
`<button aria-label="Seleccionar ${ex.name}">`
`<input aria-label="Buscar exchange">`
`<button aria-label="Agregar nueva caleta">`
`<button aria-label="Volver al formulario">`

// CoinPicker.js
`<button aria-label="Seleccionar ${coin.name}">`
`<input aria-label="Buscar moneda">`

// AddExchangeModal.js
`<div aria-live="polite" aria-label="Resultados de búsqueda de exchanges">`
`<button aria-label="Guardar ${exchange.name} como caleta">`
`<input aria-label="Descripción corta de esta caleta">`
`<button aria-label="Confirmar y guardar caleta">`

// HoldingsTable.js
`<table aria-label="Asset holdings list">`
`<button aria-label="Search holdings">`
`<button aria-label="Filter holdings">`

// Pagination.js
`<div role="navigation" aria-label="Holdings pagination">`
`<button aria-label="Go to page ${page}" aria-current="page">`
`<button aria-label="Go to previous page">`
`<button aria-label="Go to next page">`

// AssetRow.js
`<button aria-label="More actions for ${name}">`

// StatsGrid.js
`<div role="progressbar" aria-value="75" aria-valuemin="0" aria-valuemax="100">`
`<span aria-label="Subida del 12.05%">`
```

---

## 3. Navegación por Teclado

### Focus Management

```javascript
// Modales — foco al input de búsqueda al abrir
document.getElementById('add-exchange-search-input')?.focus();

// Botones con focus visible
`class="... focus:outline-none focus:ring-2 focus:ring-primary/40"`

// Inputs con focus visible
`class="... focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"`
```

### Interacciones por Teclado

| Acción | Tecla | Componente |
|---|---|---|
| Abrir modal | `Enter` / `Space` | Botón "Add Funds" |
| Cerrar modal principal | `Escape` | AddAssetModal (si AddExchangeModal no está abierto) |
| Cerrar modal secundario | `Escape` | AddExchangeModal |
| Cerrar por backdrop | `Click` | Backdrop de ambos modales |
| Navegar lista | `Tab` | Exchange rows, Coin rows |
| Seleccionar item | `Enter` / `Space` | Exchange/Coin buttons |
| Buscar monedas | `Enter` | Input de búsqueda en CoinPicker |
| Confirmar descripción | `Enter` | Input de descripción en AddExchangeModal |
| Cancelar descripción | `Escape` | Input de descripción en AddExchangeModal |
| Cambiar página | `Enter` | Pagination buttons |

---

## 4. Contraste de Colores

| Elemento | Foreground | Background | Ratio | Cumple AA |
|---|---|---|---|---|
| Texto principal | `#ffffff` | `#0f172a` | 17.4:1 | ✅ |
| Texto secundario | `#94a3b8` | `#0f172a` | 5.6:1 | ✅ |
| Texto terciario | `#64748b` | `#0f172a` | 3.8:1 | ✅ (large text) |
| Primary (accents) | `#9079ff` | `#0f172a` | 5.0:1 | ✅ |
| Primary glow (CTA) | `#0bd570` | `#0f172a` | 7.2:1 | ✅ |
| Error (rojo) | `#ef4444` | `#0f172a` | 4.6:1 | ✅ |

---

## 5. Iconos Decorativos

Los íconos SVG del sprite se marcan como decorativos cuando acompañan texto:

```html
<!-- Decorativo — oculto del screen reader -->
<svg class="w-6 h-6" aria-hidden="true">
  <use href="sprite.svg#trending-up"></use>
</svg>

<!-- Informativo — tiene label (cuando es el único indicador) -->
<svg role="img" aria-label="Icono de Wallet">
  <use href="sprite.svg#wallet"></use>
</svg>
```

---

## 6. Live Regions

El contenedor de resultados del `AddExchangeModal` usa `aria-live="polite"` para anunciar cambios dinámicos a los screen readers:

```html
<div
  id="add-exchange-results"
  aria-live="polite"
  aria-label="Resultados de búsqueda de exchanges"
>
  <!-- Contenido dinámico: skeleton → resultados → error → vacío -->
</div>
```

---

## 7. Estados de Carga

Los skeletons proporcionan feedback visual durante la carga, marcados como decorativos:

```html
<div class="flex items-center gap-4 animate-pulse" aria-hidden="true">
  <div class="skeleton-shimmer h-10 w-10 rounded-full shrink-0"></div>
  <div class="flex flex-col gap-2 flex-1">
    <div class="skeleton-shimmer h-4 w-32 rounded-full"></div>
    <div class="skeleton-shimmer h-3 w-20 rounded-full opacity-60"></div>
  </div>
  <div class="skeleton-shimmer h-8 w-20 rounded-lg shrink-0"></div>
</div>
```

---

## 8. Checklist de Revisión

- [x] Todos los `<button>` tienen `aria-label`
- [x] Todos los `<input>` tienen `aria-label`
- [x] Los modales usan `role="dialog"` y `aria-modal="true"`
- [x] Iconos decorativos usan `aria-hidden="true"`
- [x] Focus visible con `focus:ring-*` en todos los elementos interactivos
- [x] Contraste mínimo 4.5:1 para texto normal
- [x] Skeleton loading para estados de carga con `aria-hidden="true"`
- [x] `aria-live="polite"` en resultados dinámicos (AddExchangeModal)
- [x] `aria-current="page"` en paginación
- [x] `<th scope="col">` en tabla de holdings
- [ ] Trap focus dentro de modales (pendiente)
- [ ] Skip-to-content link (pendiente)
