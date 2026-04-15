# Flujo de Datos

> Última actualización: 2026-04-14

## Fuentes de Datos

| Fuente | Tipo | Uso |
|---|---|---|
| CoinGecko API | Externa (REST) | Buscar monedas (`/search`), buscar exchanges (`/exchanges`) |
| `localStorage` | Local (navegador) | Persistir caletas/exchanges del usuario (`sources`) |
| `holdingsData.js` | Estático (mock) | Datos provisionales para la tabla de holdings |

---

## Diagrama General

```mermaid
flowchart LR
    subgraph Externo
        API["CoinGecko API"]
    end

    subgraph Navegador
        LS["localStorage"]
    end

    subgraph Utils
        getCoin["getCoin.js"]
        getExchange["getExchange.js"]
        sources["sources.js"]
        formatters["formatters.js"]
        holdings["holdingsData.js"]
    end

    subgraph Componentes
        AddAsset["AddAssetModal"]
        AddExchange["AddExchangeModal"]
        SelectEx["SelectExchange"]
        Table["HoldingsTable"]
    end

    API --> getCoin
    API --> getExchange
    LS --> sources

    getCoin --> AddAsset
    getExchange --> AddExchange
    sources --> SelectEx
    sources --> AddExchange
    holdings --> Table
    formatters --> AddAsset
    formatters --> Table
```

---

## Flujos Principales

### 1. Carga Inicial (Home)

```mermaid
sequenceDiagram
    participant Router
    participant Home
    participant HoldingsTable
    participant holdingsData

    Router->>Home: Renderizar
    Home->>holdingsData: import holdings
    Home->>HoldingsTable: HoldingsTable(holdings)
    HoldingsTable-->>Router: HTML con datos mock
    Router->>DOM: innerHTML = html
    Router->>Init: initHoldingsTable()
```

> **Nota:** Actualmente usa datos estáticos (`holdingsData.js`). Se migrará a datos reales de `localStorage` + API.

### 2. Agregar Activo (AddAssetModal)

```mermaid
sequenceDiagram
    participant User
    participant Modal as AddAssetModal
    participant getCoin
    participant API as CoinGecko
    participant SelectEx as SelectExchange
    participant sources

    User->>Modal: Abrir modal (botón +)
    Modal-->>User: FormView (vacío)

    User->>Modal: Click "Seleccionar moneda"
    Modal-->>User: CoinPickerView

    User->>Modal: Escribir búsqueda
    Modal->>getCoin: getCoin("bitcoin")
    getCoin->>API: GET /search?query=bitcoin
    API-->>getCoin: { coins: [...] }
    getCoin-->>Modal: coins[]
    Modal-->>User: Lista de monedas

    User->>Modal: Click en moneda
    Modal-->>User: FormView (con moneda seleccionada)

    User->>Modal: Click "Seleccionar exchange"
    Modal->>sources: getSource()
    sources-->>Modal: exchanges[]
    Modal-->>User: SelectExchange (lista de caletas)

    User->>Modal: Click en exchange
    Modal-->>User: FormView (completo)
```

### 3. Agregar Exchange (AddExchangeModal)

```mermaid
sequenceDiagram
    participant User
    participant ExModal as AddExchangeModal
    participant getExchange
    participant API as CoinGecko
    participant sources

    User->>ExModal: Abrir modal
    ExModal->>getExchange: getExchange()
    getExchange->>API: GET /exchanges
    API-->>getExchange: exchanges[]
    getExchange-->>ExModal: exchanges[]
    ExModal-->>User: Lista de exchanges

    User->>ExModal: Buscar "binance"
    Note over ExModal: Filtro local en la lista ya cargada

    User->>ExModal: Click en exchange
    ExModal->>sources: addSource(exchange)
    sources->>localStorage: Guardar en "sources"
    ExModal-->>User: Cerrar modal
```

---

## Estado de la Aplicación

| Dato | Ubicación | Persistencia |
|---|---|---|
| Exchanges del usuario (caletas) | `localStorage.sources` | ✅ Persistente |
| Moneda seleccionada (en modal) | Variable local del modal | ❌ En memoria |
| Exchange seleccionado (en modal) | Variable local del modal | ❌ En memoria |
| Holdings/portafolio | `holdingsData.js` (mock) | ❌ Estático |
| Resultados de búsqueda (coins) | Variable local del modal | ❌ En memoria |
| Página actual de tabla | Variable local de `initHoldingsTable` | ❌ En memoria |

---

## API CoinGecko — Endpoints Usados

| Endpoint | Helper | Propósito |
|---|---|---|
| `GET /search?query={q}` | `getCoin.js` | Buscar monedas por nombre/símbolo |
| `GET /exchanges` | `getExchange.js` | Listar exchanges disponibles |

### Rate Limiting

La API pública de CoinGecko tiene un límite de **10-30 req/min**. Se aplica:

- **Debounce** en búsquedas de monedas (300ms)
- **Carga única** de exchanges (al abrir el modal)
- **Sin polling** — datos se refrescan solo por acción del usuario
