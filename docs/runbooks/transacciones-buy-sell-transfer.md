# Runbook: Transacciones — Buy, Sell y Transfer

Guía de referencia para entender el sistema de transacciones de CaletaJS: cómo funciona cada tipo, sus validaciones, y cómo se refleja en el portafolio.

---

## Tipos de Transacción

| Tipo | Semántica | Efecto en balance |
|------|-----------|-------------------|
| `buy` | Compra de criptomoneda a precio de mercado | `+balance` |
| `sell` | Venta de criptomoneda | `-balance` |
| `transfer_out` | Salida de activo de una caleta (origen de transferencia) | `-balance` |
| `transfer_in` | Entrada de activo a una caleta (destino de transferencia) | `+balance` |

> **Nota:** Una transferencia entre caletas genera **dos** entradas: una `transfer_out` en la caleta origen y una `transfer_in` en la caleta destino.
> Si hay **network fee**, la cantidad que llega al destino (`transfer_in.balance`) es menor que la que sale del origen (`transfer_out.balance`). Ver [ADR-024](../decisions/024-transfer-doble-entrada-atomica.md).

---

## Flujo del Modal (AddAssetModal)

### Selector de moneda según tab activo

| Tab | Componente picker | Data source |
|-----|-------------------|-------------|
| Buy | `CoinPicker` | API CoinGecko `/search` |
| Sell | `PortfolioPicker` | `localStorage` (balance > 0 en la caleta seleccionada) |
| Transfer | `PortfolioPicker` | `localStorage` (balance > 0 en la caleta seleccionada) |

El **PortfolioPicker** muestra solo las monedas con balance > 0 **en la caleta específica** que el usuario tiene seleccionada. No es posible vender o transferir una moneda que no está en el portafolio de esa caleta.

### Campos del formulario

| Campo | Buy | Sell | Transfer |
|-------|-----|------|----------|
| Moneda | CoinPicker (API) | PortfolioPicker | PortfolioPicker |
| Cantidad | ✅ | ✅ | ✅ ("Cantidad a enviar") |
| Precio por unidad | ✅ (+ botón Market) | ✅ | ❌ (auto-calculado como cost basis) |
| Network Fee | ❌ | ❌ | ✅ (opcional, en la moneda) |
| Destino recibe | ❌ | ❌ | ✅ (read-only: quantity - networkFee) |
| Fecha y hora | ✅ | ✅ | ✅ |
| Caleta/Exchange | ✅ (destino — donde se depositan las monedas) | ✅ (origen — de donde se debitan las monedas) | ✅ (origen — de donde salen las monedas) |
| Caleta destino | — | — | ✅ (obligatorio, distinta de origen) |
| Platform Fees (USD) | ✅ | ✅ | ❌ |
| Notas | ✅ | ✅ | ✅ |

### Validaciones previas al guardado

1. **Cantidad > 0** y **Precio ≥ 0** (Buy/Sell). En Transfer el precio se calcula automáticamente.
2. **Moneda seleccionada** (todos los tipos).
3. **Balance suficiente (por-exchange)** — solo Sell y Transfer:
   ```
   getNetBalance(coinId, selectedExchange.name) >= parsedQty
   ```
   Valida contra el balance de la caleta específica, no el global. No puedes vender/transferir desde una caleta que no tiene la moneda, aunque la tengas en otra.
4. **Caleta destino seleccionada** (solo Transfer): si falta, error inline.
5. **Caleta destino distinta de origen** (solo Transfer): no se puede transferir a la misma caleta.
6. **Network fee < cantidad** (solo Transfer): el destino recibiría 0 o negativo.

Si alguna validación falla, se muestra un error inline en el formulario y no se guarda nada.

### Cost basis automático en Transfer

En el tab Transfer, el campo Precio **no se muestra**. El precio se calcula automáticamente como el **costo promedio ponderado** de las compras en la caleta origen:

```
costBasis = sum(qty_compra * price_compra) / sum(qty_compra)
```

