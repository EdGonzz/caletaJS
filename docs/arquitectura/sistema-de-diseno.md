# Sistema de Diseño

CaletaJS emplea un esquema visual "premium", basado en estéticas modernas (glassmorphism, animaciones sutiles, neon dark mode).
Se utiliza Tailwind CSS v4 para procesar los estilos a través de directivas `@theme`.

## Diseño de Paleta (Tokens CSS)

Los tokens globales están definidos en `src/styles/main.css`.

| Token CSS | Valor HEX/RGBA | Uso previsto |
|---|---|---|
| `--color-primary` | `#9079ff` | Color principal para marca y resaltes suaves. |
| `--color-primary-glow` | `#0bd570` | Acentos vibrantes, números positivos, botones primarios. |
| `--color-accent-red` | `#ef4444` | Alertas, números negativos. |
| `--color-background-dark` | `#120f23` | Fondos de contenedores y modales oscuros. |
| `--color-background-darker` | `#020617` | Fondo ultra oscuro de contrastes altos. |
| `--color-card-dark` | `#1e293b` | Superficie estándar de tarjetas (cards) base. |
| `--color-background-light` | `#f6f5f8` | Uso reservado si se requiere modo claro. |

## Tipografía

El texto utiliza fuentes modernas sin serif que facilitan la lectura de datos financieros densos.

- **Primaria (UI General):** "Inter", sans-serif.
- **Titulares (Headers):** "Space Grotesk" (`--font-display`).
- **Números/Datos Monos:** ui-monospace, SFMono-Regular, etc. (`--font-mono`).

## Estilos Visuales Clave (Classes Custom)

| Clase | Efecto Visual | Dónde Aplicar |
|---|---|---|
| `.glass-panel` | Fondo semitransparente oscuro con `backdrop-filter: blur(16px)` y bordes sutiles blancos. | Tarjetas principales, Modales, HoldingsTable. |
| `.glass-nav` | Glassmorphism con un filtro un poco más intenso (`blur(20px)`) para lectura mejorada al hacer scroll. | Header de navegación superior. |
| `.neon-text` | Agrega un brillo verde (`text-shadow: 0 0 10px`). | Títulos o números que indican éxito o saldos. |
| `.custom-scrollbar` | Rescribe los estilos de la barra del navegador, adaptándola al tema oscuro y de tamaño reducido (6px). | Tablas y paneles largos. |

## Micro-Animaciones y Shimmers

Para indicar estados de carga sin JavaScript extra:
- **`skeleton-shimmer`**: Un fondo que aplica un `linear-gradient` con una animación infinita de traslado lineal. Usado en tablas (como esqueleto pre-renderizado).
- **`path-anim`**: Para dibujar los "sparklines" (gráficos de líneas sutiles en la tabla) en la carga usando CSS `stroke-dashoffset`.
- **`modal-enter`**: Animación CSS pura para la entrada de modales con un escalado y subida ligeros (`slide-up`).

---
*Última actualización: 2026-04-26*
