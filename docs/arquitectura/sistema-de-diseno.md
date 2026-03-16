# Sistema de Diseño

CaletaJS usa un sistema dark-mode con glassmorphism, colores neón y animaciones sutiles. El design system está definido principalmente en `src/styles/main.css` usando el bloque `@theme` de Tailwind v4.

---

## Design Tokens (CSS Custom Properties)

### Colores

| Token                        | Valor       | Uso                                              |
|------------------------------|-------------|--------------------------------------------------|
| `--color-primary`            | `#9079ff`   | Color acento principal (morado)                  |
| `--color-primary-glow`       | `#0bd570`   | Color de acción principal (verde neón)           |
| `--color-accent-red`         | `#ef4444`   | Indicadores negativos (pérdidas, errores)        |
| `--color-background-dark`    | `#120f23`   | Fondo alternativo oscuro                         |
| `--color-background-darker`  | `#020617`   | Capa más oscura                                  |
| `--color-card-dark`          | `#1e293b`   | Fondo de tarjetas/paneles                        |
| `--color-background-light`   | `#f6f5f8`   | Fondo modo claro (reservado)                     |

### Tipografía

| Token              | Valor                           | Uso                                  |
|--------------------|---------------------------------|--------------------------------------|
| `--font-display`   | `"Space Grotesk", sans-serif`   | Números, valores, texto destacado    |
| `--font-mono`      | `ui-monospace, SFMono, Menlo…`  | Valores monetarios, hashes           |
| `body font`        | `"Inter", sans-serif`           | Texto general (via CSS directo)      |

> **Estrategia de carga:** Las fuentes `Inter` y `Space Grotesk` se cargan desde Google Fonts. Actualmente se referencian sin `<link>` explícito en el `<head>` — se aplican via Tailwind/CSS si están disponibles como system fonts.

### Bordes / Radios

| Token               | Valor      | Uso                           |
|---------------------|------------|-------------------------------|
| `--radius-default`  | `0.25rem`  | Elementos pequeños            |
| `--radius-lg`       | `0.5rem`   | Inputs, tags                  |
| `--radius-xl`       | `0.75rem`  | Tarjetas, modales             |

### Sombras Especiales

| Token             | Valor                                                               | Uso                          |
|-------------------|---------------------------------------------------------------------|------------------------------|
| `--shadow-neon`   | `0 0 15px rgba(11,213,112,0.4), 0 0 30px rgba(11,213,112,0.1)`    | Glow en elementos activos    |
| `--shadow-glass`  | `0 8px 32px 0 rgba(0,0,0,0.37)`                                    | Depth en elementos glass     |

---

## Clases de Utilidad Personalizadas

Definidas en `src/styles/main.css`, fuera del sistema de Tailwind.

### `.glass-panel`

Panel de glassmorphism base — usado en tarjetas de estadísticas, sección de holdings, etc.

```css
.glass-panel {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
```

### `.glass-nav`

Variante para la barra de navegación, con mayor opacidad y blur.

```css
.glass-nav {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

### `.neon-text`

Text-shadow verde para elementos con énfasis neón.

### `.custom-scrollbar`

Scrollbar personalizado (6px, fondo oscuro, thumb `#334155`). Compatible Webkit.

---

## Fondo de la Aplicación

El body usa un gradiente radial con efecto de "luz" verde-esmeralda en la esquina superior izquierda:

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

## Animaciones y Efectos

| Nombre            | Tipo       | Duración     | Uso                                          |
|-------------------|------------|--------------|----------------------------------------------|
| `dash`            | Keyframe   | 3s linear    | Animación de path SVG en gráficos            |
| `shimmer`         | Keyframe   | 1.5s infinite| Skeleton loading en `SelectExchange`         |
| `modal-slide-up`  | Keyframe   | 0.3s cubic   | Entrada del modal (`modal-enter` class)      |
| CSS transitions   | Transition | 200-300ms    | Hover states, apertura/cierre de modal       |
| `scale-95/100`    | Transform  | 300ms        | Scale del contenedor al abrir/cerrar modal   |
| `animate-pulse`   | Tailwind   | 2s           | Blobs decorativos detrás del modal           |

---

## Convención de Colores en Componentes

Los assets y exchanges tienen colores de marca definidos en sus data files:

```javascript
// coinsData.js (ejemplo)
{ id: "bitcoin", color: "#F7931A", logoUrl: "..." }
// exchangesData.js (ejemplo)
{ id: "binance", color: "#F3BA2F", initial: "B", ... }
```

Estos colores se aplican inline: `style="background:${coin.color}"`.

---

*Última actualización: 2026-03-15*
