# Sistema de Diseño

> Última actualización: 2026-04-14

## Design Tokens (Tailwind CSS v4)

Los tokens se definen en `src/styles/main.css` usando la directiva `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #8b5cf6;
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-surface-elevated: #334155;
}
```

---

## Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#8b5cf6` | Acciones principales, links activos, bordes de foco |
| `--color-background` | `#0f172a` | Fondo global (slate-900) |
| `--color-surface` | `#1e293b` | Tarjetas, modales, contenedores |
| `--color-surface-elevated` | `#334155` | Dropdowns, tooltips, hovers |
| Verde (success) | `#0bd570` | Cambios positivos, confirmaciones |
| Rojo (danger) | `#ef4444` | Cambios negativos, errores |
| Slate-400 | `#94a3b8` | Texto secundario |
| Slate-500 | `#64748b` | Texto terciario, placeholders |
| Slate-700 | `#334155` | Bordes, separadores |

---

## Tipografía

| Nivel | Clases | Ejemplo |
|---|---|---|
| H1 (título de página) | `text-2xl font-bold tracking-tight text-white` | "Mi Portafolio" |
| H2 (sección) | `text-xl font-bold tracking-tight text-white` | "Tus Caletas" |
| H3 (subsección) | `text-sm font-semibold text-white` | Nombre de exchange |
| Body | `text-sm text-slate-400` | Texto descriptivo |
| Caption | `text-xs text-slate-500` | Labels de sección |
| Monospace | `text-xs font-mono text-slate-400` | Direcciones, IDs |

---

## Componentes UI

### Tarjetas / Containers

```css
/* Tarjeta base */
.card {
  @apply bg-slate-800/40 border border-slate-700 rounded-xl p-4;
}

/* Tarjeta hover */
.card-interactive {
  @apply bg-slate-800/40 border border-slate-700 rounded-xl p-3
         hover:border-slate-500 cursor-pointer transition-all duration-200;
}
```

### Botones

| Variante | Clases | Uso |
|---|---|---|
| Primary | `bg-primary text-white rounded-xl py-3 px-4` | Acciones principales |
| Ghost | `bg-transparent border-dashed border-slate-600 text-slate-400` | "Agregar nuevo" |
| Icon | `w-8 h-8 rounded-full flex items-center justify-center` | Cerrar, back |

### Inputs

```css
/* Input base */
input {
  @apply block w-full px-4 py-3
         bg-slate-800/40 border border-slate-700 rounded-xl
         text-sm text-white placeholder-slate-500
         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
         transition-all duration-300;
}
```

### Modales

```css
/* Backdrop */
.modal-backdrop {
  @apply fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
         flex items-end sm:items-center justify-center;
}

/* Container */
.modal-container {
  @apply bg-gradient-to-b from-slate-800 to-slate-900
         w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl
         shadow-2xl border border-slate-700/50
         max-h-[85vh] flex flex-col;
}
```

---

## Iconografía (SVG Sprite)

Todos los íconos se centralizan en `src/assets/sprite.svg`:

```html
<svg class="w-6 h-6 text-slate-400" aria-hidden="true">
  <use href="${sprite}#icon-name"></use>
</svg>
```

### Íconos Disponibles

| ID | Uso |
|---|---|
| `trending-up` | Cambio positivo |
| `trending-down` | Cambio negativo |
| `wallet` | Empty state exchanges |
| `circle-plus` | Agregar nuevo |
| `circle-check` | Seleccionado |
| `close` | Cerrar modal |
| `arrow-left` | Volver/Back |
| `search` | Campo de búsqueda |
| `chevron-right` | Navegar forward |
| `layout-dashboard` | Source/Dashboard |

---

## Animaciones y Transiciones

| Tipo | Duración | Uso |
|---|---|---|
| `transition-colors` | 200ms | Hover en textos, bordes |
| `transition-all` | 200ms | Hover en tarjetas interactivas |
| `transition-opacity` | 200ms | Mostrar/ocultar labels hover |
| `transition-transform` | 200ms | Scale en íconos hover |
| `animate-pulse` | — | Skeleton loading |
| Backdrop blur | — | Fondo de modales |

---

## Responsive

| Breakpoint | Comportamiento |
|---|---|
| Mobile (default) | Modal full-width con `rounded-t-2xl`, layout vertical |
| sm (640px+) | Modal centrado `max-w-md` con `rounded-2xl` |
| Tabla | Scroll horizontal en columnas adicionales |
