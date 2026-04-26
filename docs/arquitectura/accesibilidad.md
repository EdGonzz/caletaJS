# Accesibilidad (a11y)

Cumplir con el estándar WCAG 2.1 AA es fundamental. A pesar de que la UI es simulada en DOM vía strings, todas las partes deben poseer marcadores semánticos.

## Estándares Implementados

| Regla / Elemento | Implementación | Propósito |
|---|---|---|
| **Contraste de Color** | Modificaciones de opacidad (`bg-slate-700/30`) para garantizar textos contrastantes legibles sobre fondos de panel. | Ayudar a usuarios con visibilidad reducida. |
| **Marcado Semántico** | Uso estricto de etiquetas HTML5 (`<section>`, `<table>`, `<thead>`, `<tbody>`). | Estructurar correctamente el DOM para Screen Readers. |
| **Atributos ARIA** | `aria-label` en inputs, modales, e íconos interactivos (e.g. `aria-label="Search holdings"`). | Proveer contexto sin texto visible. |
| **Ocultamiento Visual** | `aria-hidden="true"` en elementos puramente decorativos como SVGs. | Evitar que los Screen Readers lean descripciones redundantes de íconos. |
| **Interactividad por Teclado** | Uso exclusivo de `<button>` y `<input>` nativos en lugar de `<div>` con eventos de clic, permitiendo foco. | Permitir navegación mediante Tabulador (Tab Nav). |

## Reglas de Futuro Desarrollo
- Todo componente nuevo debe recibir enfoque semántico.
- Los modales deben (a futuro) contener "focus traps" (bloqueo de foco en el modal cuando está activo) para cumplir 100% con AA.
- Las tablas complejas deben seguir empleando `<th scope="col">`.

---
*Última actualización: 2026-04-26*