Este cost basis se usa como `price` en ambas entradas (`transfer_out` y `transfer_in`). Así, el destino hereda el costo real de adquisición.

Si no hay historial de compras (edge case raro), se usa el precio actual de mercado via CoinGecko.

---

## Modelo de datos en localStorage

Clave: `caleta_user_holdings` (array JSON).

```json
{
  "id": "uuid-v4",
  "coinId": "bitcoin",
  "name": "Bitcoin",
  "symbol": "btc",
  "logoUrl": "https://...",
  "balance": 0.5,
  "price": 104000,
  "source": "Binance",
  "sourceIcon": "wallet",
  "sourceImage": "https://...",
  "type": "buy",
  "date": "2026-06-21T20:00",
  "fees": 2.5,
  "notes": ""
}
```

### Ejemplo de transferencia completa (sin network fee)

Transferir 0.1 BTC de Binance a Ledger genera **dos entradas**:

```json
// Entrada 1 — Salida de Binance
{ "type": "transfer_out", "source": "Binance", "balance": 0.1, "price": 30000, "networkFee": 0, "notes": "" }

// Entrada 2 — Llegada a Ledger
{ "type": "transfer_in", "source": "Ledger", "balance": 0.1, "price": 30000, "networkFee": 0, "notes": "Recibido desde Binance" }
```

### Ejemplo de transferencia con network fee

Transferir 1 BTC de Binance a Ledger con fee de 0.001 BTC:

```json
// Entrada 1 — Salida de Binance
{ "type": "transfer_out", "source": "Binance", "balance": 1, "price": 30000, "networkFee": 0.001, "notes": "" }

// Entrada 2 — Llegada a Ledger (recibe 0.999 BTC)
{ "type": "transfer_in", "source": "Ledger", "balance": 0.999, "price": 30000, "networkFee": 0.001, "notes": "Recibido desde Binance" }
```

---

## transactionUtils — API de referencia

Archivo: `src/utils/transactionUtils.js`

| Función | Retorna | Uso |
|---------|---------|-----|
| `getTransactionsByCoin(coinId)` | `Transaction[]` | Filtradas y ordenadas (más reciente primero) |
| `getNetBalance(coinId, source?)` | `number` | Balance neto. Sin `source` = global. Con `source` = por caleta. |
| `getPortfolioCoins(source?)` | `PortfolioCoin[]` | Monedas con balance > 0. Sin `source` = global. Con `source` = por caleta. |
| `getAverageCostBasis(coinId, source)` | `number \| null` | Costo promedio ponderado en esa caleta. `null` si no hay historial. |
| `deleteTransaction(txId)` | `Transaction[]` | Elimina por ID (wrapper sobre `removeHolding`). Retorna lista actualizada. |

```javascript
import {
  getTransactionsByCoin,
  getNetBalance,
  getPortfolioCoins,
  getAverageCostBasis,
  deleteTransaction,
} from '../utils/transactionUtils.js';

// Verificar balance disponible antes de vender (por caleta)
const available = getNetBalance('bitcoin', 'Binance'); // balance en Binance
if (sellQty > available) { /* error */ }

// Obtener cost basis para transferencia
const costBasis = getAverageCostBasis('bitcoin', 'Binance');
// → 30000 (promedio ponderado de compras en Binance)

// Listar monedas disponibles en PortfolioPicker (filtradas por caleta)
const coins = getPortfolioCoins('Binance');
// → [{ coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', logoUrl: '...', netBalance: 0.5 }]
```

---

## CoinDetails — Vista de historial

Ruta: `#/coin/:id`

### Cómo llegar

- Click en el nombre de cualquier moneda en la `HoldingsTable`.
- Navegar directamente a `#/coin/bitcoin` (o cualquier `coinId`).

### Secciones

1. **Header:** nombre, logo, precio actual y cambio 24h (CoinGecko via `apiFetch`, async).
2. **Stats:** balance total, valor en USD, número de compras + transferencias recibidas, número de ventas.
3. **Historial:** lista cronológica de todas las transacciones de esa moneda.

