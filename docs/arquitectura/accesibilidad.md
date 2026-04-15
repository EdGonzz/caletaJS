# Accesibilidad (WCAG 2.1 AA)

> Última actualización: 2026-04-14

## Principios Aplicados

CaletaJS sigue las pautas WCAG 2.1 nivel AA en toda su interfaz.

---

## 1. HTML Semántico

```html
<!-- public/index.html -->
<header id="header">...</header>
<main id="app" role="main">...</main>

<!-- Componentes -->
<nav aria-label="Navegación principal">...</nav>
<article class="asset-row">...</article>
<table role="table">...</table>
```

| Elemento | Tag Usado | Rol |
|---|---|---|
| Navegación | `<nav>` | Navegación principal |
| Contenido principal | `<main>` | Área de contenido |
| Cabecera | `<header>` | Cabecera global y secciones de modal |
| Artículo/Fila | `<article>` / `<tr>` | Unidades de contenido |

---

## 2. Etiquetas ARIA

Todos los elementos interactivos tienen `aria-label` descriptivo:

```javascript
// Header.js
`<button id="add-btn" aria-label="Agregar nuevo activo" ...>`

// SelectExchange.js
`<button aria-label="Seleccionar ${ex.name}" ...>`

// AddExchangeModal.js
`<input aria-label="Buscar exchange" ...>`
`<button aria-label="Agregar ${ex.name} a mis caletas" ...>`

// AddAssetModal.js
`<button aria-label="Seleccionar moneda" ...>`
`<input aria-label="Buscar moneda" ...>`
```

---

## 3. Navegación por Teclado

### Focus Management

```javascript
// Modales — foco al abrir
modal.addEventListener('shown', () => {
  const firstInput = modal.querySelector('input, button');
  firstInput?.focus();
});

// Botones con focus visible
`class="... focus:outline-none focus:ring-2 focus:ring-primary/40"`
```

### Interacciones

| Acción | Tecla | Componente |
|---|---|---|
| Abrir modal | `Enter` / `Space` | Botón + en Header |
| Cerrar modal | `Escape` (backdrop click) | Todos los modales |
| Navegar lista | `Tab` | Exchange rows, Coin rows |
| Seleccionar item | `Enter` / `Space` | Exchange/Coin buttons |
| Cambiar página | `Enter` | Pagination buttons |

---

## 4. Contraste de Colores

| Elemento | Foreground | Background | Ratio | Cumple AA |
|---|---|---|---|---|
| Texto principal | `#ffffff` | `#0f172a` | 17.4:1 | ✅ |
| Texto secundario | `#94a3b8` | `#0f172a` | 5.6:1 | ✅ |
| Texto terciario | `#64748b` | `#0f172a` | 3.8:1 | ✅ (large text) |
| Primary (accents) | `#8b5cf6` | `#0f172a` | 4.5:1 | ✅ |
| Success (verde) | `#0bd570` | `#0f172a` | 7.2:1 | ✅ |
| Error (rojo) | `#ef4444` | `#0f172a` | 4.6:1 | ✅ |

---

## 5. Iconos Decorativos

Los íconos SVG del sprite se marcan como decorativos cuando no aportan información:

```html
<!-- Decorativo — oculto del screen reader -->
<svg class="w-6 h-6" aria-hidden="true">
  <use href="sprite.svg#trending-up"></use>
</svg>

<!-- Informativo — tiene label -->
<svg class="w-6 h-6" aria-label="Tendencia alcista">
  <use href="sprite.svg#trending-up"></use>
</svg>
```

---

## 6. Estados de Carga

Los skeletons proporcionan feedback visual durante la carga:

```javascript
// SkeletonRow — barras animadas con pulse
const SkeletonRow = () => `
  <div class="animate-pulse flex items-center gap-3 p-3 ...">
    <div class="w-10 h-10 bg-slate-700 rounded-full"></div>
    <div class="flex-1 space-y-2">
      <div class="h-4 bg-slate-700 rounded w-3/4"></div>
      <div class="h-3 bg-slate-700 rounded w-1/2"></div>
    </div>
  </div>
`;
```

---

## 7. Checklist de Revisión

- [x] Todos los `<button>` tienen `aria-label`
- [x] Todos los `<input>` tienen `aria-label` o `<label>`
- [x] Los modales usan `role="dialog"` (vía backdrop + estructura)
- [x] Iconos decorativos usan `aria-hidden="true"`
- [x] Focus visible con `focus:ring-*` en todos los elementos interactivos
- [x] Contraste mínimo 4.5:1 para texto normal
- [x] Skeleton loading para estados de carga
- [ ] Trap focus dentro de modales (pendiente)
- [ ] Anunciar cambios de vista con `aria-live` (pendiente)
