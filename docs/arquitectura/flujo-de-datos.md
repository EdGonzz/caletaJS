# Flujo de Datos y Estado

CaletaJS mantiene un flujo de datos en su mayoría unidireccional y sin gestión global del estado, apoyándose en la re-evaluación del HTML y APIs del navegador como LocalStorage para el estado persistente.

## Diagramas de Flujo

### 1. Búsqueda de Criptomonedas
```mermaid
sequenceDiagram
    participant User as Usuario
    participant UI as AddAssetModal
    participant Router as Utils (Router/Debounce)
    participant API as getCoin.js (CoinGecko)
    
    User->>UI: Escribe en campo de búsqueda
    UI->>Router: Dispara evento 'input'
    Router->>Router: Aplica debounce (300ms)
    Router->>API: Llama a searchCoins(query)
    API->>API: fetch() a CoinGecko /search
    API-->>Router: Responde JSON con resultados
    Router-->>UI: Actualiza DOM (innerHTML con resultados)
    UI-->>User: Muestra lista interactiva de activos
```

### 2. Filtrado por Caleta (Inter-componente)
```mermaid
sequenceDiagram
    participant User as Usuario
    participant Toolbar as ActionToolbar
    participant window as Global Object (window)
    participant Tables as StatsGrid / HoldingsTable
    
    User->>Toolbar: Clic en botón "Binance"
    Toolbar->>Toolbar: Marca botón como "active"
    Toolbar->>window: Emite 'caleta-filter-changed' { detail: 'binance' }
    window->>Tables: Notifica a subscriptores del evento
    Tables->>Tables: Lee localStorage y filtra por 'binance'
    Tables->>Tables: Re-renderiza HTML interno
    Tables-->>User: Actualiza balance y lista segmentada
```

### 3. Carga de Datos del Portafolio (HoldingsTable → StatsGrid)
```mermaid
sequenceDiagram
    participant Router as routes.js
    participant HT as HoldingsTable
    participant LS as localStorage
    participant API as CoinGecko /coins/markets
    participant Window as window (evento)
    participant SG as StatsGrid
    
    Router->>HT: initHoldingsTable()
    HT->>LS: getHoldings()
    LS-->>HT: Transacciones crudas
    HT->>HT: aggregateHoldings(transacciones, filtro)
    HT->>API: fetch(markets?ids=bitcoin,ethereum...)
    API-->>HT: Precios actuales + change24h
    HT->>HT: Combina datos locales con precios API
    HT->>Window: dispatchEvent('prices-updated', { holdings })
    Window-->>SG: Recibe evento
    SG->>SG: Re-renderiza tarjetas de estadísticas
```

### 4. HistoryChart (Async — CoinGecko /market_chart)
```mermaid
sequenceDiagram
    participant Router as routes.js
    participant HC as HistoryChart
    participant CDA as chartDataAdapter.js
    participant GH as getCoinHistory.js
    participant API as CoinGecko /coins/{id}/market_chart
    
    Router->>HC: initHistoryChart()
    HC->>HC: Muestra loading spinner
    HC->>CDA: buildPortfolioHistorySeries(30)
    CDA->>CDA: getAggregatedHoldings() — lee localStorage
    CDA->>GH: getCoinHistory(bitcoin, 30)
    CDA->>GH: getCoinHistory(ethereum, 30)
    Note over CDA,GH: Promise.all — 1 llamada por coinId única
    GH->>API: fetch(/market_chart?vs_currency=usd&days=30)
    API-->>GH: [[timestamp, price], ...]
    GH-->>CDA: { time: "YYYY-MM-DD", value: price }[]
    CDA->>CDA: portfolioValue[día] = Σ(amount × price[día])
    CDA-->>HC: Serie histórica ordenada
    HC->>HC: container.innerHTML = "" // limpia loading state
    HC->>HC: createChart() + addSeries(AreaSeries) + setData()
    HC-->>Router: Gráfico renderizado
    
    Note over HC: Usuario cambia período
    HC->>HC: cleanupHistoryChart() — aborta peticiones y destruye chart previo
    HC->>CDA: buildPortfolioHistorySeries(nuevosDías)
    CDA-->>HC: Nueva serie
    HC->>HC: _series.setData(nuevaSerie)
```

