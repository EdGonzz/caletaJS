# Sistema de Diseño

> Última actualización: 2026-04-15

## Design Tokens (Tailwind CSS v4)

Los tokens se definen en `src/styles/main.css` usando la directiva `@theme`:

```css
@import "tailwindcss";

@theme {
  /* Colores Personalizados */
  --color-primary: #9079ff;
  --color-primary-glow: #0bd570;
  --color-accent-red: #ef4444;
  --color-background-dark: #120f23;
  --color-background-darker: #020617;
  --color-card-dark: #1e293b;
  --color-background-light: #f6f5f8;

  /* Tipografías */
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", monospace;

  /* Bordes */
  --radius-default: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Sombras Especiales */
  --shadow-neon: 0 0 15px rgba(11, 213, 112, 0.4), 0 0 30px rgba(11, 213, 112, 0.1);
  --shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#9079ff` | Acciones principales, tabs activos, bordes de foco |
| `--color-primary-glow` | `#0bd570` | Cambios positivos, CTA principal, neon glow |
| `--color-accent-red` | `#ef4444` | Cambios negativos, errores |
| `--color-background-dark` | `#120f23` | Fondo de botones primarios (texto) |
| `--color-background-darker` | `#020617` | Fondo alternativo más oscuro |
| `--color-card-dark` | `#1e293b` | Tarjetas, modales, contenedores |
| Body bg | `#0f172a` | Fondo global (body) |
| Slate-400 | `#94a3b8` | Texto secundario |
| Slate-500 | `#64748b` | Texto terciario, placeholders |
| Slate-700 | `#334155` | Bordes, separadores |

### Fondo del Body

```css
body {
  background-color: #0f172a;
  background-image:
    radial-gradient(at 0% 0%, rgba(11, 213, 112, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(15, 23, 42, 1) 0px, transparent 50%);
  background-attachment: fixed;
}
```

---

## Tipografía

| Nivel | Fuente | Clases | Ejemplo |
|---|---|---|---|
| Display / Valores | Space Grotesk | `font-display text-2xl font-bold` | "$42,069.00" |
| Body | Inter | `font-sans text-sm` | Texto descriptivo |
| Monospace | ui-monospace | `font-mono text-xs` | Direcciones, tickers |
| H1 (modal header) | Inter | `text-xl font-bold tracking-tight text-white` | "Add Transaction" |
| H2 (sub-vista) | Inter | `text-xl font-bold tracking-tight text-white` | "Tus Caletas" |
| H3 (subsección) | Inter | `text-lg font-bold text-white` | "Holdings" |
| Label | Inter | `text-xs font-semibold uppercase tracking-wider text-slate-400` | "SELECT COIN" |
| Caption | Inter | `text-xs text-slate-500` | "vs. previous day" |

---

## Efectos Glassmorphism

Componentes glassmorphism definidos en `main.css`:

```css
/* Panel principal (tarjetas, tabla, donuts) */
.glass-panel {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

/* Navegación */
.glass-nav {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* Texto neón */
.neon-text {
  text-shadow: 0 0 10px rgba(11, 213, 112, 0.5);
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
| `search` | Campo de búsqueda |
| `filter-2` | Filtrar holdings |
| `close` | Cerrar modal |
| `arrow-left` | Volver/Back |
| `arrow-upward` | Cambio positivo (badge) |
| `arrow-downward` | Cambio negativo (badge) |
| `minus` | Cambio neutro (badge) |
| `chevron-down` | Dropdown / Selector |
| `chevron-left` | Paginación anterior |
| `chevron-right` | Navegar forward / Paginación siguiente |
| `dots-vertical` | Menú de acciones |
| `plus` | Agregar (botón) |
| `circle-plus` | Agregar nuevo (estilo circular) |
| `circle-check` | Elemento seleccionado |
| `circle-x` | Error state |
| `check` | Guardado / Confirmado |
| `wallet` | Empty state exchanges |
| `pencil` | Agregar notas |
| `layout-dashboard` | Source / Dashboard |
| `trending-up` | Tendencia alcista |
| `chart-area-line` | Gráfico de área |
| `rocket` | Top mover |

---

## Animaciones y Transiciones

### Transiciones CSS

| Tipo | Duración | Uso |
|---|---|---|
| `transition-colors` | 200ms | Hover en textos, bordes |
| `transition-all` | 200-300ms | Hover en tarjetas interactivas, modales |
| `transition-opacity` | 200-500ms | Mostrar/ocultar labels hover, backdrop |
| `transition-transform` | 200ms | Scale en íconos hover |

### Animaciones `@keyframes`

| Animación | Duración | Uso |
|---|---|---|
| `dash` | 3s linear | Path animation del gráfico de historial |
| `shimmer` | 1.5s infinite | Efecto shimmer en skeleton loading |
| `modal-slide-up` | 0.3s ease-out | Entrada de modales (slide up + scale) |
| `animate-pulse` | (Tailwind built-in) | Blobs decorativos detrás del modal |

### Clases de Animación

```css
/* Skeleton shimmer animado */
.skeleton-shimmer {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

/* Entrada slide-up del modal */
.modal-enter {
  animation: modal-slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Path animation del chart SVG */
.path-anim {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: dash 3s linear forwards;
}
```

---

## Custom Scrollbar

```css
.custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
```

---

## Responsive

| Breakpoint | Comportamiento |
|---|---|
| Mobile (default) | Layout vertical, `px-4` padding |
| sm (640px+) | Grid 2 cols en formulario de modal |
| md (768px+) | StatsGrid en 2 columnas |
| lg (1024px+) | StatsGrid en 4 columnas, Chart 8/12 + Donut 4/12, `px-8` padding |
