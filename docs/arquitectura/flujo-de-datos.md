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

### 7. Manejo de Errores — Flujo Tipado con ApiError

```mermaid
sequenceDiagram
    participant API as CoinGecko API
    participant AF as apiFetch (errors.js)
    participant UTIL as getCoinHistory / getCoin
    participant COMP as Componente UI
    participant UI as ErrorToast / ErrorPage

    API-->>AF: Error de red / HTTP 429 / 5xx
    AF->>AF: Clasifica → new ApiError(type, msg, status)
    AF-->>UTIL: throw ApiError
    UTIL-->>COMP: Propaga ApiError tipado

    alt ABORT (cancelación)
        COMP->>COMP: Ignora silenciosamente
    else NETWORK / SERVER / PARSE
        COMP->>COMP: showErrorState() con botón Reintentar
        COMP->>UI: Mensaje contextual + icono
    else RATE_LIMIT (HTTP 429)
        COMP->>COMP: showErrorState() sin botón
        COMP->>UI: "Espera unos segundos..."
    else Error de Precios (HoldingsTable)
        COMP->>COMP: Fallback a precios cacheados
        COMP->>UI: showWarning() + badge "Caché"
    else Error Crítico (Router)
        COMP->>UI: ErrorPage con botón Recargar
    end
```

### 8. Boundary Global del Router (Try-Catch)

```mermaid
sequenceDiagram
    participant Router as routes.js
    participant EP as ErrorPage

    Router->>Router: getHash() → resolveRoutes()
    Router->>Router: render(params)

    alt Éxito
        Router->>Router: init*() components
    else Error en renderizado
        Router->>EP: ErrorPage(err)
        EP->>EP: initErrorPage() — bind de botones
        EP-->>Router: Página de error renderizada
        alt ErrorPage también falla
            Router->>Router: HTML inline de emergencia
        end
    end
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

### Capa de Errores Centralizada

Todas las llamadas a la API pasan por `apiFetch()` (`src/utils/errors.js`), que actúa como wrapper sobre `fetch()` y **siempre lanza `ApiError` tipado** en caso de fallo. Esto reemplaza el patrón anterior de `try/catch` con `console.error` + retorno de defaults vacíos.

El `ApiError` clasifica cada fallo en uno de 6 tipos (`NETWORK`, `RATE_LIMIT`, `NOT_FOUND`, `SERVER`, `PARSE`, `ABORT`), permitiendo que cada componente decida cómo responder:

- **`ABORT`:** Ignorado silenciosamente (cancelación intencional vía `AbortController`)
- **`RATE_LIMIT`:** Mensaje de espera sin botón de reintento
- **`NETWORK` / `SERVER` / `PARSE`:** Estado de error con botón "Reintentar"
- **`NOT_FOUND`:** Mensaje descriptivo sin acción de recuperación

Los helpers de dominio (`getCoin`, `getCoinHistory`, `getExchange`) propagan el `ApiError` hacia los componentes, que son responsables de la presentación del error al usuario mediante `ErrorToast`, estados de error inline, o `ErrorPage` (para fallos críticos del router).

### Endpoints de CoinGecko Utilizados

| Endpoint | Utilidad | Propósito | Frecuencia | Error Handling |
|---|---|---|---|---|
| `/search?query=` | `getCoin.js` | Búsqueda de monedas en AddAssetModal | On-demand (debounced 300ms) | `CoinPicker`: mensaje contextual + botón Reintentar |
| `/exchanges` | `getExchange.js` | Lista de exchanges disponibles | On-demand (al abrir modal) | `ApiError` propagado al caller |
| `/coins/markets?ids=` | `HoldingsTable.js` | Precios actuales + change24h + sparkline | Al cargar `/` y al refresh manual | Fallback a precios cacheados + toast warning + badge "Caché" |
| `/coins/{id}/market_chart` | `getCoinHistory.js` | Historial de precios para HistoryChart | Al cargar `/` y al cambiar período | `HistoryChart`: estado de error tipado + botón Reintentar |

### Patrón de Comunicación entre Componentes

```
HoldingsTable (productor)
    │
    ├── CustomEvent: 'prices-updated' → { detail: { holdings, usingCachedPrices } }
    │       └── StatsGrid (consumidor) — re-renderiza tarjetas (con badge "Caché" si aplica)
    │
    └── CustomEvent: 'caleta-filter-changed' → { detail: { source } }
            └── HoldingsTable (auto-consumidor) — re-filtra datos

HistoryChart (productor y consumidor propio)
    ├── Lee localStorage vía chartDataAdapter.getAggregatedHoldings()
    ├── Llama /market_chart por cada coinId
    ├── AbortController cancela peticiones anteriores al cambiar período
    └── ApiError → showErrorState() con mensaje tipado + botón Reintentar

AllocationDonut (consumidor pasivo)
    ├── Lee localStorage vía chartDataAdapter.buildAllocationData()
    └── Sin llamadas API — usa precios almacenados en holdings

ErrorToast (consumidor global)
    ├── showError() / showWarning() / showSuccess() / showInfo()
    ├── Monta toasts en #app-error-toast (z-index: 9999)
    └── Auto-dismiss con animación + botón de cierre manual
```

---
*Última actualización: 2026-05-30*

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

