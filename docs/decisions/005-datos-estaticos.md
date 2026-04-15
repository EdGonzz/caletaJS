# ADR-005: Datos Estáticos (Sin API Real)

- **Estado:** Parcialmente Superada (ver [ADR-006](006-migracion-api-coingecko.md))
- **Fecha:** 2026-03-01
- **Contexto:** La aplicación necesita datos de criptomonedas, exchanges y holdings del usuario para renderizar la UI.

## Contexto

Un tracker de criptomonedas real requeriría integrarse con APIs como CoinGecko, Binance, o similares. Para la fase actual (MVP / simulación), se evalúa si conectarse a una API o usar datos estáticos.

## Decisión

Se usan **datos estáticos simulados** almacenados en archivos `utils/*Data.js`. Los arrays exportados contienen los datos de criptomonedas (`coinsData.js`), exchanges (`exchangesData.js`) y holdings del usuario (`holdingsData.js`).

No hay llamadas a APIs externas en la versión actual.

## Consecuencias

### Positivas
- Desarrollo frontend desacoplado de un backend
- Sin costos de API ni rate limits
- Sin latencia de red en desarrollo
- Permite UI completa sin infraestructura de backend

### Negativas
- Datos no reflejan precios reales en tiempo real
- No hay persistencia — los cambios (ej. agregar transacción) no se guardan
- El modal "Add Transaction" cierra pero no persiste los datos

## Alternativas Consideradas

| Alternativa              | Razón de descarte                                                   |
|--------------------------|---------------------------------------------------------------------|
| CoinGecko API (free)     | Suficiente para MVP, pero añade complejidad y rate limits           |
| Backend propio (Node.js) | Over-engineering para la fase actual del proyecto                   |
| LocalStorage             | Viable para persistencia ligera; pendiente de implementación        |
| Firebase / Supabase      | Exceso de complejidad para tracker simulado                         |

> **Próximo paso sugerido:** Integrar `localStorage` para persistir las transacciones del modal una vez que `AddAssetModal` tenga el flujo de submit completo.
