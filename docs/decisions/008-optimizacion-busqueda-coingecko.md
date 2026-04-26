# ADR-008: Optimización de Búsquedas mediante Endpoint Global de CoinGecko

- **Estado:** Aceptada
- **Fecha:** 2026-04-26
- **Contexto:** Se estaba filtrando localmente listas obtenidas desde la API de CoinGecko (o llamando endpoints individuales repetidamente) para la lista de exchanges o monedas en los componentes `CoinPicker.js` y relacionados, provocando inconsistencias debido a la paginación o uso ineficiente de endpoints.

## Contexto
El usuario experimentaba errores donde buscar ciertas monedas generaba peticiones o fallaba por realizar un `filter` manual de un sub-conjunto paginado traído inicialmente en lugar de una búsqueda general completa.

## Decisión
Refactorizar `getCoin.js` (y `getExchange.js`) para implementar formalmente el uso de la ruta `/search` (como `searchCoins`) para las búsquedas genéricas de activos. Esto transfiere la carga de procesamiento y orden de búsqueda al backend de la API (CoinGecko). 

## Consecuencias

### Positivas
- Búsqueda en el total de monedas (no limitado a páginas parciales solicitadas previamente).
- Simplificación del código de búsqueda y filtrado de front-end.
- Respuestas más ligeras de red optimizadas por la API remota para las búsquedas (el endpoint retorna solo datos relevantes del ticker y no el objeto mercado completo).

### Negativas
- Añade la necesidad de, posteriormente a seleccionar la moneda, hacer un fetch extra por su identificador para obtener todos los campos detallados financieros si se requieren de forma individual.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| Descargar todas las monedas al inicio e implementar Fuzzy Search en cliente. | Demasiado pesado (decenas de miles de activos en CoinGecko), carga excesiva en RAM y problemas de lentitud generalizados en la inicialización (Time to Interactive alto). |
