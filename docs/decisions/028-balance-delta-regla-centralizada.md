# ADR-028: getBalanceDelta — Regla de Balance Centralizada

- **Estado:** Aceptada
- **Fecha:** 2026-06-24
- **Contexto:** La regla de suma/resta de balance (qué tipos suman y cuáles restan) estaba duplicada en al menos dos lugares: `transactionUtils.js` y `aggregateHoldings()` en `HoldingsTable.js`. Si se añadía un nuevo tipo de transacción o se modificaba la regla, ambos lugares debían actualizarse sincronizadamente, bajo riesgo de divergencia y balances inconsistentes.

## Contexto

Con la introducción de `transfer_out` y `transfer_in` (ADR-024), la regla de balance pasó de 3 tipos a 4:

| Tipo | Efecto |
|------|--------|
| `buy` | +balance |
| `transfer_in` | +balance |
| `sell` | -balance |
| `transfer_out` | -balance |

Esta regla estaba implementada de forma independiente en:

1. **`transactionUtils.js`** — funciones `getNetBalance()` y `getPortfolioCoins()` (FASE 1 del plan)
2. **`HoldingsTable.js`** — función `aggregateHoldings()` (existente, FASE 3.5 del plan)

Ambos lugares utilizan un criterio de suma/resta idéntico, pero con patrones de acumulación distintos:

- `getNetBalance()` usa `array.reduce()` con acumulador plano (`acc + delta`)
- `aggregateHoldings()` modifica una propiedad de objeto (`acc[key].balance += delta`)

Esto impedía extraer una función genérica tipo `applyBalanceRule(acc, tx)` que sirviera para ambos.

## Decisión

Se extrae la regla como una función **delta** — que retorna el cambio neto que una transacción produce en el balance, sin importar cómo se acumule:

```javascript
/**
 * Retorna el cambio neto en balance que produce una transacción.
 * Positivo para entradas (buy, transfer_in), negativo para salidas (sell, transfer_out).
 * @param {Object} tx
 * @returns {number}
 */
export const getBalanceDelta = (tx) => {
  if (tx.type === 'buy' || tx.type === 'transfer_in') return tx.balance ?? 0;
  if (tx.type === 'sell' || tx.type === 'transfer_out') return -(tx.balance ?? 0);
  return 0;
};
```

### Ventaja del patrón delta

Un delta es un número (positivo o negativo) que se puede **sumar** a cualquier acumulador, sin importar su forma:

```javascript
// Consumidor 1: reduce plano (transactionUtils)
getHoldings().reduce((acc, tx) => acc + getBalanceDelta(tx), 0);

// Consumidor 2: propiedad de objeto (HoldingsTable)
acc[key].balance += getBalanceDelta(tx);

// Consumidor 3: chartDataAdapter (si aplica)
portfolioValue += getBalanceDelta(tx) * currentPrice;
```

### Ubicación

`getBalanceDelta()` vive en `src/utils/transactionUtils.js`. Es la primera función del módulo y de ella dependen `getNetBalance()` y `getPortfolioCoins()`.

### Consumidores

| Consumidor | Uso |
|---|---|
| `getNetBalance()` | `getHoldings().reduce((acc, tx) => acc + getBalanceDelta(tx), 0)` |
| `getPortfolioCoins()` | `getBalanceDelta(tx)` para calcular balance neto por moneda |
| `aggregateHoldings()` | `acc[key].balance += getBalanceDelta(tx)` |
| `chartDataAdapter.js` | (futuro) mismo patrón |

## Consecuencias

### Positivas

- **Regla en un solo lugar:** Si se añade un nuevo tipo de transacción (ej. `staking`), solo se actualiza `getBalanceDelta()`. Todos los consumidores se actualizan automáticamente.
- **Elimina el riesgo de desincronización:** Ya no es posible que `transactionUtils` y `aggregateHoldings()` tengan reglas distintas.
- **Patrón delta universal:** Funciona con reduce plano, propiedades de objeto, y cualquier forma de acumulación.
- **Cero cambios de comportamiento:** Extracción pura — la lógica es idéntica, solo se mueve de lugar.

### Negativas

- **Una función más en transactionUtils:** El módulo crece en número de exports. Aceptable.
- **Dependencia transversal:** `HoldingsTable.js` ahora importa desde `transactionUtils.js`. Antes no tenía esa dependencia. Es una dependencia válida (utilidad → componente), no al revés.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Duplicar la regla en cada consumidor** | Riesgo de divergencia. Inaceptable a mediano plazo. |
| **Exportar `aggregateHoldings()` desde HoldingsTable** | Crearía dependencia de utilidades → componente UI, violando la jerarquía (descartado en ADR-025). |
| **Mover la regla a `holdingsStorage.js`** | Mezcla lógica de negocio con persistencia. Viola SRP (descartado en ADR-025). |
| **Función `applyBalanceRule(acc, tx)`** | No funciona con los dos patrones de acumulación (plano vs propiedad de objeto). |

## Relación con ADRs Existentes

- **ADR-025** (transactionUtils): Esta ADR resuelve la negativa "Posible desincronización con `aggregateHoldings()`" documentada en ADR-025.
- **ADR-024** (Transfer doble entrada): `getBalanceDelta()` incorpora `transfer_out` y `transfer_in` como nuevos tipos.

---
*Última actualización: 2026-06-24*
