# ADR-006: Migración a API CoinGecko + localStorage

- **Estado:** Aceptada
- **Fecha:** 2026-04-12
- **Autores:** Edwin Contreras

## Contexto

Anteriormente, los componentes `SelectExchange` y `AddAssetModal` usaban datos estáticos (`coinsData.js`, `exchangesData.js`) para renderizar listas de monedas y exchanges. Esto limitaba la experiencia del usuario a un conjunto fijo y hardcodeado de opciones.

## Decisión

Migrar a un modelo dinámico:

1. **Monedas** → API de CoinGecko (`/search?query=`) vía `getCoin.js`
2. **Exchanges** → API de CoinGecko (`/exchanges`) vía `getExchange.js`
3. **Caletas del usuario** → `localStorage` vía `sources.js` (`getSource`/`addSource`)

Se eliminaron los archivos `coinsData.js` y `exchangesData.js`.

## Consecuencias

### Positivas

- Datos siempre actualizados (miles de monedas/exchanges disponibles)
- El usuario puede agregar cualquier exchange real a sus caletas
- Persistencia de caletas entre sesiones vía `localStorage`

### Negativas

- Dependencia de la API pública de CoinGecko (rate limits, downtime)
- Necesidad de skeleton loading y manejo de estados de error
- Sin conexión = sin nuevas búsquedas (caletas existentes aún accesibles desde localStorage)

### Mitigaciones

- Retorno de arrays vacíos en caso de error (graceful degradation)
- Skeleton loading compartido (`skeletonRow.js`) para UX consistente
- Debounce en búsquedas para respetar rate limits
- `holdingsData.js` se mantiene como mock data provisional hasta implementar persistencia completa

## Archivos Afectados

- ~~`src/utils/coinsData.js`~~ → Eliminado
- ~~`src/utils/exchangesData.js`~~ → Eliminado
- `src/utils/getCoin.js` → Nuevo (API helper)
- `src/utils/getExchange.js` → Nuevo (API helper)
- `src/utils/sources.js` → Nuevo (localStorage helper)
- `src/utils/skeletonRow.js` → Nuevo (UI helper compartido)
- `src/components/SelectExchange.js` → Refactorizado (usa sources.js)
- `src/components/AddExchangeModal.js` → Nuevo
- `src/components/AddAssetModal.js` → Refactorizado (usa getCoin.js)