### 5. AllocationDonut (Síncrono — localStorage)
```mermaid
sequenceDiagram
    participant Router as routes.js
    participant AD as AllocationDonut
    participant CDA as chartDataAdapter.js
    participant LS as localStorage
    
    Router->>AD: initAllocationDonut()
    AD->>CDA: buildAllocationData()
    CDA->>CDA: getAggregatedHoldings() — lee localStorage
    CDA->>CDA: Calcula pct = (value / totalValue) × 100
    CDA-->>AD: [{ coinId, name, symbol, pct, value }]
    AD->>AD: Calcula stroke-dasharray/dashoffset SVG
    AD->>AD: Renderiza donut + leyenda
    
    Note over AD: Sin llamadas API — usa precios de localStorage
```

### 6. Navegación SPA — Cleanup
```mermaid
sequenceDiagram
    participant Router as routes.js
    participant HC as HistoryChart
    
    Note over Router: Usuario navega a otra ruta
    Router->>HC: cleanupHistoryChart()
    HC->>HC: _abortController?.abort()
    HC->>HC: _chart?.remove() — limpia DOM
    HC->>HC: _chart = null, _series = null
    Note over HC: Previene memory leaks
```

## Gestión del Estado

No existe un "Store" global (como Redux o Zustand). El estado se divide en dos categorías:

### 1. Estado de UI (Efímero)
Se gestiona localmente dentro de las funciones inicializadoras (`init*`) a través de variables en los cierres (closures) de las funciones.
- **Ejemplo:** Paginación en `HoldingsTable.js`. El componente usa `data-attributes` en el DOM (`data-current-page`) para almacenar el estado y regenerar únicamente el cuerpo de la tabla (`tbody.innerHTML`) tras hacer clic en un control.

### 2. Estado Persistente
Se guarda utilizando el wrapper `storage.js` sobre `localStorage` nativo.

| Variable | Tipo | Propósito | Localización |
|---|---|---|---|
| `caleta_user_sources` | Array de Objetos | Mantiene la lista de "sources" de activos configurados por el usuario. | `src/utils/sources.js` |
| `caleta_holdings` | Array de Objetos | Almacena el historial de transacciones (compras/ventas/fuentes). | `src/utils/holdingsStorage.js` |

## Lógica de Consumo de APIs

Los datos remotos (CoinGecko) se solicitan a través de los helpers en `src/utils/` (`getCoin.js`, `getExchange.js`, `getCoinHistory.js`).

Las funciones están estructuradas para atrapar errores y retornar estados consistentes o *defaults* vacíos si el fetch falla, garantizando que los inicializadores puedan continuar y renderizar esqueletos o mensajes de error sin romper la aplicación.

### Endpoints de CoinGecko Utilizados

| Endpoint | Utilidad | Propósito | Frecuencia |
|---|---|---|---|
| `/search?query=` | `getCoin.js` | Búsqueda de monedas en AddAssetModal | On-demand (debounced 300ms) |
| `/exchanges` | `getExchange.js` | Lista de exchanges disponibles | On-demand (al abrir modal) |
| `/coins/markets?ids=` | `HoldingsTable.js` | Precios actuales + change24h + sparkline | Al cargar `/` y al refresh manual |
| `/coins/{id}/market_chart` | `getCoinHistory.js` | Historial de precios para HistoryChart | Al cargar `/` y al cambiar período |

### Patrón de Comunicación entre Componentes

```
HoldingsTable (productor)
    │
    ├── CustomEvent: 'prices-updated' → { detail: { holdings } }
    │       └── StatsGrid (consumidor) — re-renderiza tarjetas
    │
    └── CustomEvent: 'caleta-filter-changed' → { detail: { source } }
            └── HoldingsTable (auto-consumidor) — re-filtra datos

HistoryChart (productor y consumidor propio)
    ├── Lee localStorage vía chartDataAdapter.getAggregatedHoldings()
    ├── Llama /market_chart por cada coinId
    └── AbortController cancela peticiones anteriores al cambiar período

AllocationDonut (consumidor pasivo)
    ├── Lee localStorage vía chartDataAdapter.buildAllocationData()
    └── Sin llamadas API — usa precios almacenados en holdings
```

---
*Última actualización: 2026-05-23*

### 7. HMR — Hot Module Replacement (Vanilla JS)
```mermaid
sequenceDiagram
    participant WDS as webpack-dev-server
    participant HC as HistoryChart.js
    
    WDS->>HC: module.hot.dispose()
    HC->>HC: cleanupHistoryChart() — aborta peticiones, destruye chart
    WDS->>HC: module.hot.accept()
    Note over HC: El router re-inicializará en el próximo ciclo
```

> **Nota:** En vanilla JS (sin React Refresh), cada módulo debe aceptar explícitamente sus propias actualizaciones. `HistoryChart.js` mantiene referencias al DOM y estado interno de Lightweight Charts, por lo que requiere cleanup explícito antes de la recarga en caliente.

