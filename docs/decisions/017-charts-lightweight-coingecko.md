# ADR-017: Integración de Lightweight Charts + CoinGecko para HistoryChart y AllocationDonut

- **Estado:** Aceptada
- **Fecha:** 2026-05-21
- **Contexto:** Los componentes `HistoryChart` y `AllocationDonut` mostraban datos hardcodeados (SVG estático con path fijo, donut con BTC 67%/ETH 19%/SOL 13%). Se necesitaba conectarlos a datos reales del portafolio del usuario.

## Contexto

CaletaJS ya contaba con un flujo de datos establecido:
- `HoldingsTable` agrega transacciones desde `localStorage` vía `aggregateHoldings()`.
- Tras fetchear precios de CoinGecko (`/coins/markets`), emite el evento `prices-updated` con los datos procesados.
- `StatsGrid` escucha `prices-updated` y actualiza sus tarjetas.

Los charts no participaban en este flujo — renderizaban SVG/CSS estáticos sin conexión a datos reales.

## Decisión

Se adoptó una **estrategia dual** para los dos componentes de charts:

### 1. HistoryChart → `lightweight-charts` (TradingView) + CoinGecko `/market_chart`

- **Motor de renderizado:** Se reemplazó el SVG hardcodeado por la librería `lightweight-charts` v5.x (área series).
- **Fuente de datos:** Nueva utilidad `getCoinHistory.js` que llama a `/coins/{id}/market_chart` de CoinGecko por cada coin única.
- **Capa de adaptación:** `chartDataAdapter.js` contiene `buildPortfolioHistorySeries(days, signal)` que:
  1. Agrega holdings crudos desde `localStorage` (deduplicando por `coinId`).
  2. Fetchela historia de precios de cada coin en paralelo.
  3. Calcula `portfolioValue[día] = Σ(amount × price[día])` para cada día.
- **Lifecycle SPA:** El componente exporta `cleanupHistoryChart()` que se llama en `routes.js` antes de cada navegación, previniendo memory leaks.
- **AbortController:** Las peticiones en vuelo se cancelan cuando el usuario cambia de período o navega fuera de la ruta.
- **Estados:** Loading spinner y empty state para portafolio vacío o errores de API.

### 2. AllocationDonut → Evento `prices-updated` (datos ya procesados)

- **Fuente de datos:** `buildAllocationData()` en `chartDataAdapter.js` lee de `localStorage` vía `getAggregatedHoldings()`.
- **Sin llamadas API adicionales:** No invoca CoinGecko directamente; usa `currentPrice` almacenado en el holding.
- **Renderizado:** SVG donut nativo con `stroke-dasharray`/`stroke-dashoffset` calculados dinámicamente según porcentajes reales.
- **Paleta:** 7 colores cíclicos del design system (`#0bd570`, `#3b82f6`, `#f43f5e`, `#f59e0b`, `#a855f7`, `#06b6d4`, `#10b981`).
- **Empty state:** Mensaje inline cuando no hay holdings.

### 3. Integración en Router

- `initHistoryChart()` y `initAllocationDonut()` se llaman en `routes.js` tras el render del DOM.
- `cleanupHistoryChart()` se ejecuta al inicio de cada navegación para destruir la instancia previa del chart.

## Consecuencias

### Positivas
- **Datos reales:** Ambos charts muestran información actual del portafolio.
- **Sin duplicación de llamadas API:** `HistoryChart` hace sus propias llamadas a `/market_chart`; `AllocationDonut` lee datos existentes.
- **Performance:** `lightweight-charts` es ~45KB gzipped, compatible con Webpack 5.
- **UX:** Selector de período funcional (1d, 7d, 30d, 90d, 1y) con actualización en tiempo real.
- **Memory safety:** Cleanup explícito en SPA evita listeners y chart instances huérfanos.

### Negativas
- **Rate limit CoinGecko:** Plan Demo = 30 calls/min. Cada cambio de período = N llamadas (N = coins únicas). Aceptado como deuda técnica (ver ADR-018).
- **Dependencia nueva:** `lightweight-charts` es la primera dependencia de UI significativa (excluyendo Tailwind/PostCSS).
- **`AllocationDonut` no es reactivo al evento `prices-updated`:** Lee `localStorage` directamente en su `initAllocationDonut()`. Un refresh manual (botón en HoldingsTable) no actualiza el donut automáticamente hasta la próxima navegación.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Chart.js** | Bundle más pesado (~200KB), diseño genérico, sin soporte nativo para series financieras. |
| **D3.js** | Demasiado low-level para una serie de área simple; overhead innecesario. |
| **Canvas API nativo** | Requiere implementar ejes, crosshair, tooltips, escalas logarítmicas desde cero. |
| **SVG nativo para HistoryChart** | Performance degradada con >100 puntos de datos; sin zoom/pan nativo. |
| **AllocationDonut con `prices-updated`** | Se evaluó y se eligió leer localStorage directamente para mantener la misma fuente de datos que `getAggregatedHoldings()` en `chartDataAdapter.js`. |

## Archivos Afectados

| Archivo | Acción | Descripción |
|---|---|---|
| `package.json` | Modificado | Se añadió `lightweight-charts@^5.2.0` como dependencia |
| `src/utils/getCoinHistory.js` | Nuevo | API helper para `/coins/{id}/market_chart` |
| `src/utils/chartDataAdapter.js` | Nuevo | Lógica de negocio: `buildPortfolioHistorySeries()`, `buildAllocationData()`, `getAggregatedHoldings()` |
| `src/components/HistoryChart.js` | Refactorizado | SVG → lightweight-charts con selector de período |
| `src/components/AllocationDonut.js` | Refactorizado | Datos hardcodeados → SVG dinámico con `buildAllocationData()` |
| `src/router/routes.js` | Modificado | Importación y llamada a `initHistoryChart`, `initAllocationDonut`, `cleanupHistoryChart` |
| `src/pages/About.js` | Modificado | Atribución a TradingView (ya existía en la sección Tecnologías) |

---
*Última actualización: 2026-05-23*
