# ADR-027: Transfer Linking — transferId para Eliminación en Cascada

- **Estado:** Aceptada
- **Fecha:** 2026-06-24
- **Contexto:** Las transferencias generan dos entradas en localStorage (`transfer_out` + `transfer_in`). Si el usuario elimina una desde CoinDetails, la otra queda huérfana, causando que el balance de la caleta opuesta quede incorrecto.

## Contexto

En el modelo de doble entrada (ADR-024), cada transferencia produce:

```json
{ "id": "uuid-a", "type": "transfer_out", "source": "Binance", "balance": 1 }
{ "id": "uuid-b", "type": "transfer_in", "source": "Ledger", "balance": 0.999 }
```

Sin un vínculo entre ambas, si el usuario elimina `uuid-a` desde CoinDetails:

1. Binance recupera 1 BTC en su balance (incorrecto).
2. Ledger sigue mostrando 0.999 BTC (huérfano).
3. El balance global aumenta ficticiamente.

Las alternativas manuales (pedir al usuario que elimine ambas) son frágiles y dependen de que el usuario recuerde hacerlo.

## Decisión

Se añade un campo compartido `transferId` a ambas entradas de una transferencia, generado una sola vez al momento del submit. Cuando `deleteTransaction()` encuentra un `transferId`, busca la entrada emparejada y la elimina también — cascada atómica.

### Modelo de datos

```json
// Ambas entradas comparten el mismo transferId
{
  "id": "uuid-a",
  "transferId": "tx-c5f8a1b2-...",
  "type": "transfer_out",
  "source": "Binance",
  "balance": 1,
  "price": 30000,
  "networkFee": 0.001,
  "date": "2026-06-24T12:00",
  "notes": ""
}
{
  "id": "uuid-b",
  "transferId": "tx-c5f8a1b2-...",
  "type": "transfer_in",
  "source": "Ledger",
  "balance": 0.999,
  "price": 30000,
  "networkFee": 0.001,
  "date": "2026-06-24T12:00",
  "notes": "Recibido desde Binance"
}
```

### Generación del transferId

Se genera un UUID v4 una sola vez en el handler de submit, ANTES de llamar a `addHolding`:

```javascript
const TRANSFER_ID = crypto.randomUUID();

addHolding({
  ...baseData,
  type: 'transfer_out',
  transferId: TRANSFER_ID,
  // ...
});

addHolding({
  ...baseData,
  type: 'transfer_in',
  transferId: TRANSFER_ID,
  // ...
});
```

### Lógica de cascade en deleteTransaction

`deleteTransaction` (en `transactionUtils.js`) se actualiza para:

1. Obtener la transacción a eliminar.
2. Si tiene `transferId`, buscar la otra entrada con el mismo `transferId` e id distinto.
3. Eliminar ambas mediante `removeHolding()` (o un batch).

```javascript
import { getHoldings, removeHolding } from './holdingsStorage.js';

export const deleteTransaction = (txId) => {
  const holdings = getHoldings();
  const tx = holdings.find(h => h.id === txId);
  if (!tx) return false;

  let idsToRemove = [txId];

  // Cascade: si es parte de una transferencia, eliminar la pareja
  if (tx.transferId) {
    const paired = holdings.find(
      h => h.transferId === tx.transferId && h.id !== txId
    );
    if (paired) idsToRemove.push(paired.id);
  }

  // Eliminar todos los IDs
  idsToRemove.forEach(id => removeHolding(id));
  return true;
};
```

`removeHolding` ya maneja el caso donde el ID no existe (simplemente no filtra nada), por lo que es seguro llamarlo incluso si la entrada emparejada ya fue eliminada previamente.

### UX en CoinDetails

El modal de confirmación (`openConfirmDeleteModal`) puede mostrar un mensaje contextual:

- **Transacción normal:** "¿Eliminar esta transacción? Esta acción no se puede deshacer."
- **Transferencia (con transferId):** "Esta transacción es parte de una transferencia. Se eliminarán ambas entradas (origen y destino)."

Esto se determina simplemente revisando si `tx.transferId` existe al abrir el modal.

### Impacto en el modelo de datos

- Nuevo campo: `transferId` (string, opcional) — solo presente en transacciones de tipo `transfer_out` y `transfer_in`.
- No afecta a `buy`, `sell`, ni transacciones existentes.
- `getNetBalance()`, `getPortfolioCoins()` y `aggregateHoldings()` no necesitan cambios — ignoran el campo.

### Impacto en la UI

- Ninguno durante la creación de la transferencia (el campo es interno).
- Durante eliminación, el cascade es transparente para el usuario (la interfaz solo muestra que la transacción fue eliminada).
- Opcional: el modal de confirmación puede informar que se eliminarán ambas entradas.

## Consecuencias

### Positivas

- **Eliminación atómica:** No quedan entradas huérfanas. El balance siempre es consistente.
- **Sin cambios en UI:** El cascade es invisible para el usuario — solo ve que la transacción desaparece.
- **Compatible con el modelo existente:** `transferId` es opcional y no afecta a transacciones que no son transferencias.
- **Costo de implementación bajo:** ~10 líneas en `deleteTransaction`, 1 línea en el submit handler.

### Negativas

- **Nuevo campo en el modelo:** Cada transferencia almacena un UUID adicional (~36 caracteres) en ambas entradas.
- **Cascade no deshacible:** Si el usuario elimina accidentalmente un lado de la transferencia, la otra entrada también se elimina. El `openConfirmDeleteModal` mitiga esto con su confirmación.
- **removeHolding llamado N veces:** Para una transferencia se hacen 2 llamadas a `removeHolding` (una por cada entrada). Aceptable para el volumen de datos.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Matching por coinId + date + amount** | Frágil — dos transferencias de la misma moneda en el mismo día con la misma cantidad serían indistinguibles. |
| **Modal que pregunta "¿Eliminar también la entrada emparejada?"** | Añade fricción UX. El cascade automático es más limpio y predecible. |
| **No hacer cascade (dejar huérfanas)** | Balance inconsistente, obliga al usuario a rastrear manualmente la pareja. Inaceptable. |
| **Una sola entrada con fromSource/toSource** | Alternativa más radical que modificaría `aggregateHoldings()` y el filtrado por caleta (descartada en ADR-024). |

## Relación con ADRs Existentes

- **ADR-024** (Transfer doble entrada): La necesidad de cascade es consecuencia directa del modelo de dos entradas. `transferId` resuelve la negativa "Eliminar una transferencia requiere borrar ambas entradas".
- **ADR-025** (transactionUtils): `deleteTransaction()` se actualiza con la lógica de cascade. `removeHolding()` es la función de borrado subyacente (resuelve la deuda técnica de la v1).

---
*Última actualización: 2026-06-24*
