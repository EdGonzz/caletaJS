# ADR-023: PortfolioPicker — Selector desde localStorage para Sell y Transfer

- **Estado:** Aceptada
- **Fecha:** 2026-06-21
- **Contexto:** El flujo de Sell y Transfer en `AddAssetModal` usaba `CoinPicker` (búsqueda en CoinGecko API), lo que permitía registrar ventas o transferencias de monedas que el usuario no posee, generando balances negativos y entradas fantasma en el portafolio.

## Contexto

El `AddAssetModal` implementa tres tabs de transacción: **Buy**, **Sell** y **Transfer**. Hasta este cambio, los tres tabs compartían el mismo componente `CoinPicker`, que busca monedas directamente en la API de CoinGecko. Esto introduce un problema semántico fundamental:

- Un usuario puede buscar "Solana" en el picker, registrar una **venta** de 10 SOL, aunque su balance neto de SOL sea 0.
- El resultado es un balance neto negativo que hace desaparecer la moneda de la tabla (filtrada por `balance > 0` en `HoldingsTable.js:74`).
- No existe ninguna advertencia ni bloqueo — la operación se guarda silenciosamente.

El mismo problema aplica a **Transfer**: sin picker de portafolio, el usuario puede "transferir" monedas que no tiene.

Adicionalmente, el tab **Transfer** no tenía un campo de caleta de destino, haciendo semánticamente equivalente a un Buy (solo sumaba balance sin registrar el origen real).

## Decisión

Se reemplaza el `CoinPicker` (API) por un nuevo componente `PortfolioPicker` (localStorage) **únicamente para los tabs Sell y Transfer**. El tab Buy sigue usando `CoinPicker` con búsqueda en la API.

### Arquitectura del PortfolioPicker

```
src/components/PortfolioPicker.js
  ├── PortfolioOption(coin, selectedCoinId) → string   # Fila con balance disponible
  ├── PortfolioPicker(selectedCoinId) → string          # Shell del view
  └── initPortfolioPicker({ onBack, onClose, onSelect }) # Event wiring
```

El componente lee `getPortfolioCoins()` de `transactionUtils.js`, que agrupa holdings por `coinId`, calcula el balance neto (buy+transfer − sell) y descarta monedas con balance ≤ 0. Cada opción muestra el **balance disponible** para que el usuario sepa cuánto puede vender.

### Bifurcación en `renderInner()` de AddAssetModal

```javascript
} else if (currentView === 'coin') {
  if (activeTab === 'buy') {
    // CoinPicker — API de CoinGecko (sin cambios)
  } else {
    // Sell / Transfer → PortfolioPicker — localStorage
    inner.innerHTML = PortfolioPicker(selectedCoin.id);
    initPortfolioPicker({ onBack, onClose, onSelect });
  }
```

El mismo espacio visual, la misma interfaz de callbacks (`onBack`, `onClose`, `onSelect`) — solo cambia la data source.

### Transfer con campo de destino

Al activar el tab Transfer, `FormView()` renderiza condicionalmente un campo adicional **"Caleta Destino"**:

```javascript
${activeTab === 'transfer' ? `
  <div class="space-y-2">
    <label ...>Caleta Destino</label>
    <button id="destination-exchange-btn" ...>
      ${destinationExchange?.name ?? 'Seleccionar destino'}
    </button>
  </div>
` : ''}
```

El botón abre una vista `destination-exchange` que reutiliza el componente `SelectExchange` pero escribe en `destinationExchange` (variable de estado separada de `selectedExchange`).

## Consecuencias

### Positivas

- **Integridad de datos garantizada:** Es imposible vender o transferir una moneda que no existe en el portafolio. El picker solo muestra opciones con balance neto > 0.
- **UX más informativa:** El usuario ve directamente cuánto tiene disponible de cada moneda antes de elegirla.
- **Sin llamadas API en Sell/Transfer:** Elimina una petición a CoinGecko en cada apertura del picker para estos dos tabs, reduciendo la presión sobre el rate-limit (ADR-018).
- **Semántica correcta de Transfer:** Al forzar la selección de caleta destino, el historial refleja fielmente el movimiento de una caleta a otra.
- **Consistencia visual:** Mismo espacio, mismo patrón back/close/select que `CoinPicker`. El cambio es invisible para el usuario.

### Negativas

- **Nuevo componente a mantener:** `PortfolioPicker` y `CoinPicker` coexisten con APIs similares pero distintas data sources. Riesgo de divergencia visual si se actualiza uno y no el otro.
- **Transfer requiere caleta destino obligatoria:** Añade fricción al flujo. Antes, Transfer era idéntico a Buy en un click.
- **Sin búsqueda en PortfolioPicker:** El picker muestra todas las monedas del portafolio sin filtro de texto. Con portfolios grandes (>20 monedas) puede ser difícil de navegar. Se acepta como trade-off del MVP.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Mantener CoinPicker + validación de overselling post-selección** | La validación ocurre al hacer submit, no al seleccionar. El usuario puede navegar por la búsqueda de API y seleccionar monedas que no tiene, descubriendo el error solo al final. Peor UX. |
| **Deshabilitar botones de coins sin balance en CoinPicker** | Requiere cruzar resultados de API con localStorage en tiempo real durante la búsqueda (cada keystroke). Complejidad alta sin beneficio sobre el picker local. |
| **Un solo picker con toggle API/localStorage** | Complica el componente `CoinPicker` con lógica bifurcada. Viola el principio de responsabilidad única. |
| **Modal de edición separado (EditTransactionModal)** | Se evaluó para la funcionalidad de "cambiar caleta de una transacción existente". Se decidió que el flujo de Transfer con destino cubre este caso de uso más frecuente. Un EditTransactionModal queda como mejora futura. |

## Relación con ADRs Existentes

- **ADR-002** (Arquitectura sin framework): `PortfolioPicker` sigue el mismo patrón de función pura que retorna HTML string + `init*` separado para event wiring.
- **ADR-018** (Rate Limit CoinGecko): La eliminación de llamadas API en Sell/Transfer reduce la frecuencia de peticiones, aliviando la presión sobre el rate-limit.
- **ADR-024** (Transfer doble entrada): Decision directamente relacionada — la caleta destino del Transfer se usa para generar las dos entradas atómicas documentadas en ADR-024.

---
*Última actualización: 2026-06-21*
