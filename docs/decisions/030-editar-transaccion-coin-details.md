# ADR-030: Edición de Transacciones desde CoinDetails

- **Estado:** Aceptada
- **Fecha:** 2026-08-31
- **Contexto:** La página CoinDetails (ADR-026) permite ver y eliminar transacciones, pero no editarlas. Para corregir un error en cantidad, precio, exchange o notas, el usuario debe eliminar la transacción y crearla de nuevo — un flujo tedioso y propenso a errores, especialmente para transferencias que requieren recrear ambas piernas manualmente.

## Contexto

CoinDetails muestra el historial cronológico de transacciones de una moneda con botón eliminar (ADR-026). Sin embargo, la ADR-026 dejó explícitamente la edición como deuda técnica:

> *"Sin edición: Solo eliminar. Para modificar una transacción incorrecta, el usuario debe borrarla y crear una nueva."*

Los escenarios que motivan la edición:

| Escenario | Problema actual |
|---|---|
| Typo en cantidad (ej. `0.15` en vez de `1.5`) | Eliminar + recrear. Si tiene fees o transferencia, recrear es tedioso. |
| Exchange equivocado | Eliminar + recrear. En transferencias, debe recordar ambos exchanges. |
| Notas incorrectas | Eliminar + recrear solo por un cambio de texto. |
| Precio manual incorrecto | Eliminar + recrear. El usuario pierde la referencia temporal. |

### Restricciones clave

1. **Transferencias son pares atómicos** (ADR-024, ADR-027): `transfer_out` + `transfer_in` están enlazados por `transferId`. Editar una pierna debe actualizar la otra consistentemente.
2. **Validación de oversell**: Al editar una venta o transferencia enviada, la nueva cantidad no puede exceder el balance disponible del exchange — pero el balance disponible *incluye* la propia transacción que se está editando.
3. **Notas de transferencia tienen prefijos**: Las notas de `transfer_in` se generan automáticamente con `[Recibido desde X]`. Al editar, el prefijo debe extraerse antes de mostrar al usuario y regenerarse si cambia el origen.

## Decisión

### 1. Modal dedicado `EditTransactionModal` (no reutilizar AddAssetModal)

Se crea `src/components/EditTransactionModal.js` como componente independiente en vez de reutilizar `AddAssetModal` pre-llenado (alternativa descartada en ADR-026).

**Razones:**

| Aspecto | AddAssetModal reutilizado | EditTransactionModal dedicado |
|---|---|---|
| Complejidad | Mezclar lógica de creación y edición en un solo componente (~800 líneas) | Componente enfocado (~400 líneas) con su propio ciclo de vida |
| Validación de oversell | Requiere excluir la propia transacción del cálculo de balance — lógica ajena al flujo de creación | `getAvailableBalanceExcluding()` es la base natural de validación |
| Transferencias | AddAssetModal crea piernas desde cero; editar requiere detectar y actualizar piernas existentes | `updateTransaction()` maneja la lógica de ambas piernas internamente |
| Vistas | AddAssetModal tiene 5+ sub-vistas (coin picker, exchange picker, destination) | Solo 3 vistas: `form`, `exchange`, `destination-exchange` |
| Mantenibilidad | Cualquier cambio de creación puede romper edición y viceversa | Independientes — cambios aislados |

El modal sigue el patrón del proyecto: `default export → HTML string`, `openEditTransactionModal({tx, pairedTx, onSave})`, `initEditTransactionModal()`, `cleanupEditTransactionModal()`.

### 2. Sincronización atómica de transfers vía `updateHoldingsBatch`

La función `updateTransaction(txId, updates)` en `transactionUtils.js` resuelve el problema de editar transferencias:

```javascript
// Caso 1: Transacción individual (sin transferId)
if (!tx.transferId) {
  updateHoldingsBatch([{ id: txId, updates: singleUpdates }]);
  return true;
}

// Caso 2: Transferencia — ambas piernas en un solo batch
const batch = [
  { id: outTx.id, updates: { balance: qty, source, notes: outNotes, ... } },
  { id: inTx.id,  updates: { balance: qty - networkFee, source: destSource, notes: inNotes, ... } },
];
updateHoldingsBatch(batch);
return true;
```

`updateHoldingsBatch` (en `holdingsStorage.js`) ejecuta todas las actualizaciones en **una sola escritura a localStorage**, garantizando atomicidad. Si la app se cierra a mitad de la operación, no quedan piernas desincronizadas.

**Reglas de actualización de piernas:**

| Campo | `transfer_out` | `transfer_in` |
|---|---|---|
| `balance` | `qty` (cantidad enviada) | `qty - networkFee` (cantidad recibida) |
| `source` | Origen (exchange emisor) | Destino (exchange receptor) |
| `notes` | Notas del usuario (sin prefijo) | `[Recibido desde {origen}] {notas}` |
| `price` | Heredado del origen | Heredado del origen (cost basis) |

### 3. Validación de oversell excluyendo la propia transacción

La función `getAvailableBalanceExcluding(tx)` calcula el balance disponible *sin contar* la transacción que se está editando:

```javascript
export const getAvailableBalanceExcluding = (tx) => {
  if (!tx || !tx.coinId || !tx.source) return 0;
  return getNetBalance(tx.coinId, tx.source) - getBalanceDelta(tx);
};
```

**Ejemplo:** Si el usuario tiene 2 BTC en Binance y quiere editar una venta de 1.5 BTC a 2.5 BTC:
- `getNetBalance('btc', 'Binance')` = 2.0 (incluye la venta de -1.5)
- `getBalanceDelta(sellTx)` = -1.5
- `getAvailableBalanceExcluding(sellTx)` = 2.0 - (-1.5) = 3.5
- Validación: `2.5 <= 3.5` → ✅ permitido

