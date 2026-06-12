# ADR-020: Sistema de Eliminación de Wallets y Activos con Modal de Confirmación

- **Estado:** Aceptada
- **Fecha:** 2026-06-12
- **Contexto:** La aplicación necesitaba permitir al usuario eliminar wallets completas (source + todas sus transacciones) y activos individuales de forma segura, con confirmación explícita antes de cualquier operación destructiva.

## Contexto

Hasta este punto, la aplicación solo permitía añadir fuentes (wallets/exchanges) y transacciones, pero no eliminarlas. Esto generaba acumulación de datos huérfanos y limitaba la gestión del portafolio. Se requería:

1. **Eliminación de wallets completas** con cascada a todas sus transacciones asociadas.
2. **Eliminación de activos individuales** con filtro contextual por fuente.
3. **Confirmación explícita** antes de cualquier operación destructiva, siguiendo el patrón de "two-step delete" para prevenir eliminaciones accidentales.
4. **Protección de `DEFAULT_SOURCE`** ("Caletas") como fuente indestructible del sistema.
5. **Accesibilidad WCAG 2.1 AA** en el modal de confirmación.

La primera iteración (PR #9) fue revertida (PR #10) por vulnerabilidades XSS al no escapar datos de usuario. La implementación final (PR #11) integró escape sistemático con `escapeHTML()` documentado en ADR-014.

## Decisión

Se implementó un sistema de eliminación en 4 capas:

### 1. Capa de Persistencia (`src/utils/holdingsStorage.js`, `src/utils/sources.js`)

Dos funciones de eliminación masiva en holdings y una en sources:

```javascript
// Elimina todas las transacciones de una fuente
deleteHoldingsBySource(sourceName)  // +38 líneas

// Elimina transacciones de una moneda, opcionalmente filtradas por fuente
deleteHoldingsByCoin(coinId, sourceFilter = null)  // +12 líneas
//  - sourceFilter = DEFAULT_SOURCE o null → elimina en TODAS las fuentes
//  - sourceFilter = "Binance" → elimina solo en Binance

// Elimina una fuente del registro (protege DEFAULT_SOURCE)
deleteSource(sourceName)  // +27 líneas
//  - Lanza Error si sourceName === DEFAULT_SOURCE
//  - Validación de caracteres peligrosos en addSource() con UNSAFE_NAME_RE
```

### 2. Capa de UI — ConfirmDeleteModal (`src/components/ConfirmDeleteModal.js`)

Componente modal de confirmación con API pública de 4 funciones:

| Función | Propósito |
|---|---|
| `openConfirmDeleteModal({ title, message, onConfirm })` | Abre el modal con validación de tipo del callback |
| `closeConfirmDeleteModal()` | Cierra, limpia callback y restaura scroll |
| `initConfirmDeleteModal()` | Registra listeners (keyboard, backdrop click, botones) |
| `cleanupConfirmDeleteModal()` | Remueve todos los listeners para evitar memory leaks |

**Patrones de accesibilidad:**
- Focus trap con Tab/Shift+Tab: el foco circula solo entre elementos focusables del modal
- Tecla Escape cierra el modal
- Click en backdrop (fuera del contenido) cierra el modal
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- Foco automático en botón "Cancelar" al abrir

**Robustez:**
```javascript
// try/finally garantiza que el modal siempre se cierra
confirmBtn.addEventListener('click', () => {
  try {
    _onConfirmCallback?.();       // Ejecuta la eliminación
  } catch (error) {
    // Notifica error al usuario sin romper el flujo
    dispatchEvent('show-error-toast', { message: getErrorMessage(error) });
  } finally {
    closeConfirmDeleteModal();    // Siempre cierra el modal
  }
});
```

### 3. Capa de Acciones — Máquina de Estados en Botones

Se implementó una máquina de estados de 2 pasos en los botones de acción para prevenir eliminaciones accidentales:

```
Estado "normal" (⋮ dots-vertical)
  → click → Estado "delete" (🗑 trash rojo)
    → click → Abre ConfirmDeleteModal → Ejecuta eliminación
```

- **Toolbar (wallets):** `data-wallet-actions` con `_walletActionsClickHandler`. Un `_globalWalletActionsCloseHandler` cierra cualquier menú abierto al hacer click fuera.
- **Tabla (activos):** `data-asset-id` con `_assetActionsClickHandler`. `resetAssetActionButtons()` cierra otros menús abiertos antes de abrir uno nuevo.
- **Mobile (dropdown):** Botón trash directo con `data-delete-wallet`, sin máquina de estados (pantalla pequeña favorece acción directa).

### 4. Capa de Orquestación — Flujo de Eliminación

**Eliminación de Wallet (`executeWalletDeletion`):**
```
Acción en toolbar → ConfirmDeleteModal → onConfirm:
  1. deleteSource(walletName)         // Elimina la fuente
  2. deleteHoldingsBySource(name)     // Elimina transacciones en cascada
  3. Si era el filtro activo → redirige a DEFAULT_SOURCE
  4. dispatch('holdings-updated')     // Refresca tabla, stats, donut
  → finally: re-renderiza toolbar
```

**Eliminación de Activo:**
```
Acción en fila → ConfirmDeleteModal → onConfirm:
  1. deleteHoldingsByCoin(coinId, activeFilter)
     - Contexto dinámico según filtro activo
  2. dispatch('holdings-updated')     // Refresca tabla
```

## Consecuencias

### Positivas
- **Seguridad XSS:** Todos los datos de usuario se escapan con `escapeHTML()` antes de inyectarse en HTML/atributos. El modal usa `textContent` (inherentemente seguro) para título y mensaje.
- **Protección anti-eliminación accidental:** La máquina de estados de 2 pasos (normal → delete → confirmar en modal) reduce drásticamente las eliminaciones no intencionadas.
- **Cascada automática:** Eliminar una wallet limpia automáticamente todas sus transacciones, sin datos huérfanos.
- **Accesibilidad:** El modal cumple WCAG 2.1 AA con focus trap, teclado completo, y atributos ARIA.
- **Robustez:** `try/finally` garantiza que el modal se cierra incluso si el callback de eliminación lanza una excepción.
- **Cleanup completo:** Cada componente exporta funciones `cleanup*()` que remueven todos los listeners, previniendo memory leaks en la SPA.

### Negativas
- **Complejidad de listeners:** Cada botón de acción requiere 2-3 listeners (click en botón, click global para cerrar, y manejo de teclado en modal). El boilerplate de cleanup es significativo.
- **Re-renderizado del toolbar:** `wrapper.outerHTML = ActionToolbar()` + `initActionToolbar()` después de cada eliminación es una solución de fuerza bruta; una actualización granular del DOM sería más eficiente.
- **Máquina de estados manual:** A diferencia de frameworks reactivos, el estado "normal"/"delete" se gestiona manualmente con `dataset.state` y manipulación de clases, lo que requiere disciplina para mantener la consistencia.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| `window.confirm()` nativo | No permite estilizado, no tiene focus trap, no es accesible con lectores de pantalla. |
| Eliminación sin confirmación (undo toast) | Demasiado arriesgado para operaciones destructivas en datos financieros. Un toast de "deshacer" es fácil de ignorar. |
| Un solo botón "Eliminar" sin máquina de estados | Riesgo alto de eliminaciones accidentales por clicks involuntarios. |
| Eliminación lógica (soft delete) | Añade complejidad de filtrado y no resuelve la acumulación de datos en localStorage. |

## Relación con ADRs Existentes

- **ADR-012** (Filtrado dinámico): La eliminación extiende el sistema de eventos `caleta-filter-changed` y `holdings-updated` para notificar cambios a HoldingsTable, StatsGrid y AllocationDonut.
- **ADR-014** (escapeHTML XSS): La reimplementación en PR #11 aplica `escapeHTML()` sistemáticamente, validación en origen (`UNSAFE_NAME_RE` en `addSource()`), y uso correcto de `textContent` vs `innerHTML` en el modal.
- **ADR-019** (Manejo de errores): El `try/finally` del modal usa `getErrorMessage()` y `show-error-toast` para notificar fallos en la eliminación.

---
*Última actualización: 2026-06-12*
