# ADR-031: Mantenimiento de Refresco Manual de Precios y Descarte de Polling Automático

- **Estado:** Aceptada (decisión arquitectónica de preservar el refresh manual exclusivo y rechazar la propuesta de auto-update por polling periódico)
- **Fecha:** 2026-10-22
- **Contexto:** Se evaluó la implementación de un auto-update periódico (polling vía `setInterval` cada 60s) para actualizar los precios del portafolio en tiempo real. Debido a las limitaciones de cuota del plan Demo de CoinGecko y el riesgo crítico de rate limiting (HTTP 429), se decide no implementar polling automático y mantener el flujo de refresco manual con cooldown progresivo ya operativo.

---

## Contexto

La planificación original del proyecto contemplaba una tarea para refrescar automáticamente los precios de mercado en segundo plano utilizando un intervalo de 60 segundos (`setInterval(..., 60000)`).

CaletaJS es una SPA que opera directamente desde el navegador del cliente sin backend intermedio (zero-backend proxy). Todas las peticiones HTTP hacia CoinGecko se ejecutan desde el navegador del usuario utilizando la cabecera `x-cg-demo-api-key`. 

El plan Demo/Free de CoinGecko impone restricciones severas de consumo:
- Límite de ráfaga: **30 peticiones por minuto**.
- Límite mensual: cuota reducida para tiers Demo/gratuitos.

### Impacto de un Polling de 60 Segundos