Sin esta exclusión, el balance disponible sería `2.0` y la validación rechazaría incorrectamente `2.5 > 2.0`.

### 4. Regeneración de notas con strip de prefijo

Las notas de `transfer_in` se generan automáticamente con el formato `[Recibido desde {exchange}] {notas del usuario}`. Al editar, se necesita extraer las notas originales del usuario para pre-llenar el campo.

`stripTransferNotesPrefix(notes)` elimina recursivamente los prefijos apilados:

```javascript
// Input:  "[Recibido desde Kraken] [Recibido desde Binance] Mis notas"
// Output: "Mis notas"
```

El strip es iterativo (`do...while`) para manejar prefijos apilados por ediciones previas. Después del strip, `updateTransaction()` regenera el prefijo con el nuevo origen.

### 5. Refactor de `sanitizeNumericInput`

La función `sanitizeNumericInput(inputEl)` se extrajo de `AddAssetModal.js` a `helpers.js` como utilidad compartida. Ambos modales (Add y Edit) la importan desde el mismo lugar:

```javascript
// helpers.js
export const sanitizeNumericInput = (inputEl) => { ... }

// AddAssetModal.js
import { sanitizeNumericInput } from '../utils/helpers.js';

// EditTransactionModal.js
import { sanitizeNumericInput } from '../utils/helpers.js';
```

Esto elimina duplicación y garantiza comportamiento idéntico en ambos flujos (formatos US/European, cursor preservado, punto decimal único).

### 6. Integración con CoinDetails

El botón editar se agrega a cada fila del historial en `CoinDetails.js`:

```html
<button data-edit-tx="${tx.id}" aria-label="Editar transacción">
  <svg><use href="${sprite}#pencil"></use></svg>
</button>
```

El handler `_handleEditTx` resuelve la pareja de transferencia (si aplica) y pasa ambos al modal. Post-edición, `onSave` ejecuta `updateTransaction()`, re-renderiza la lista + stats + distribución, y dispatch `holdings-updated` para sincronizar `HoldingsTable`.

### 7. Accesibilidad (WCAG 2.1 AA)

- **Focus trap** dentro del modal (mismo patrón que `AddAssetModal`).
- **Escape** cierra el modal (y sub-vistas retornan al form principal).
- **Backdrop click** cierra el modal.
- **`aria-label`** en todos los botones y campos.
- **Z-index** `z-150` (modal) / `z-151` (dropdowns internos) — mismo nivel que `ConfirmDeleteModal` (`z-150`/`z-151`). No coexisten: CoinDetails abre uno u otro, nunca ambos simultáneamente.

## Consecuencias

### Positivas

- **Flujo de corrección completo:** El usuario puede editar cualquier campo sin eliminar y recrear la transacción.
- **Transferencias editadas atómicamente:** Ambas piernas se actualizan en una sola escritura a localStorage. No hay estado intermedio inconsistente.
- **Validación de oversell correcta:** `getAvailableBalanceExcluding()` evita falsos negativos al calcular el balance disponible.
- **Notas preservadas:** El strip de prefijo permite recuperar las notas originales del usuario incluso después de múltiples ediciones con cambio de origen.
- **Código compartido:** `sanitizeNumericInput` centralizado evita divergencia de comportamiento entre modales.
- **Sincronización cross-component:** `holdings-updated` mantiene `HoldingsTable` y `CoinDetails` en sync.

### Negativas

- **Duplicación parcial de validaciones:** `EditTransactionModal` replica las validaciones de `AddAssetModal` (qty > 0, fees ≤ qty, networkFee < qty, origen ≠ destino). Mitigación: son validaciones simples (~10 líneas cada una) y los modales tienen contextos diferentes (excluir propia tx vs no).
- **Complejidad de `updateTransaction`:** La lógica de transferencias (~80 líneas) es más compleja que la de transacciones individuales (~5 líneas). Mitigación: tests dedicados cubren ambos casos.
- **Sin validación de cambio de moneda:** `updateTransaction` permite cambiar `coinId` en teoría, pero el modal no lo expone (moneda es read-only). Si se necesitara en el futuro, requeriría re-validación completa del balance.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Reutilizar AddAssetModal pre-llenado** | Mezcla lógica de creación y edición. La exclusión de la propia transacción del cálculo de balance es ajena al flujo de creación. Descartada en ADR-026. |
| **Inline editing en la tabla** | Espacio insuficiente para todos los campos (qty, price, fees, networkFee, source, destSource, notas). Transferencias requieren editar dos filas simultáneamente. |
| **Página de edición separada** | Over-engineering. Un modal es suficiente para los campos editables y mantiene al usuario en contexto. |
| **Eliminar y recrear automáticamente** | Fragil: requiere recrear exactamente los mismos campos, incluyendo `transferId`, `createdAt`, etc. Cualquier divergencia genera datos inconsistentes. |

## Relación con ADRs Existentes

- **ADR-024** (Transfer doble entrada): `updateTransaction()` preserva la estructura de piernas emparejadas y la atomicidad vía `updateHoldingsBatch`.
- **ADR-026** (CoinDetails): El botón editar se integra en la lista de historial. La ADR-026 dejó la edición como deuda técnica — este ADR la resuelve.
- **ADR-027** (transferId enlace cascada): `updateTransaction()` usa `transferId` para encontrar ambas piernas de una transferencia.
- **ADR-028** (getBalanceDelta): `getAvailableBalanceExcluding()` usa `getBalanceDelta()` como regla centralizada de balance.
- **ADR-029** (Validación defensiva): `updateTransaction()` aplica `Number()` a `qty`, `networkFee` y `price` antes de operar.

---
*Última actualización: 2026-08-31*