### Badges de tipo de transacción

| Tipo | Color | Label |
|---|---|---|
| `buy` | `text-emerald-400 bg-emerald-400/10` | Compra |
| `sell` | `text-rose-400 bg-rose-400/10` | Venta |
| `transfer_out` | `text-amber-400 bg-amber-400/10` | Transferencia enviada |
| `transfer_in` | `text-sky-400 bg-sky-400/10` | Transferencia recibida |

### Eliminar una transacción

- El botón 🗑 en cada fila del historial abre un modal de confirmación (`openConfirmDeleteModal`).
- Si se confirma, llama a `deleteTransaction(tx.id)` (que usa `removeHolding`), re-renderiza la lista y las stats, y dispatcha el evento `holdings-updated` para sincronizar la tabla principal.
- **La operación es irreversible.**

> ⚠️ **Transferencias:** Si eliminas la entrada `transfer_out` (caleta origen) de una transferencia, la entrada `transfer_in` (caleta destino) queda huérfana. El balance neto de la moneda aumentará incorrectamente. Elimina ambas entradas para revertir una transferencia completa.

---

## Agregar un nuevo tipo de transacción

Si en el futuro se necesita añadir un tipo (ej. `staking`, `airdrop`):

1. **`transactionUtils.js`:** Actualizar `getNetBalance()` y `getPortfolioCoins()` con la nueva regla de suma/resta.
2. **`HoldingsTable.js`:** Actualizar `aggregateHoldings()` con la misma regla.
3. **`chartDataAdapter.js`:** Actualizar `aggregateForHistory()` con la misma regla.
4. **`AddAssetModal.js`:** Añadir el tab si corresponde.
5. **`CoinDetails.js`:** Añadir el badge y color del nuevo tipo en `_txRow()`.

> ⚠️ **Las reglas de agregación deben ser idénticas en `transactionUtils.js` y `aggregateHoldings()`.** Una divergencia causaría que CoinDetails muestre un balance distinto al que ve el usuario en la tabla principal.

---

## Troubleshooting

### El balance en CoinDetails no coincide con HoldingsTable

Posible causa: la regla de suma/resta en `getNetBalance()` difiere de `aggregateHoldings()`.

```bash
# Verificar en consola del browser:
JSON.parse(localStorage.getItem('caleta_user_holdings'))
  .filter(tx => tx.coinId === 'bitcoin')
  .reduce((acc, tx) => {
    if (tx.type === 'buy' || tx.type === 'transfer_in') return acc + tx.balance;
    if (tx.type === 'sell' || tx.type === 'transfer_out') return acc - tx.balance;
    return acc;
  }, 0);
```

Comparar con lo que muestra HoldingsTable. Si difieren, revisar la lógica en ambos archivos.

### Una transferencia no aparece en la caleta destino

Verificar que se crearon las dos entradas:

```bash
# En consola del browser:
JSON.parse(localStorage.getItem('caleta_user_holdings'))
  .filter(tx => tx.coinId === 'bitcoin')
  .map(tx => ({ type: tx.type, source: tx.source, balance: tx.balance }));
```

Expected: una entrada `transfer_out` con la caleta origen y una entrada `transfer_in` con la caleta destino.

### PortfolioPicker aparece vacío

Ocurre cuando no hay monedas con balance neto > 0 en la caleta seleccionada. Causas posibles:
- No hay holdings registrados.
- Todos los holdings de esa caleta tienen balance neto ≤ 0.
- La caleta seleccionada no tiene la moneda (está en otra caleta).

Revisar directamente el localStorage y verificar con `getNetBalance(coinId, 'NombreCaleta')`.

### Cost basis no se calcula (Transfer)

Si `getAverageCostBasis(coinId, source)` retorna `null`:
- No hay compras ni transferencias recibidas de esa moneda en la caleta origen.
- El fallback usa el precio actual de mercado via CoinGecko.

---

*Última actualización: 2026-06-23*
