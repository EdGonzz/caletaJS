# ADR-025: transactionUtils — Capa Compartida de Lectura de Transacciones

- **Estado:** Aceptada
- **Fecha:** 2026-06-21
- **Contexto:** La lógica de agregación de transacciones (suma/resta de balance por tipo) estaba duplicada en `HoldingsTable.js`, `chartDataAdapter.js` y `AddAssetModal.js`. La nueva página `CoinDetails` y la validación de overselling necesitaban esa misma lógica sin crear una tercera y cuarta copia.

## Contexto

Con la llegada de la página `CoinDetails` (historial de transacciones por moneda) y la validación de overselling en `AddAssetModal`, emergieron dos consumidores nuevos que necesitaban:

1. **`getNetBalance(coinId)`:** Calcular el balance neto de una moneda a partir de las transacciones en localStorage. Ya existía implícitamente en `aggregateHoldings()` de `HoldingsTable.js`, pero como función interna no exportada.

2. **`getTransactionsByCoin(coinId)`:** Filtrar y ordenar cronológicamente las transacciones de una moneda. No existía en ningún lugar.

3. **`deleteTransaction(txId)`:** Eliminar una transacción individual. `holdingsStorage.js` solo exponía `addHolding()` y `getHoldings()` — no había mecanismo de borrado.

4. **`getPortfolioCoins()`:** Listar las monedas con balance > 0 con metadata (logo, symbol, netBalance) para el `PortfolioPicker`. Lógica idéntica a parte de `aggregateHoldings()` pero sin los datos de precio de API.

Duplicar esta lógica en cada nuevo consumidor crearía inconsistencias (distintos criterios de qué sumar o restar) y dificultaría mantenerla en el futuro.

## Decisión

Se crea `src/utils/transactionUtils.js` como capa de abstracción sobre `holdingsStorage.getHoldings()`, centralizando todas las operaciones de lectura y eliminación de transacciones.

### API pública del módulo

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
  type: 'buy' | 'sell' | 'transfer';
  date: string;
  fees: number;
  notes: string;
}

type PortfolioCoin = {
  coinId: string;
  name: string;
  symbol: string;
  logoUrl: string;
  netBalance: number;
}
```

| Función | Firma | Descripción |
|---|---|---|
| `getTransactionsByCoin` | `(coinId: string) → Transaction[]` | Transacciones de una moneda, de más reciente a más antigua |
| `getNetBalance` | `(coinId: string) → number` | Balance neto: buy+transfer − sell |
| `getPortfolioCoins` | `() → PortfolioCoin[]` | Monedas con balance > 0, listas para el PortfolioPicker |
| `deleteTransaction` | `(txId: string) → boolean` | Elimina por ID, retorna `true` si se encontró y eliminó |

### Regla de agregación centralizada

La regla de suma/resta es la misma en todo el sistema y ahora vive en un único lugar:

```javascript
// En getNetBalance() y getPortfolioCoins():
if (tx.type === 'buy' || tx.type === 'transfer') acc += tx.balance ?? 0;
if (tx.type === 'sell') acc -= tx.balance ?? 0;
```

### Dependencias del módulo

```
transactionUtils.js
  └── holdingsStorage.js  (getHoldings)
