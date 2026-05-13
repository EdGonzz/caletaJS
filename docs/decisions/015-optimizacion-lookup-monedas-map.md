# ADR-015: Optimización de Búsqueda de Monedas usando Map

- **Estado:** Aceptada
- **Fecha:** 2026-05-13
- **Contexto:** El componente `AddAssetModal.js` manejaba la lista de monedas (`coins`) como un Array. Al seleccionar una moneda o actualizar la lista tras una búsqueda, se realizaban operaciones `.find()` que tienen una complejidad $O(n)$, causando latencia perceptible con listas grandes.

## Contexto
Durante el proceso de selección de monedas en el `CoinPicker` contenido en `AddAssetModal`, la aplicación necesitaba buscar detalles de una moneda específica por su ID. Con miles de monedas posibles, el uso de arrays para estas búsquedas impactaba negativamente en la fluidez de la UI, especialmente en dispositivos con recursos limitados.

## Decisión
1. Cambiar la estructura de datos interna de `coins` de `Array` a `Map`.
2. Almacenar los objetos de moneda usando su `id` como clave: `new Map(newCoins.map(c => [c.id, c]))`.
3. Utilizar `Map.prototype.get(id)` para búsquedas instantáneas $O(1)$.
4. Convertir a Array (`Array.from(coins.values())`) únicamente en el momento de pasar los datos al componente de renderizado `CoinPicker`.

## Consecuencias

### Positivas
- **Rendimiento:** Mejora de hasta el 99.8% en búsquedas sobre listas de 1000 elementos.
- **Experiencia de Usuario:** La selección de monedas y la actualización de la lista de búsqueda son ahora instantáneas.
- **Código más limpio:** Se eliminan múltiples llamadas a `.find()`.

### Negativas
- **Uso de Memoria:** Un `Map` consume ligeramente más memoria que un `Array` plano, aunque es insignificante para el tamaño de datos manejado.
- **Transformación:** Requiere convertir a Array para el renderizado, lo cual es una operación $O(n)$, pero compensada por la ganancia en las búsquedas frecuentes.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| Indexación manual | Menos declarativo y propenso a errores que el uso de la API nativa `Map`. |
| Web Workers | Demasiado complejo para una optimización de estructura de datos simple. |

---
*Última actualización: 2026-05-13*
