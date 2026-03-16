# ADR-003: Hash-based Router

- **Estado:** Aceptada
- **Fecha:** 2026-03-01
- **Contexto:** La SPA necesita un mecanismo de navegación entre vistas sin recargas de página.

## Contexto

Una SPA necesita enrutamiento del lado del cliente. Las principales opciones son:
1. **Hash router**: URLs del tipo `/#/path` — escucha `hashchange`
2. **History API router**: URLs limpias `/path` — escucha `popstate`, requiere servidor

## Decisión

Se implementó un **hash router personalizado** (~35 líneas) que:
- Escucha `window.addEventListener("hashchange", router)` y `"load"`
- Usa `getHash()` para extraer el segmento de ruta del hash
- Usa `resolveRoutes()` para mapear a la clave del objeto `routes`
- Renderiza el componente correspondiente en `#app` y `#header`
- Llama las funciones `init*` de componentes interactivos

## Consecuencias

### Positivas
- Sin configuración de servidor: funciona en cualquier static host (GitHub Pages, Netlify, Surge, etc.)
- Simple de entender y mantener
- URLs compartibles (el hash se incluye en el enlace)
- Zero dependencias externas de routing

### Negativas
- URLs con `#` — menos estéticas y levemente peores para SEO técnico
- Los crawlers pueden no indexar sub-rutas
- Sin soporte para nested routes de forma nativa
- Re-render completo de `header` + `root` en cada navegación (no se hace diff)

## Alternativas Consideradas

| Alternativa       | Razón de descarte                                                        |
|-------------------|--------------------------------------------------------------------------|
| History API       | Requiere servidor con fallback a `index.html` (no trivial en static host)|
| Page.js / Navigo  | Librerías externas; el hash router propio es suficiente para la escala   |
| React Router      | Requeriría migrar a React (descartado en ADR-002)                        |