```

No depende de ningún componente UI. Es un módulo utilitario puro de datos.

### Consumidores

| Consumidor | Funciones utilizadas |
|---|---|
| `AddAssetModal.js` | `getNetBalance` (validación overselling), `getPortfolioCoins` (via PortfolioPicker) |
| `PortfolioPicker.js` | `getPortfolioCoins` |
| `CoinDetails.js` | `getTransactionsByCoin`, `getNetBalance`, `deleteTransaction` |

### `deleteTransaction` y el contrato con holdingsStorage

`holdingsStorage.js` no expone un método de borrado individual (solo `addHolding` y `getHoldings`). `transactionUtils.deleteTransaction` escribe directamente sobre la clave `caleta_holdings` de localStorage:

```javascript
export const deleteTransaction = (txId) => {
  const all = getHoldings();
  const filtered = all.filter((tx) => tx.id !== txId);
  if (filtered.length === all.length) return false;
  localStorage.setItem('caleta_holdings', JSON.stringify(filtered));
  return true;
};
```

Se acepta como solución pragmática. La clave `'caleta_holdings'` es la misma que usa `holdingsStorage.js` internamente. Si en el futuro se refactoriza la clave, deberán actualizarse ambos archivos. **Deuda técnica reconocida:** exportar la clave como constante desde `holdingsStorage.js` y usarla en `transactionUtils.js`.

## Consecuencias

### Positivas

- **Regla de agregación en un solo lugar:** Si se añade un nuevo tipo de transacción (ej. `staking`), solo hay que actualizar `transactionUtils.js` — el PortfolioPicker, CoinDetails y la validación de overselling se actualizan automáticamente.
- **CoinDetails sin duplicación:** La página de historial lee su propia capa de utilidades sin copiar la lógica de `HoldingsTable`.
- **Overselling centralizado:** La validación en `AddAssetModal` usa el mismo cálculo que el portafolio visible al usuario — no pueden divergir.
- **Eliminación atómica:** `deleteTransaction` es el único punto de borrado, garantizando que todos los componentes vean el mismo estado tras una eliminación.
- **Módulo puro y testeable:** Sin side-effects de UI, fácil de cubrir con unit tests siguiendo ADR-016.

### Negativas

- **Acoplamiento implícito a la clave de localStorage:** `deleteTransaction` hardcodea `'caleta_holdings'`. Si `holdingsStorage.js` cambia su clave interna sin actualizar `transactionUtils.js`, el borrado dejará de funcionar silenciosamente.
- **Posible desincronización con `aggregateHoldings()`:** Si se modifica la lógica de `HoldingsTable.aggregateHoldings()` sin actualizar `transactionUtils.getNetBalance()`, los balances mostrados en CoinDetails y la validación de overselling divergirían del total en la tabla. Requiere disciplina al mantener el código.
- **Sin invalidación de caché:** `getHoldings()` lee localStorage en cada llamada. Si se llama `getPortfolioCoins()` y `getNetBalance()` en el mismo render, se leen dos veces. Aceptable para el volumen de datos esperado (decenas a cientos de transacciones).

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Exportar `aggregateHoldings()` desde HoldingsTable** | Crearía una dependencia de utilidades → componente UI. Viola la jerarquía de dependencias: los utils no deben depender de componentes. |
| **Añadir funciones directamente a `holdingsStorage.js`** | `holdingsStorage.js` es un módulo de persistencia de datos, no de lógica de negocio. Mezclarlo viola SRP y haría el módulo más difícil de testear aisladamente. |
| **Store global reactivo (ej. señales)** | Over-engineering para el tamaño actual del proyecto. La arquitectura vanilla sin estado global (ADR-002) es suficiente para el caso de uso. |
| **Copiar la lógica en cada consumidor** | Riesgo de inconsistencia en la regla de suma/resta. Si se añade un nuevo tipo de tx, hay que recordar actualizar todos los consumidores. Inaceptable. |

## Relación con ADRs Existentes

- **ADR-002** (Arquitectura sin framework): `transactionUtils.js` sigue el patrón de función pura que retorna datos, sin acoplamiento a componentes UI.
- **ADR-005** (Datos en localStorage): La capa respeta el modelo flat de `caleta_holdings` sin introducir estructura de datos adicional.
- **ADR-016** (Test runner nativo): Las funciones de `transactionUtils.js` son candidatas ideales para unit tests — funciones puras con entrada/salida determinista, sin dependencias de DOM.
- **ADR-023** (PortfolioPicker): Depende de `getPortfolioCoins()` de este módulo.
- **ADR-024** (Transfer doble entrada): La validación de balance antes de Transfer usa `getNetBalance()` de este módulo.

---
*Última actualización: 2026-06-21*