Si se ejecutara un polling automático fijo cada 60 segundos por pestaña activa:
- **1 pestaña abierta durante 8 horas** = 60 peticiones/hora × 8 horas = **480 peticiones/día**.
- En un mes de uso regular (~20 días laborales), una sola pestaña generaría **~9.600 llamadas a la API**.
- Múltiples pestañas abiertas o usuarios activos agotarían la cuota mensual en cuestión de días o provocarían bloqueos inmediatos por HTTP 429 (*Too Many Requests*), degradando severamente la experiencia de usuario (ver [ADR-018: Rate Limit de CoinGecko y Estrategias de Caché](file:///home/edgonz/Projects/labs/caleta/docs/decisions/018-rate-limit-coingecko-caching.md)).

### Mecanismo Actual Verificado en Código

El sistema ya cuenta con un flujo completo de actualización manual con mitigaciones activas:

1. **Disparo Manual y Cooldown:**
   - En [`src/components/ActionToolbar.js`](file:///home/edgonz/Projects/labs/caleta/src/components/ActionToolbar.js), el botón `#refresh-prices-btn` valida que no exista un fetch en curso (`_isFetching`) ni un cooldown activo (`_cooldownEndTime`).
   - Al presionarlo, transiciona el botón a estado `'loading'` y despacha el evento:
     ```javascript
     window.dispatchEvent(new CustomEvent('request-prices-refresh', { detail: { manual: true } }));
     ```
   - Posee una máquina de estados de cooldown con escala exponencial definida en `const COOLDOWNS = [60, 120, 300, 600]`: tras cada refresco manual exitoso, `_cooldownLevel` escala progresivamente (60s → 120s → 300s → 600s), reduciendo drásticamente la frecuencia máxima de peticiones.

2. **Consulta y Manejo de Precios:**
   - En [`src/components/HoldingsTable.js`](file:///home/edgonz/Projects/labs/caleta/src/components/HoldingsTable.js), el listener `_refreshRequestedHandler` recibe el evento y ejecuta `fetchPricesAndUpdate(isManual)`.
   - Consulta el endpoint `/coins/markets?vs_currency=usd&ids=${coinIds}&sparkline=true` usando `apiFetch()`.
   - Si la consulta falla (ej. error 429 de `ApiError`), activa fallback a precios guardados, muestra una advertencia visual (`showWarning`), y despacha `prices-update-failed` con `{ detail: { isManual } }`.
   - Si la consulta tiene éxito, actualiza la tabla y despacha:
     ```javascript
     window.dispatchEvent(new CustomEvent('prices-updated', {
       detail: { holdings: apiData, usingCachedPrices, isManual, fetchFailed }
     }));
     ```

3. **Propagación y Feedback al Usuario:**
   - [`src/components/StatsGrid.js`](file:///home/edgonz/Projects/labs/caleta/src/components/StatsGrid.js) y [`src/components/AllocationDonut.js`](file:///home/edgonz/Projects/labs/caleta/src/components/AllocationDonut.js) escuchan `prices-updated` para recalcular totales y re-renderizar el gráfico de distribución.
   - [`src/components/ActionToolbar.js`](file:///home/edgonz/Projects/labs/caleta/src/components/ActionToolbar.js) escucha `prices-updated`, establece el cooldown (`_cooldownEndTime = _lastFetchTimestamp + cooldownDuration`) y actualiza el timestamp relativo ("hace un momento", "hace X min") usando un timer ligero de UI de 1s (`_tickInterval = setInterval(_updateTimestampDisplay, 1000)`).
   - **Carga inicial:** Al montar la vista, [`src/components/HoldingsTable.js`](file:///home/edgonz/Projects/labs/caleta/src/components/HoldingsTable.js) ejecuta automáticamente `fetchPricesAndUpdate(false)` (`isManual: false`), lo que hidrata los precios iniciales sin penalizar al usuario con cooldown.

---

## Alternativas Consideradas

| Alternativa | Costo Estimado de API | Experiencia de Usuario (UX) | Veredicto |
|---|---|---|---|
| **1. Polling fijo cada 60s** (`setInterval`) | **Crítico** (~60 req/hora por pestaña; ~480 en jornada de 8h). Agotamiento rápido de cuota. | Datos siempre frescos mientras no se agote la cuota; falla estruendosa (errores 429 continuos) al alcanzar el límite. | **Rechazada**. Inviable con el plan Demo de CoinGecko y arquitectura sin backend. |
| **2. Polling condicionado a pestaña visible** (`visibilitychange` / `document.hidden`) | **Alto** (~60 req/hora activa). Evita consumo en segundo plano, pero sigue saturando durante lectura activa. | Buena si el usuario no tiene la pestaña activa mucho tiempo; propensa a 429 durante sesiones de estudio prolongadas. | **Rechazada**. Mitiga el problema de pestañas olvidadas pero no resuelve el consumo desmedido en sesiones activas. |
| **3. Polling con intervalo largo** (5 a 15 minutos) | **Moderado** (4 a 12 req/hora por pestaña). Consumo mensual residual constante. | No ofrece sensación real de "tiempo real" y aún genera peticiones no solicitadas que gastan cuota sin intención del usuario. | **Rechazada**. Añade complejidad de timers en background sin satisfacer la necesidad de datos en vivo. |
| **4. Refresh al recuperar foco** (`focus` / `visibilitychange`) | **Variable / Impredecible**. Ráfagas de peticiones si el usuario alterna frecuentemente entre ventanas o pestañas. | Puede interrumpir la interacción del usuario refrescando la tabla inesperadamente en cada cambio de ventana. | **Rechazada**. Comportamiento errático y propenso a colisionar con los cooldowns manuales. |
| **5. Solo refresh manual con cooldown progresivo** *(Estado actual)* | **Controlado y Mínimo**. Consumo directo a demanda; estrictamente acotado por los escalones de 60s, 120s, 300s y 600s. | Transparente: el usuario decide cuándo gastar cuota; feedback explícito de tiempo transcurrido y badges de caché. | **Aceptada**. Preserva la cuota, protege la IP del usuario y mantiene la simplicidad client-side. |

---

## Decisión

1. **No implementar auto-update periódico (`setInterval`) ni polling en segundo plano** para la actualización de precios de CoinGecko.
2. **Mantener como estándar definitivo el esquema de actualización manual a demanda** controlado desde `ActionToolbar` y ejecutado por `HoldingsTable`.
3. **Preservar el escalamiento de cooldowns (`COOLDOWNS = [60, 120, 300, 600]`)** para proteger al usuario de bloqueos por rate limiting accidental.
4. **Cerrar formalmente la tarea de "Auto-Update" en Notion** con estado *No implementada / Archivada*, documentando este ADR como fundamento técnico.

---

## Consecuencias

### Positivas
- **Protección integral de cuota:** Se elimina por completo el riesgo de agotar la cuota mensual de CoinGecko por pestañas desatendidas.
- **Prevención de Rate Limiting (HTTP 429):** Se respeta estrictamente la política delineada en [ADR-018](file:///home/edgonz/Projects/labs/caleta/docs/decisions/018-rate-limit-coingecko-caching.md).
- **Eficiencia y rendimiento:** Cero consumo de CPU, batería o datos móviles por temporizadores de red en segundo plano.
- **Simplicidad arquitectónica:** No se requiere gestionar ciclo de vida de intervalos de red (`clearInterval`), detección de visibilidad ni carreras asíncronas entre el polling y los clicks del usuario.

### Negativas / Mitigaciones
- **Datos no continuos en pantalla:** Si el usuario mantiene la aplicación abierta sin interactuar, los precios permanecerán congelados en el último valor obtenido.
  - *Mitigación:* Se provee feedback visual permanente en `ActionToolbar` mediante el indicador de tiempo relativo ("hace X min") para que el usuario sea plenamente consciente de la antigüedad de los datos. Adicionalmente, `HoldingsTable` muestra el badge `holdings-cached-badge` si los precios provienen de almacenamiento local o hubo fallos de red.

### Requisitos para Retomar esta Funcionalidad en el Futuro
Si en el futuro se requiriese auto-update de precios en tiempo real, no debe implementarse mediante llamadas directas cliente-servidor hacia CoinGecko. Sería mandatorio incorporar previamente:
1. **Proxy Serverless con Caché Compartida:** Un backend o función serverless (ej. Vercel Serverless Function + KV/Redis, según lo proyectado en `temp/plan-api-proxy-vercel.md`) que consulte a CoinGecko una sola vez cada N minutos de manera centralizada.
2. **Distribución a Clientes:** Los navegadores consultarían la caché del proxy interno, desacoplando la cantidad de usuarios y pestañas del consumo de la cuota de la API externa.

---

## Referencias

- [ADR-006: Migración de API de Precios a CoinGecko](file:///home/edgonz/Projects/labs/caleta/docs/decisions/006-migracion-api-coingecko.md)
- [ADR-018: Deuda Técnica — Rate Limit de CoinGecko y Estrategias de Caché](file:///home/edgonz/Projects/labs/caleta/docs/decisions/018-rate-limit-coingecko-caching.md)
- Componente de toolbar y cooldown: [`src/components/ActionToolbar.js`](file:///home/edgonz/Projects/labs/caleta/src/components/ActionToolbar.js)
- Componente de obtención y despacho de precios: [`src/components/HoldingsTable.js`](file:///home/edgonz/Projects/labs/caleta/src/components/HoldingsTable.js)
- Enrutador y orquestación de eventos: [`src/router/routes.js`](file:///home/edgonz/Projects/labs/caleta/src/router/routes.js)

---
*Última actualización: 2026-10-22*
