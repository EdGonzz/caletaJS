# Optimización para Motores de Búsqueda (SEO)

Debido a que CaletaJS es una SPA basada en *Hash Routing*, el contenido dinámico no será rastreado de manera óptima por los crawlers sin la ejecución de JavaScript activada. Sin embargo, se garantizan bases SEO estables en el punto de entrada estático.

## Archivo HTML Base (`public/index.html`)

- Contiene un `div#app` y un `div#header` donde se inyecta la app.
- Incorpora las metas de `<title>` básicas.
- Para producciones futuras, deben añadirse etiquetas dinámicas Open Graph si se opta por Server-Side Rendering o Prerendering.

## Hash Routing vs SEO
Actualmente el enrutador utiliza `#/path`. Este modelo asume que el usuario objetivo accede de forma directa a la aplicación una vez logueado o directamente por el índice, no siendo un sitio optimizado para descubrir sub-páginas en motores de búsqueda orgánicos.

Si en el futuro se requiriese indexación completa de todas las "páginas" (como perfiles de monedas), se necesitaría modificar la arquitectura para implementar HTML5 History API (`pushState`) y proveer soporte en el servidor para retornar el `index.html` en las diferentes URLs.

---
*Última actualización: 2026-04-27*
