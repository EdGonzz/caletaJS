# Flujo de Datos

> Última actualización: 2026-04-15

## Fuentes de Datos

| Fuente | Tipo | Uso |
|---|---|---|
| CoinGecko API | Externa (REST) | Buscar monedas (`/search`), listar top monedas (`/coins/markets`), buscar exchanges (`/exchanges`) |
| `localStorage` | Local (navegador) | Persistir caletas/exchanges del usuario (`caleta_user_sources`) |
| `holdingsData.js` | Estático (mock) | Datos provisionales para la tabla de holdings |
| `.env` | Compilación | Claves API y URL base inyectadas vía `dotenv-webpack` |

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
        helpers["helpers.js"]
        holdings["holdingsData.js"]
    end

    subgraph Componentes
        AddAsset["AddAssetModal"]
        AddExchange["AddExchangeModal"]
        CoinPicker["CoinPicker"]
        SelectEx["SelectExchange"]
        Table["HoldingsTable"]
    end

    API --> getCoin
    API --> getExchange
    LS --> sources

    getCoin --> AddAsset
    getCoin --> CoinPicker
    getExchange --> AddExchange
    sources --> SelectEx
    sources --> AddAsset
    sources --> AddExchange
    holdings --> Table
    formatters --> AddAsset
    formatters --> Table
    helpers --> AddExchange
```

---

## Flujos Principales

### 1. Carga Inicial (Home)

```mermaid
sequenceDiagram
    participant Browser
    participant Router
    participant Home
    participant AddAssetModal
    participant getCoin
    participant API as CoinGecko

    Browser->>Router: load / hashchange
    Router->>Home: Renderizar (importar)
    Note over AddAssetModal: Top-level await
    AddAssetModal->>getCoin: getCoin()
    getCoin->>API: GET /coins/markets?vs_currency=usd&per_page=10
    API-->>getCoin: Coin[]
    getCoin-->>AddAssetModal: coins (módulo-level)
    Home-->>Router: HTML string con todos los componentes
    Router->>DOM: innerHTML = html
    Router->>Init: initHoldingsTable() + initAddAssetModal()
```

> **Nota:** `AddAssetModal` usa top-level `await` para precargar monedas al importar el módulo. La tabla `HoldingsTable` aún usa datos mock de `holdingsData.js`.

### 2. Agregar Activo (AddAssetModal)

```mermaid
sequenceDiagram
    participant User
    participant Modal as AddAssetModal
    participant CoinPicker
    participant getCoin
    participant API as CoinGecko
    participant SelectEx as SelectExchange
    participant sources

    User->>Modal: Click "Add Funds"
    Modal-->>User: FormView (moneda precargada)

    User->>Modal: Click "Seleccionar moneda"
    Modal->>CoinPicker: CoinPicker(coins, selectedCoinId)
    CoinPicker-->>User: Lista de monedas

    User->>CoinPicker: Escribir búsqueda + Enter
    CoinPicker->>getCoin: getCoin("bitcoin")
    getCoin->>API: GET /search?query=bitcoin
    API-->>getCoin: { coins: [...] }
    getCoin-->>CoinPicker: coins[]
    CoinPicker-->>User: Lista actualizada (event delegation)

    User->>CoinPicker: Click en moneda
    CoinPicker->>Modal: onSelect(coinId)
    Modal-->>User: FormView (con moneda seleccionada)

    User->>Modal: Click "Seleccionar exchange"
    Modal->>sources: getSource()
    sources-->>Modal: exchanges[]
    Modal->>SelectEx: SelectExchange(selectedId)
    SelectEx-->>User: Lista de caletas guardadas

    User->>SelectEx: Click en exchange
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
    participant LS as localStorage

    User->>ExModal: Click "Agregar nueva caleta"
    ExModal->>getExchange: getExchange()
    getExchange->>API: GET /exchanges?per_page=15
    API-->>getExchange: exchanges[]
    getExchange-->>ExModal: exchanges[] (default list)
    ExModal-->>User: Lista de exchanges populares

    User->>ExModal: Escribir "binance"
    Note over ExModal: Skeleton loading inmediato
    Note over ExModal: debounce(500ms)
    ExModal->>getExchange: getExchange()
    getExchange->>API: GET /exchanges?per_page=15
    API-->>getExchange: exchanges[]
    Note over ExModal: Filtro local sobre la respuesta
    ExModal-->>User: Resultados filtrados

    User->>ExModal: Click "Guardar"
    ExModal-->>User: Mini-form descripción
    User->>ExModal: Escribir descripción + confirmar
    ExModal->>sources: addSource(exchange)
    sources->>LS: setItem("caleta_user_sources", [...])
    ExModal-->>User: Modal cerrado, exchange auto-seleccionado
```

---

## Estado de la Aplicación

| Dato | Ubicación | Persistencia |
|---|---|---|
| Exchanges del usuario (caletas) | `localStorage.caleta_user_sources` | ✅ Persistente |
| Monedas iniciales (top 10) | Variable módulo en `AddAssetModal.js` | ❌ En memoria (precargadas) |
| Moneda seleccionada (en modal) | Variable local del modal (`selectedCoin`) | ❌ En memoria |
| Exchange seleccionado (en modal) | Variable local del modal (`selectedExchange`) | ❌ En memoria |
| Holdings/portafolio | `holdingsData.js` (mock) | ❌ Estático |
| Resultados búsqueda exchanges | Variable local de `AddExchangeModal` | ❌ En memoria |
| Página actual de tabla | `data-current-page` en DOM + variable local | ❌ En memoria |
| Estado de formulario (qty, price, date, fees, notes) | Variables locales en `AddAssetModal` | ❌ En memoria |
| Tab activo (buy/sell/transfer) | Variable local en `AddAssetModal` (`activeTab`) | ❌ En memoria |

---

## API CoinGecko — Endpoints Usados

| Endpoint | Helper | Propósito |
|---|---|---|
| `GET /coins/markets?vs_currency=usd&per_page=10` | `getCoin.js` (sin args) | Top 10 monedas por market cap |
| `GET /search?query={q}` | `getCoin.js` (con args) | Buscar monedas por nombre/símbolo |
| `GET /exchanges?per_page=15` | `getExchange.js` (sin args) | Listar exchanges populares |
| `GET /exchanges/{id}` | `getExchange.js` (con args) | Detalle de un exchange |

### Autenticación

```javascript
headers: {
  'x-cg-demo-api-key': process.env.API_KEY,
  'Content-Type': 'application/json'
}
```

### Rate Limiting

La API pública de CoinGecko tiene un límite de **10-30 req/min**. Se aplica:

- **Debounce** en búsquedas de exchanges (500ms) con skeleton loading inmediato
- **Búsqueda de monedas por Enter** — no se dispara con cada keystroke
- **Carga única** de exchanges por defecto (al abrir el AddExchangeModal)
- **Sin polling** — datos se refrescan solo por acción del usuario
