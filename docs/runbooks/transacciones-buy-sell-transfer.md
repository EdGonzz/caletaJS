# Runbook: Transacciones — Buy, Sell y Transfer

Guía de referencia para entender el sistema de transacciones de CaletaJS: cómo funciona cada tipo, sus validaciones, y cómo se refleja en el portafolio.

---

## Tipos de Transacción

| Tipo | Semántica | Efecto en balance |
|------|-----------|-------------------|
| `buy` | Compra de criptomoneda a precio de mercado | `+balance` |
| `sell` | Venta de criptomoneda | `-balance` |
| `transfer` | Entrada de activo en una caleta (siempre el destino) | `+balance` |

> **Nota:** Una transferencia entre caletas genera **dos** entradas: una `sell` en la caleta origen y una `transfer` en la caleta destino. Ver [ADR-024](../decisions/024-transfer-doble-entrada-atomica.md).

---

## Flujo del Modal (AddAssetModal)

### Selector de moneda según tab activo

| Tab | Componente picker | Data source |
|-----|-------------------|-------------|
| Buy | `CoinPicker` | API CoinGecko `/search` |
| Sell | `PortfolioPicker` | `localStorage` (balance > 0) |
| Transfer | `PortfolioPicker` | `localStorage` (balance > 0) |

El **PortfolioPicker** muestra solo las monedas que el usuario ya posee y su balance disponible. No es posible vender o transferir una moneda que no está en el portafolio.

### Campos del formulario

| Campo | Buy | Sell | Transfer |
|-------|-----|------|----------|
| Moneda | CoinPicker (API) | PortfolioPicker | PortfolioPicker |
| Cantidad | ✅ | ✅ | ✅ |
| Precio por unidad | ✅ (+ botón Market) | ✅ | ✅ |
| Fecha y hora | ✅ | ✅ | ✅ |
| Caleta origen | ✅ | ✅ | ✅ |
| Caleta destino | ❌ | ❌ | ✅ (obligatorio) |
| Fees | ✅ | ✅ | ✅ (solo origen) |
| Notas | ✅ | ✅ | ✅ |

### Validaciones previas al guardado

1. **Cantidad > 0** y **Precio ≥ 0** (todos los tipos).
2. **Moneda seleccionada** (todos los tipos).
3. **Balance suficiente** (solo Sell y Transfer):
   ```
   getNetBalance(coinId) >= parsedQty
   ```
   Si falla: error inline en el formulario, no se guarda nada.
4. **Caleta destino seleccionada** (solo Transfer): si falta, error inline.

---

## Modelo de datos en localStorage

Clave: `caleta_holdings` (array JSON).

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
  "type": "buy",
  "date": "2026-06-21T20:00",
  "fees": 2.5,
  "notes": ""
}
```

### Ejemplo de transferencia completa

Transferir 0.1 BTC de Binance a Ledger genera **dos entradas**:

```json
// Entrada 1 — Salida de Binance
{ "type": "sell", "source": "Binance", "balance": 0.1, "fees": 1.0, "notes": "" }

// Entrada 2 — Llegada a Ledger
{ "type": "transfer", "source": "Ledger", "balance": 0.1, "fees": 0, "notes": "Recibido desde Binance" }
```

---

## transactionUtils — API de referencia

Archivo: `src/utils/transactionUtils.js`

| Función | Retorna | Uso |
|---------|---------|-----|
| `getAllTransactions()` | `Transaction[]` | Todas las entradas crudas |
| `getTransactionsByCoin(coinId)` | `Transaction[]` | Filtradas y ordenadas (más reciente primero) |
| `getNetBalance(coinId)` | `number` | Balance neto: buy+transfer − sell |
| `getPortfolioCoins()` | `PortfolioCoin[]` | Monedas con balance > 0 para PortfolioPicker |
| `deleteTransaction(txId)` | `boolean` | Elimina por ID, `true` si encontrada |

```javascript
import {
  getTransactionsByCoin,
  getNetBalance,
  getPortfolioCoins,
  deleteTransaction,
} from '../utils/transactionUtils.js';

