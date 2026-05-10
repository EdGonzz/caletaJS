# ADR-013: Lógica de Consolidación de Datos en Vistas

- **Estado:** Aceptada
- **Fecha:** 2026-05-10
- **Contexto:** Al introducir el filtrado por "Caleta" (exchange/wallet), surgió un conflicto de diseño en la vista general ("Caletas" / All): si un usuario posee el mismo activo en múltiples fuentes (ej. BTC en Binance y BTC en Kraken), la tabla mostraba filas duplicadas para la misma moneda, y los contadores de "Total Assets" contaban cada fuente como un activo independiente.

## Contexto
Originalmente, la agrupación en `HoldingsTable.js` se realizaba estrictamente por la combinación `coinId-source`. Esto resultaba en una experiencia confusa en la vista consolidada:
1. El contador de "Total Assets" no reflejaba el número de criptomonedas únicas, sino el número de depósitos.
2. La tabla era redundante, dificultando ver la posición total en una moneda específica.

## Decisión
Se implementó una lógica de consolidación condicional ("Opción B"):

1. **Agrupación Dinámica:** La función `aggregateHoldings` ahora recibe el filtro activo.
   - Si el filtro es `Caletas` (vista general): Agrupa únicamente por `coinId`, sumando los balances de todas las fuentes y recolectando los nombres de las fuentes en un array.
   - Si el filtro es un exchange específico: Agrupa por `coinId-source`, manteniendo la segmentación por depósito.
2. **UI Adaptativa (`AssetRow.js`):**
   - En la vista consolidada, la columna "Source" muestra múltiples badges o un contador de overflow (`+N`) si hay demasiadas fuentes.
   - En la vista segmentada, muestra el badge único tradicional.
3. **Semántica de Stats (`StatsGrid.js`):** Los contadores ahora reflejan "Unique coins" basándose en el array ya consolidado, garantizando que el número mostrado coincida con la percepción del usuario sobre su portafolio.

## Consecuencias

### Positivas
- **Claridad Visual:** El usuario ve su posición neta por activo en la vista principal.
- **Precisión en Métricas:** El número de assets únicos es veraz (una moneda = un asset).
- **Consistencia:** El filtrado por exchange sigue permitiendo el detalle granular que se buscaba originalmente.

### Negativas
- **Complejidad en `AssetRow`:** El componente ahora debe manejar dos esquemas de datos para la propiedad `source`.
- **Indirección:** La clave de agrupación en el reducer no es estática, lo que requiere que los componentes de la vista conozcan el estado del filtro global.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| Mostrar duplicados y corregir solo el contador | Incoherencia visual; la tabla seguiría pareciendo desordenada y redundante. |
| Forzar siempre la consolidación | Se pierde la capacidad de ver cuánto se tiene específicamente en un exchange, que es una de las funcionalidades core solicitadas. |

---
*Última actualización: 2026-05-10*
