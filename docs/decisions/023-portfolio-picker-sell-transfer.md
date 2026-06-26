# ADR-023: PortfolioPicker — Selector desde localStorage para Sell y Transfer

- **Estado:** Aceptada (v2 — extensiones de Transfer)
- **Fecha:** 2026-06-21 (v1) / 2026-06-23 (v2)
- **Contexto:** El flujo de Sell y Transfer en `AddAssetModal` usaba `CoinPicker` (búsqueda en CoinGecko API), permitiendo registrar ventas o transferencias de monedas que el usuario no posee. La v1 reemplazó el picker por uno local. La v2 añade filtro por-exchange, oculta el campo price en Transfer y añade network fee.

## Contexto

El `AddAssetModal` implementa tres tabs de transacción: **Buy**, **Sell** y **Transfer**. Originalmente los tres compartían `CoinPicker` (API), con estos problemas:

- Un usuario podía vender o transferir monedas con balance neto 0, generando balances negativos.
- En Transfer no había campo de caleta destino — era semánticamente idéntico a Buy.

### Mejoras de v2

1. **Balance por-exchange:** El PortfolioPicker ahora muestra el balance disponible en la caleta específica seleccionada, no el global. Esto evita que el usuario "vea" monedas que están en otra caleta e intente venderlas desde la equivocada.
2. **Tab Transfer sin campo price:** El precio se calcula automáticamente como cost basis promedio ponderado (ver ADR-024). El campo price está oculto.
3. **Network fee:** En Transfer, se añade un campo opcional "Network Fee" en la moneda (no en USD). El fee se descuenta del balance que llega al destino.

## Decisión

Se reemplaza el `CoinPicker` (API) por `PortfolioPicker` (localStorage) **únicamente para Sell y Transfer**. El tab Buy sigue usando `CoinPicker`.

### Arquitectura del PortfolioPicker

```
src/components/PortfolioPicker.js
  ├── PortfolioOption(coin, selectedCoinId) → string       # Fila con balance disponible
  ├── PortfolioPicker(selectedCoinId, sourceFilter) → string      # Shell del view con búsqueda
  └── initPortfolioPicker({ onBack, onClose, onSelect, onSearch }) → void
```

El componente recibe un `sourceFilter` opcional que pasa a `getPortfolioCoins(sourceFilter)`. Si el usuario tiene seleccionada una caleta específica (ej. "Binance"), el picker solo muestra monedas con balance > 0 en Binance.

**Incluye barra de búsqueda local** (idéntica en UX a la de `CoinPicker`):
- No debounce — los datos son locales, el filtrado es instantáneo.
- Filtra por nombre o symbol de la moneda contra el texto ingresado.
- Si no hay resultados, muestra un empty state "Sin resultados para tu búsqueda".
- Si el portafolio está vacío, no muestra la barra de búsqueda (solo el empty state "Sin monedas en tu portafolio").

El callback `onSearch` recibe el término de búsqueda y puede usarse para reiniciar el scroll al tope de la lista. Al escribir en el input, se filtran las filas visibles vía `data-*` attributes, igual que en `SelectExchange`.

### Campos del formulario por tab

| Campo | Buy | Sell | Transfer |
|---|---|---|---|
| Moneda | CoinPicker (API) | PortfolioPicker | PortfolioPicker |
| Cantidad | ✅ | ✅ | ✅ ("Cantidad a enviar") |
| Precio por unidad | ✅ (+ botón Market) | ✅ | ❌ (auto-calculado) |
| Network Fee | ❌ | ❌ | ✅ (en la moneda, opcional) |
| Destino recibe | ❌ | ❌ | ✅ (read-only: quantity - networkFee) |
| Fecha y hora | ✅ | ✅ | ✅ |
| Caleta/Exchange | ✅ (destino — donde se depositan las monedas) | ✅ (origen — de donde se debitan las monedas) | ✅ (origen — de donde salen las monedas) |
| Caleta destino | — | — | ✅ (obligatorio, distinta de origen) |
| Platform Fees (USD) | ✅ | ✅ | ❌ |
| Notas | ✅ | ✅ | ✅ |

### Bifurcación en `renderInner()` de AddAssetModal

```javascript
} else if (currentView === 'coin') {
  if (activeTab === 'buy') {
    // CoinPicker — API de CoinGecko (sin cambios)
  } else {
    // Sell / Transfer → PortfolioPicker — localStorage
    inner.innerHTML = PortfolioPicker(selectedCoin.id, selectedExchange?.name);
    initPortfolioPicker({ onBack, onClose, onSelect });
  }
```

### Transfer con campo de destino y network fee

Al activar el tab Transfer, `FormView()` renderiza condicionalmente:

- Selector "Caleta Destino" (reutiliza `SelectExchange`, escribe en `destinationExchange`)
- Network Fee input (en la moneda, no en USD)
- "Destino recibe" auto-calculado (read-only)
- Precio y Platform Fees ocultos

El botón "Caleta Destino" abre una vista `destination-exchange` que reutiliza `SelectExchange` pero escribe en `destinationExchange` (variable de estado separada de `selectedExchange`).

## Consecuencias

### Positivas

- **Integridad de datos garantizada:** Es imposible vender o transferir una moneda que no existe en la caleta específica seleccionada.
- **Balance por-exchange visible:** El usuario sabe exactamente cuánto tiene disponible en cada caleta antes de elegir.
- **Sin llamadas API en Sell/Transfer:** Reduce presión sobre el rate-limit de CoinGecko (ADR-018).
- **UX de Transfer más limpia:** Sin campos irrelevantes (price, platform fees). Network fee en la moneda, no en USD.
- **Cost basis automático:** El usuario no tiene que adivinar qué precio poner en una transferencia.

### Negativas

- **Nuevo componente a mantener:** `PortfolioPicker` y `CoinPicker` coexisten. Riesgo de divergencia visual. Ambas barras de búsqueda deben mantenerse sincronizadas en UX.
- **Transfer requiere caleta destino obligatoria:** Añade fricción al flujo.
- **Network fee es un campo más en Transfer:** Añade complejidad al formulario.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Mantener CoinPicker + validación post-selección** | El usuario descubre el error solo al hacer submit. Peor UX. |
| **Un solo picker con toggle API/localStorage** | Viola el principio de responsabilidad única. |
| **Mostrar price en Transfer con cost basis pre-poblado editable** | Añade complejidad innecesaria. El cost basis automático es transparente para el usuario. |

## Relación con ADRs Existentes

- **ADR-002** (Arquitectura sin framework): Sigue el patrón función pura → string HTML + `init*` para event wiring.
- **ADR-018** (Rate Limit CoinGecko): Elimina llamadas API en Sell/Transfer.
- **ADR-024** (Transfer doble entrada): La caleta destino se usa para generar las dos entradas `transfer_out`/`transfer_in`.
- **ADR-025** (transactionUtils): `getPortfolioCoins(source)` y `getAverageCostBasis(coinId, source)` son dependencias directas.

---
*Última actualización: 2026-06-24*
