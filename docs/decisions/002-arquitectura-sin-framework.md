# ADR-002: Arquitectura sin Framework (Vanilla JS)

- **Estado:** Aceptada
- **Fecha:** 2026-03-01
- **Contexto:** La aplicación es un tracker de inversiones con UI relativamente estática. Se evaluó si usar un framework UI o no.

## Contexto

En proyectos de este tipo se suele elegir entre React, Vue, Svelte u otro framework para la UI. La decisión de no usar uno impacta en la arquitectura de componentes, gestión de estado y flujo de datos.

## Decisión

Se construyó la aplicación en **JavaScript Vanilla ES6+** sin framework de UI. Los componentes son funciones puras que devuelven strings HTML. La interactividad se agrega manualmente (patrón Mount+Init) después de insertar el HTML en el DOM.

## Consecuencias

### Positivas
- Bundle final mínimo (~50-80KB sin framework)
- Sin overhead de Virtual DOM
- Control total sobre el DOM y el ciclo de vida
- Sin dependencias críticas de terceros
- Simplicidad conceptual: son solo funciones JS

### Negativas
- Sin reactivity automática
- Gestión de estado manual (variables de módulo, `data-*` attributes)
- Event listeners deben re-adjuntarse en cada re-render
- Escalabilidad limitada si la app crece mucho en complejidad de UI

## Alternativas Consideradas

| Alternativa | Razón de descarte                                               |
|-------------|-----------------------------------------------------------------|
| React       | Overhead de bundle, complejidad para app de esta escala         |
| Vue 3       | Aun con Composition API, es un over-engineering para la app     |
| Svelte      | Requiere compilador; más complejo de integrar con Webpack       |
| Lit         | Web Components son válidos pero añaden una capa conceptual nueva|
