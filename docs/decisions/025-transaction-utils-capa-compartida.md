# ADR-025: transactionUtils — Capa Compartida de Lectura de Transacciones

- **Estado:** Aceptada (v2 — tipos extendidos)
- **Fecha:** 2026-06-21 (v1) / 2026-06-23 (v2)
- **Contexto:** La lógica de agregación de transacciones estaba duplicada en `HoldingsTable.js`, `chartDataAdapter.js` y `AddAssetModal.js`. La página `CoinDetails` y la validación de overselling necesitaban esa misma lógica sin crear más copias. Con la adopción de `transfer_out`/`transfer_in` y la validación por-exchange, la API del módulo necesitó extenderse.

## Contexto

Con la llegada de `CoinDetails` y la validación de overselling, emergieron consumidores que necesitaban operaciones de lectura centralizadas. La v1 cubría las necesidades iniciales, pero la v2 añade:

1. **`getNetBalance(coinId, sourceFilter)`:** Validar balance por caleta específica (no global).
2. **`getPortfolioCoins(sourceFilter)`:** Mostrar al usuario solo las monedas con balance en la caleta seleccionada.
3. **`getAverageCostBasis(coinId, source)`:** Calcular el costo promedio ponderado para heredarlo en transferencias.
4. **`deleteTransaction(txId)`** v1 escribía directo a localStorage; v2 usa `removeHolding()` de `holdingsStorage.js`, que ya existe.

## Decisión

Se refuerza `src/utils/transactionUtils.js` como capa de abstracción sobre `holdingsStorage.getHoldings()`, centralizando todas las operaciones de lectura, escritura y eliminación de transacciones.

### API pública del módulo (v2)

```typescript
// Tipos (JSDoc, no TypeScript real — ver ADR-002)
type Transaction = {
  id: string;
  coinId: string;
  name: string;
  symbol: string;
  logoUrl: string;
  balance: number;
  price: number;
  source: string;
  type: "buy" | "sell" | "transfer_out" | "transfer_in";
  date: string;
  fees: number; // Platform fee en USD (solo Buy/Sell)
  networkFee: number; // Network fee en la moneda (solo Transfer, default 0)
  notes: string;
};

type PortfolioCoin = {
  coinId: string;
  name: string;
  symbol: string;
  logoUrl: string;
  netBalance: number;
};
```

| Función                 | Firma                                               | Descripción                                                                                                               |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `getTransactionsByCoin` | `(coinId: string) → Transaction[]`                  | Transacciones de una moneda, de más reciente a más antigua                                                                |
| `getNetBalance`         | `(coinId: string, source?: string) → number`        | Balance neto. Si `source` se omite, suma global. Si se especifica, filtra por exchange.                                   |
| `getPortfolioCoins`     | `(source?: string) → PortfolioCoin[]`               | Monedas con balance > 0. Si `source` se omite, global. Si se especifica, solo las que tienen balance > 0 en ese exchange. |
| `getAverageCostBasis`   | `(coinId: string, source: string) → number \| null` | Costo promedio ponderado en ese exchange. `null` si no hay historial de compras.                                          |
| `deleteTransaction`     | `(txId: string) → Transaction[]`                    | Elimina por ID. _Wrapper sobre_ `removeHolding()` _de_ `holdingsStorage.js`. Retorna la lista actualizada.                |

### Regla de agregación centralizada

```javascript
// En getNetBalance() y getPortfolioCoins():
if (tx.type === "buy" || tx.type === "transfer_in") acc += tx.balance ?? 0;
if (tx.type === "sell" || tx.type === "transfer_out") acc -= tx.balance ?? 0;
```

Esta regla debe ser **idéntica** a la de `aggregateHoldings()` en `HoldingsTable.js`. Cualquier modificación debe aplicarse en ambos lugares.

### getAverageCostBasis

```javascript
export const getAverageCostBasis = (coinId, source) => {
  const txs = getHoldings().filter(
    (t) =>
      t.coinId === coinId &&
      t.source === source &&
      (t.type === "buy" || t.type === "transfer_in"),
  );
  const totalQty = txs.reduce((acc, t) => acc + (t.balance ?? 0), 0);
  const totalCost = txs.reduce(
    (acc, t) => acc + (t.balance ?? 0) * (t.price ?? 0),
    0,
  );
  return totalQty > 0 ? totalCost / totalQty : null;
};
```

- Incluye compras (`buy`) y transferencias recibidas (`transfer_in`) — ambas son adquisiciones que aportan al cost basis.
- Excluye ventas (`sell`) y transferencias enviadas (`transfer_out`) — son disposiciones.
- Retorna `null` si no hay historial (ej. portafolio vacío o moneda recién añadida). El caller (AddAssetModal) debe hacer fallback a `getCoin()`.

### Dependencias del módulo

```
transactionUtils.js
  ├── holdingsStorage.js  (getHoldings, removeHolding)
  └── (ninguna UI)
```

