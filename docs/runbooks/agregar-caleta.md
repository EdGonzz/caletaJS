# Guía: Cómo agregar una nueva Caleta (Exchange)

Este runbook detalla el proceso técnico y de usuario para integrar una nueva fuente de datos (Caleta) en la aplicación.

## 1. Flujo de Usuario
1. En la pantalla principal, localizar el **ActionToolbar** (debajo del balance principal).
2. Hacer clic en el botón **"Add Wallet"**.
3. Se abrirá el modal `AddExchangeModal`.
4. Buscar el nombre del exchange (ej. "Binance", "Kraken") mediante el campo de búsqueda conectado a la API de CoinGecko.
5. Seleccionar el resultado correcto.
6. Opcionalmente, añadir una descripción personalizada.
7. Confirmar para guardar.

## 2. Flujo Técnico (Interno)

### Paso A: Búsqueda y Selección
- El modal utiliza `getExchange.js` para consultar el endpoint `/exchanges` de CoinGecko.
- Al seleccionar un exchange, se capturan los siguientes datos:
  - `id`: Identificador único de CoinGecko.
  - `name`: Nombre oficial.
  - `image`: URL del logo.

### Paso B: Persistencia
Los datos se guardan en `localStorage` mediante `storage.js` en la clave `caleta_user_sources`.
```javascript
// Formato de almacenamiento
{
  id: "binance",
  name: "Binance",
  image: "https://...",
  description: "Mi cuenta principal"
}
```

### Paso C: Actualización de Interfaz
- Tras guardar exitosamente, el modal cierra y se ejecuta `initActionToolbar()`.
- Esta función lee el array actualizado de `caleta_user_sources` y genera un nuevo botón en el DOM.
- El nuevo botón hereda automáticamente la capacidad de filtrar la vista al hacer clic.

## 3. Resolución de Problemas

### El exchange no aparece en la búsqueda
- Verifique que el nombre coincida exactamente con el directorio de [CoinGecko Exchanges](https://www.coingecko.com/en/exchanges).
- La búsqueda es sensible a términos genéricos; intente ser específico.

### El botón en el Toolbar no aparece tras guardar
- Esto suele indicar un fallo en la re-inicialización del componente. Intente recargar la página (`F5`). Si el problema persiste, verifique en la consola del desarrollador si hay errores de cuota de `localStorage`.

---
*Última actualización: 2026-05-09*
