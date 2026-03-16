# ADR-004: Tailwind CSS v4 como Sistema de Estilos

- **Estado:** Aceptada
- **Fecha:** 2026-03-01
- **Contexto:** La app necesita un sistema de estilos consistente y rápido de implementar con soporte para dark mode, diseño responsivo y animaciones.

## Contexto

Para una SPA con componentes renderizados como strings, las opciones de styling son:
1. CSS Modules (requiere bundler especial y no funciona con strings)
2. CSS-in-JS (requiere framework o librería)
3. Tailwind CSS (utilidades directamente en el HTML string)
4. CSS vanilla con BEM

## Decisión

Se eligió **Tailwind CSS v4** con PostCSS. Las clases de utilidad se escriben directamente en los template literals de los componentes. Los tokens de diseño se definen en el bloque `@theme` de `main.css`.

```css
/* main.css */
@import "tailwindcss";

@theme {
  --color-primary: #9079ff;
  --color-primary-glow: #0bd570;
  /* ... */
}
```

## Consecuencias

### Positivas
- Velocidad de desarrollo: utilidades ready-to-use
- Design tokens centralizados en `@theme`
- Sin conflictos entre componentes (no hay CSS cascade inesperado)
- Dark mode nativo
- Responsive via prefijos `sm:`, `lg:`, etc.
- Excelente compatibilidad con HTML strings en template literals

### Negativas
- Bundle CSS puede ser grande si Tailwind no purga correctamente
- Clases largas en template literals reducen legibilidad
- Tailwind v4 cambia la API de configuración respecto a v3 (breaking changes)
- Las utilidades personalizadas requieren `main.css` adicional

## Alternativas Consideradas

| Alternativa   | Razón de descarte                                                         |
|---------------|---------------------------------------------------------------------------|
| CSS Modules   | No compatible con componentes como strings HTML                           |
| BEM + CSS     | Mayor tiempo de desarrollo; mantener CSS separado del HTML es más difícil |
| UnoCSS        | Menos maduro en ecosistema Webpack en el momento de la decisión           |
| Bootstrap 5   | Exceso de JS para un proyecto Vanilla; mayor bundle size                  |