Es un módulo utilitario puro de datos, sin dependencias de DOM.

### Consumidores

| Consumidor           | Funciones utilizadas                                                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AddAssetModal.js`   | `getNetBalance(coinId, source)` (overselling por-exchange), `getPortfolioCoins(source)` (via PortfolioPicker), `getAverageCostBasis(coinId, source)` (cost basis en Transfer) |
| `PortfolioPicker.js` | `getPortfolioCoins(sourceFilter)`                                                                                                                                             |
| `CoinDetails.js`     | `getTransactionsByCoin`, `getNetBalance(coinId)`, `deleteTransaction`                                                                                                         |

### deleteTransaction v2

En la v1, `deleteTransaction` escribía directo a `localStorage` con la clave `'caleta_holdings'`. Esto creaba una dependencia frágil y bypassaba la abstracción de `holdingsStorage.js`.

En la v2, se usa `removeHolding()` que ya existía en `holdingsStorage.js`:

```javascript
import { removeHolding } from "./holdingsStorage.js";
export const deleteTransaction = (txId) => removeHolding(txId);
```

Deuda técnica resuelta: la v1 reconocía que había que exportar la clave como constante. La v2 elimina el problema usando la función de borrado oficial del módulo de persistencia.

## Consecuencias

### Positivas

- **Regla de agregación en un solo lugar:** Si se añade un nuevo tipo de transacción, solo hay que actualizar `transactionUtils.js` y `aggregateHoldings()` — el PortfolioPicker, CoinDetails y la validación de overselling se actualizan automáticamente.
- **Validación por-exchange:** `getNetBalance(coinId, source)` permite overselling por caleta, no global — consistente con el modelo double-ledger de trackers de la industria.
- **Cost basis centralizado:** `getAverageCostBasis()` es el único punto de cálculo, garantizando consistencia entre la transferencia saliente y entrante.
- **Deuda técnica resuelta:** `deleteTransaction` usa `removeHolding()` oficial, eliminando el bypass a localStorage y la clave hardcodeada.
- **Módulo testeable:** Sin side-effects de UI, fácil de cubrir con unit tests (ADR-016).

### Negativas

- **Desincronización con `aggregateHoldings()` — RESUELTA:** `aggregateHoldings()` ahora usa `getBalanceDelta()` de `transactionUtils.js` (ADR-028). La regla de balance vive en un solo lugar. Ya no hay riesgo de divergencia.
- **Sin invalidación de caché:** `getHoldings()` lee localStorage en cada llamada. Si se llaman `getPortfolioCoins()` y `getNetBalance()` en el mismo render, se leen dos veces. Aceptable para el volumen esperado.
- **getAverageCostBasis ignora FIFO/LIFO:** Usa promedio ponderado simple. Para un simulador es suficiente, pero no es fiscalmente exacto para tracking de impuestos.

## Alternativas Consideradas

| Alternativa                                              | Razón de descarte                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Exportar `aggregateHoldings()` desde HoldingsTable**   | Crearía dependencia de utilidades → componente UI. Viola la jerarquía de dependencias.    |
| **Añadir funciones directamente a `holdingsStorage.js`** | `holdingsStorage.js` es un módulo de persistencia, no de lógica de negocio. Violaría SRP. |
| **Store global reactivo (señales)**                      | Over-engineering para el tamaño actual del proyecto.                                      |
| **Copiar la lógica en cada consumidor**                  | Riesgo de inconsistencia en la regla de suma/resta. Inaceptable.                          |

## Relación con ADRs Existentes

- **ADR-002** (Arquitectura sin framework): Sigue el patrón de función pura que retorna datos.
- **ADR-005** (Datos en localStorage): Respeta el modelo flat de `caleta_holdings`.
- **ADR-013** (Consolidación de datos): `aggregateHoldings()` debe mantener la misma regla que este módulo.
- **ADR-016** (Test runner): Las funciones son candidatas ideales para unit tests.
- **ADR-023** (PortfolioPicker): Depende de `getPortfolioCoins(source)`.
- **ADR-024** (Transfer doble entrada): La validación de overselling usa `getNetBalance(coinId, source)`, y la transferencia usa `getAverageCostBasis(coinId, source)`.
- **ADR-028** (Balance Delta): `getBalanceDelta()` es la regla centralizada que usan tanto `transactionUtils` como `aggregateHoldings()`. Resuelve el riesgo de desincronización.

---

> **Errata (2026-08-16):** La v2 de `deleteTransaction()` ya no es un wrapper sobre `removeHolding()`. En el commit `0be04a5` (transferencia atómica), `deleteTransaction()` pasó a usar `storage.set('caleta_user_holdings', updated)` directamente para el batch atómico de cascada (ver ADR-027). `removeHolding()` sigue existiendo en `holdingsStorage.js` para otros usos.

_Última actualización: 2026-08-16_