// Verificar balance disponible antes de vender
const available = getNetBalance('bitcoin'); // → 1.5
if (sellQty > available) { /* error */ }

// Listar monedas disponibles para PortfolioPicker
const coins = getPortfolioCoins();
// → [{ coinId: 'bitcoin', name: 'Bitcoin', symbol: 'btc', logoUrl: '...', netBalance: 1.5 }]
```

---

## CoinDetails — Vista de historial

Ruta: `#/coin/:id`

### Cómo llegar

- Click en el nombre de cualquier moneda en la `HoldingsTable`.
- Navegar directamente a `#/coin/bitcoin` (o cualquier `coinId`).

### Secciones

1. **Header:** nombre, logo, precio actual y cambio 24h (CoinGecko API, async).
2. **Stats:** balance total, valor en USD, número de compras, número de ventas.
3. **Historial:** lista cronológica de todas las transacciones de esa moneda.

### Eliminar una transacción

- El botón ❌ en cada fila del historial abre un `confirm()` nativo.
- Si se confirma, llama a `deleteTransaction(tx.id)` y re-renderiza la lista y las stats.
- **La operación es irreversible.**

> ⚠️ **Transferencias:** Si eliminas la entrada `sell` (caleta origen) de una transferencia, la entrada `transfer` (caleta destino) queda huérfana. El balance neto de la moneda aumentará incorrectamente. Elimina ambas entradas para revertir una transferencia completa.

---

## Agregar un nuevo tipo de transacción

Si en el futuro se necesita añadir un tipo (ej. `staking`, `airdrop`):

1. **`transactionUtils.js`:** Actualizar `getNetBalance()` y `getPortfolioCoins()` con la nueva regla de suma/resta.
2. **`HoldingsTable.js`:** Actualizar `aggregateHoldings()` (líneas ~67-68) con la misma regla.
3. **`chartDataAdapter.js`:** Actualizar `aggregateForHistory()` con la misma regla.
4. **`AddAssetModal.js`:** Añadir el tab si corresponde.
5. **`CoinDetails.js`:** Añadir el badge y color del nuevo tipo en `_txRow()`.

> ⚠️ **Las reglas de aggregación deben ser idénticas en `transactionUtils.js` y `aggregateHoldings()`.** Una divergencia causaría que CoinDetails muestre un balance distinto al que ve el usuario en la tabla principal.

---

## Troubleshooting

### El balance en CoinDetails no coincide con HoldingsTable

Posible causa: la regla de suma/resta en `getNetBalance()` difiere de `aggregateHoldings()`.

```bash
# Verificar en consola del browser:
JSON.parse(localStorage.getItem('caleta_holdings'))
  .filter(tx => tx.coinId === 'bitcoin')
  .reduce((acc, tx) => {
    if (tx.type === 'buy' || tx.type === 'transfer') return acc + tx.balance;
    if (tx.type === 'sell') return acc - tx.balance;
    return acc;
  }, 0);
```

Comparar con lo que muestra HoldingsTable. Si difieren, revisar la lógica en ambos archivos.

### Una transferencia no aparece en la caleta destino

Verificar que se crearon las dos entradas:

```bash
# En consola del browser:
JSON.parse(localStorage.getItem('caleta_holdings'))
  .filter(tx => tx.coinId === 'bitcoin')
  .map(tx => ({ type: tx.type, source: tx.source, balance: tx.balance }));
```

Expected: una entrada `sell` con la caleta origen y una entrada `transfer` con la caleta destino.

### PortfolioPicker aparece vacío

Ocurre cuando no hay monedas con balance neto > 0. Causas posibles:
- No hay holdings registrados.
- Todos los holdings tienen balance neto ≤ 0 (overselling previo a la validación).

Revisar directamente el localStorage y verificar con `getNetBalance(coinId)`.

---

*Última actualización: 2026-06-21*
