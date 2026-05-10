# ADR-012: Sistema de Filtrado Dinámico por Caletas

- **Estado:** Aceptada
- **Fecha:** 2026-05-09
- **Contexto:** El usuario necesitaba una forma de visualizar sus inversiones segmentadas por "Caleta" (exchange/wallet) sin perder la vista consolidada ("Overview"). Dado que la aplicación no utiliza frameworks reactivos, el filtrado debe manejarse mediante manipulación directa del DOM y eventos.

## Contexto
Originalmente, la aplicación mostraba todos los activos en una única vista. Con la introducción de múltiples fuentes de datos (Binance, Coinbase, etc.), se volvió necesario implementar un mecanismo para:
1. Listar dinámicamente las caletas del usuario en la interfaz.
2. Filtrar los componentes `HoldingsTable` y `StatsGrid` según la caleta seleccionada.
3. Permitir añadir nuevas caletas y que el menú se actualice sin recargar la página completa.

## Decisión
Se implementó un sistema de comunicación desacoplado basado en **CustomEvents** del navegador:

1. **Emisor (`ActionToolbar.js`):** Gestiona el estado visual de las pestañas. Al cambiar de filtro, dispara un evento personalizado `caleta-filter-changed` con el `sourceId` en el `detail`.
2. **Receptores (`HoldingsTable.js`, `StatsGrid.js`):** Escuchan el evento en `window` y ejecutan su lógica de re-renderizado (`init*`) filtrando los datos obtenidos de `localStorage`.
3. **Persistencia:** Las caletas se almacenan en la clave `caleta_user_sources` y las transacciones en `caleta_holdings`. El componente `ActionToolbar` se inicializa leyendo estas fuentes para generar los botones dinámicamente.
4. **Reactividad Manual:** Cuando se añade una nueva caleta mediante el modal, se vuelve a ejecutar `initActionToolbar()` para inyectar los nuevos botones en el DOM y refrescar los listeners.

## Consecuencias

### Positivas
- **Desacoplamiento:** Los componentes no necesitan conocerse entre sí; solo necesitan conocer el nombre del evento.
- **Rendimiento:** Solo se re-renderizan los componentes que reaccionan al filtro.
- **Flexibilidad:** Es fácil añadir nuevos componentes que reaccionen al filtrado (ej. gráficos de historial).

### Negativas
- **Mantenimiento manual:** Al usar `innerHTML` para el ActionToolbar, hay que ser cuidadoso con la gestión de listeners para evitar memory leaks o botones "muertos".
- **Estado Disperso:** El estado del filtro actual vive en el DOM (clase `active`) y en la lógica del closure de `initActionToolbar`.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| Pasar callbacks por props | Complejo de implementar en una arquitectura de strings y templates sin un sistema de renderizado centralizado. |
| Recarga de página | Experiencia de usuario (UX) deficiente y pérdida de estado efímero. |
| Global State Object | Se consideró, pero el sistema de eventos nativos es más ligero para las necesidades actuales de la SPA. |

Última actualización: 2026-05-09
