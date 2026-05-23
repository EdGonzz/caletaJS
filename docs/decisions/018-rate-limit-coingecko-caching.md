# ADR-018: Deuda Técnica — Rate Limit de CoinGecko y Estrategias de Caché

- **Estado:** Aceptada (deuda técnica documentada)
- **Fecha:** 2026-05-21
- **Contexto:** La integración de `HistoryChart` con `/coins/{id}/market_chart` introduce un riesgo de rate limiting en el plan Demo de CoinGecko.

## Contexto

El endpoint `/coins/{id}/market_chart` se invoca una vez por cada `coinId` única en el portafolio cuando:
- Se carga la página principal (`/`).
- El usuario cambia el período del gráfico (1d, 7d, 30d, 90d, All).

El plan Demo de CoinGecko impone un límite de **30 calls/min**. Si el usuario tiene N coins y cambia de período K veces dentro de un minuto, se generan `N × K` llamadas. Con un portafolio de 15+ coins y 3+ cambios de período, se alcanza el límite.

## Decisión

**Se acepta el riesgo de rate limiting sin mitigación inmediata** para este side-project. Se documenta como deuda técnica con las siguientes estrategias de mitigación para implementar en el futuro:

### Mitigaciones Propuestas (orden de prioridad)

1. **Cache en memoria por sesión** — `Map<string, PricePoint[]>` indexado por `${coinId}-${days}`.
   - Evita re-fetch del mismo período durante la sesión actual.
   - Invalidación: al agregar/eliminar holdings (evento `holdings-updated`).
   - Impacto: reduce llamadas a ~1 por coinId por período por sesión.

2. **Debounce 300ms en botones de período** — Evita llamadas por clics rápidos accidentales.
   - Implementación: `lodash.throttle` o debounce nativo en `initHistoryChart()`.
   - Impacto: mínimo, previene bursts de 2-3 llamadas por doble clic.

3. **Cache en `localStorage` con TTL de 1h** — Persiste datos entre navegaciones.
   - Clave: `caleta_chart_cache_${coinId}_${days}`.
   - Valor: `{ timestamp, data: PricePoint[] }`.
   - Invalidación: si `Date.now() - timestamp > TTL`, se descarta y re-fetch.
   - Impacto: reduce llamadas a virtually zero para visitas repetidas dentro de la hora.

### Criterio de Activación

Implementar mitigación cuando:
- Se reporten errores 429 (Too Many Requests) en producción.
- El portafolio promedio de usuarios supere las 10 coins.
- Se migre a un plan de API de pago (en cuyo caso se evalúa eliminar la caché).

## Consecuencias

### Positivas (de aceptar la deuda)
- Tiempo de entrega más rápido — no se bloquea el lanzamiento por optimización prematura.
- Simplicidad del código — sin capas de caché que mantener.
- El side-project tiene un número esperado de usuarios bajo.

### Negativas
- Usuarios con portafolios grandes (30+ coins) pueden experimentar fallos intermitentes.
- Cambios rápidos de período generan llamadas redundantes.
- Sin persistencia entre sesiones, cada visita recalcula todo desde cero.

## Formato de Log de Errores

Cuando se implemente la caché, se recomienda agregar logging de hits/misses:

```javascript
// Ejemplo de estructura futura
const cacheKey = `${coinId}-${days}`;
if (memoryCache.has(cacheKey)) {
  console.debug(`[ChartCache] HIT: ${cacheKey}`);
  return memoryCache.get(cacheKey);
}
console.debug(`[ChartCache] MISS: ${cacheKey}`);
```

## Referencia

- CoinGecko API Docs: https://docs.coingecko.com/reference/coin-id-market-chart
- Rate limits del plan Demo: 30 calls/min, 200 calls/mes

---
*Última actualización: 2026-05-21*
