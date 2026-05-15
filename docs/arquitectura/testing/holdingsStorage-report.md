# Informe de Testing — Commit `95fdc11`

## 1. Resumen del Commit

| Campo | Valor |
|---|---|
| **Hash** | `95fdc11cb7d3243271428a026e0db14134323c6d` |
| **Autor** | google-labs-jules[bot] (`161369871+google-labs-jules[bot]@users.noreply.github.com`) |
| **Co-autor** | EdGonzz (`111212883+EdGonzz@users.noreply.github.com`) |
| **Fecha** | 2026-05-14 08:06:03 +0000 |
| **Mensaje** | 🧪 Add comprehensive tests for holdingsStorage utility |
| **Rama** | `testing-improvement-holdings-storage-10952277146289013120` |

### Descripción del commit

Se añadió una suite de pruebas unitarias completa para el módulo `holdingsStorage.js`, cubriendo las cuatro funciones exportadas (`getHoldings`, `addHolding`, `updateHolding`, `removeHolding`). Adicionalmente, se integró el script `test` en `package.json` usando el runner nativo `node:test`.

### Archivos modificados

| Archivo | Tipo de cambio | Líneas |
|---|---|---|
| `package.json` | Modificado | +2/-1 |
| `src/utils/holdingsStorage.test.js` | **Nuevo** | +133 |

**Total:** 2 archivos — 135 inserciones, 1 eliminación.

---

## 2. Análisis de los Cambios

### 2.1 `package.json` — Script de testing

Se añadió la entrada `"test": "node --test src/**/*.test.js"` al bloque de `scripts`. Esto habilita la ejecución de pruebas con `pnpm test` usando el runner nativo de Node.js sin dependencias adicionales.

**Antes:**
```json
"scripts": {
  "start": "portless run webpack server --mode development",
  "build": "webpack --mode production"
}
```

**Después:**
```json
"scripts": {
  "start": "portless run webpack server --mode development",
  "build": "webpack --mode production",
  "test": "node --test src/**/*.test.js"
}
```

### 2.2 `src/utils/holdingsStorage.test.js` — Suite de pruebas

Archivo nuevo con 133 líneas que implementan 10 casos de prueba organizados en 4 grupos (`describe`):

| Grupo | Función bajo prueba | Casos | Verificaciones clave |
|---|---|---|---|
| `getHoldings()` | Lectura de holdings | 2 | Array vacío por defecto, recuperación de datos almacenados |
| `addHolding()` | Inserción de holdings | 3 | Auto-generación de `id` y `createdAt`, preservación de holdings existentes, formato ISO válido |
| `updateHolding()` | Actualización por ID | 3 | Merge parcial de campos, adición de `updatedAt`, idempotencia ante ID inexistente |
| `removeHolding()` | Eliminación por ID | 2 | Eliminación correcta, preservación ante ID inexistente |

**Estrategia de mocking:**

Se utiliza un `Map` como store en memoria que simula la interfaz de `localStorage`:
```javascript
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, value) => mockStorage.set(key, value),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};
```

El mock se inyecta en `beforeEach` y se elimina en `afterEach`, garantizando aislamiento entre tests.

> **Nota:** El commit menciona "Mocked `localStorage` and `crypto` for deterministic testing" en su descripción, pero el código entregado **no incluye mock de `crypto.randomUUID()`**. Las pruebas dependen de `crypto.randomUUID()` nativo del runtime de Node. Esto funciona correctamente en Node ≥ 19, pero podría causar fallos en entornos donde `crypto` no esté disponible.

### 2.3 Módulo bajo prueba: `holdingsStorage.js`

El módulo exporta 4 funciones CRUD puras que operan sobre `localStorage` a través del wrapper `storage`:

```javascript
export const getHoldings = () => storage.get(HOLDINGS_KEY, []);
export const addHolding = (holding) => { /* genera id y createdAt */ };
export const updateHolding = (id, updates) => { /* merge + updatedAt */ };
export const removeHolding = (id) => { /* filter by id */ };
```

**Clave de almacenamiento:** `caleta_user_holdings`

---

## 3. Impacto y Regresión

### 3.1 Impacto positivo

| Área | Impacto |
|---|---|
| **Confianza en refactors** | Las pruebas de `holdingsStorage` permiten refactores seguros en la capa de persistencia |
| **Documentación viva** | Los tests documentan el comportamiento esperado del CRUD (idempotencia, auto-generación de IDs, timestamps) |
| **CI/CD** | El script `test` permite integrar validación automatizada en pipelines |
| **Cero overhead** | No se añaden dependencias; `node:test` es parte del runtime |

### 3.2 Riesgos de regresión

| Riesgo | Severidad | Descripción |
|---|---|---|
| **Mock incompleto de localStorage** | Media | El mock no implementa el comportamiento real de `localStorage` ante datos corruptos o cuota excedida. Si `storage.get` falla al parsear JSON, el mock no lo simula. |
| **Sin mock de `crypto`** | Baja | Se asume `crypto.randomUUID()` disponible en el entorno de test. En Node < 19, puede requerir un polyfill o mock explícito. |
| **Glob pattern en Windows** | Baja | El glob `src/**/*.test.js` puede comportarse distinto en Windows dependiendo de la shell. |

### 3.3 Áreas del sistema afectadas

| Módulo | Impacto |
|---|---|
| `src/utils/holdingsStorage.js` | Directo — es el módulo bajo prueba |
| `src/utils/storage.js` | Indirecto — el mock de `localStorage` no ejercita el manejo de errores de `storage.get/set` |
| `src/pages/Dashboard.js` | Indirecto — consume `getHoldings()` para renderizar la tabla |
| `src/components/AddAssetModal.js` | Indirecto — consume `addHolding()` al guardar un nuevo asset |
| Pipeline CI/CD | Directo — nuevo script `test` disponible para automatización |

---

## 4. Plan de Pruebas

### Estrategia

| Nivel | Tipo | Herramienta | Alcance |
|---|---|---|---|
| Unitario | Funcional | `node:test` + `node:assert` | `holdingsStorage.js` (4 funciones × 10 casos) |
| Unitario | Regresión | `node:test` | Verificar que cambios futuros no rompan el CRUD |
| Integración | Funcional | Manual / navegador | Flujos que usan `holdingsStorage` de extremo a extremo |

### Criterios de entrada
- Node.js ≥ 18 (para `node:test`)
- Node.js ≥ 19 (para `crypto.randomUUID()` nativo; en versiones anteriores, la llamada funciona si `globalThis.crypto` está disponible)
- `pnpm install` completado

### Criterios de salida
- 100% de los test cases ejecutados sin fallos.
- 0 defectos de severidad Crítica o Alta abiertos.
- Verificación manual del flujo de añadir/editar/eliminar holdings en el navegador.

### Ejecución

```bash
# Ejecutar la suite completa
pnpm test

# Ejecutar con verbose output
node --test src/utils/holdingsStorage.test.js

# Ejecutar con flag experimental (Node 18)
node --experimental-vm-modules --test src/utils/holdingsStorage.test.js
```

---

## 5. Casos de Prueba

### 5.1 `getHoldings()`

| ID | Nombre | Precondiciones | Pasos | Datos de Entrada | Resultado Esperado | Prioridad |
|---|---|---|---|---|---|---|
| TC-001 | Obtener holdings vacíos | `localStorage` sin clave `caleta_user_holdings` | 1. Invocar `getHoldings()` | — | Retorna `[]` | Alta |
| TC-002 | Obtener holdings almacenados | `localStorage` con `[{id:"1", symbol:"BTC"}]` en clave `caleta_user_holdings` | 1. Poblar mockStorage con datos válidos → 2. Invocar `getHoldings()` | `[{id:"1", symbol:"BTC"}]` | Retorna el array con los holdings almacenados | Alta |

### 5.2 `addHolding()`

| ID | Nombre | Precondiciones | Pasos | Datos de Entrada | Resultado Esperado | Prioridad |
|---|---|---|---|---|---|---|
| TC-003 | Añadir holding a lista vacía | `localStorage` vacío | 1. Invocar `addHolding({symbol:"ETH", amount:2})` | `{symbol:"ETH", amount:2}` | Retorna array de 1 elemento. El elemento tiene `id` autogenerado (UUID), `createdAt` ISO válido y las propiedades del input. Se persiste en `localStorage`. | Crítica |
| TC-004 | Añadir holding a lista existente | `localStorage` con 1 holding previo `{id:"old-id", symbol:"BTC", amount:1}` | 1. Poblar mockStorage → 2. Invocar `addHolding({symbol:"SOL", amount:10})` | `{symbol:"SOL", amount:10}` | Retorna array de 2 elementos. El primer elemento conserva `id:"old-id"`. El segundo tiene un `id` nuevo y distinto, con `symbol:"SOL"`. | Alta |
| TC-005 | Generación de timestamp ISO en createdAt | `localStorage` vacío | 1. Invocar `addHolding({symbol:"DOT"})` → 2. Verificar `createdAt` | `{symbol:"DOT"}` | `createdAt` es un string ISO 8601 válido. `new Date(createdAt).toISOString()` no lanza error y produce el mismo valor. | Media |

### 5.3 `updateHolding()`

| ID | Nombre | Precondiciones | Pasos | Datos de Entrada | Resultado Esperado | Prioridad |
|---|---|---|---|---|---|---|
| TC-006 | Actualizar holding existente | `localStorage` con `[{id:"123", symbol:"BTC", amount:1}]` | 1. Invocar `updateHolding("123", {amount:1.5})` | `id:"123"`, `{amount:1.5}` | `amount` cambia a `1.5`. `symbol` permanece `"BTC"`. Se añade campo `updatedAt` con timestamp ISO. | Crítica |
| TC-007 | Actualizar un holding sin afectar otros | `localStorage` con `[{id:"1", symbol:"BTC", amount:1}, {id:"2", symbol:"ETH", amount:10}]` | 1. Invocar `updateHolding("1", {amount:2})` | `id:"1"`, `{amount:2}` | Solo el holding con `id:"1"` se actualiza (`amount:2`). El holding con `id:"2"` permanece inalterado (`amount:10`). | Alta |
| TC-008 | Actualizar holding con ID inexistente | `localStorage` con `[{id:"1", symbol:"BTC"}]` | 1. Invocar `updateHolding("non-existent", {amount:2})` | `id:"non-existent"` | Retorna la misma lista sin modificaciones (idempotencia). No se añade `updatedAt` a ningún elemento. | Media |

### 5.4 `removeHolding()`

| ID | Nombre | Precondiciones | Pasos | Datos de Entrada | Resultado Esperado | Prioridad |
|---|---|---|---|---|---|---|
| TC-009 | Eliminar holding por ID | `localStorage` con `[{id:"1", symbol:"BTC"}, {id:"2", symbol:"ETH"}]` | 1. Invocar `removeHolding("1")` | `id:"1"` | Retorna array de 1 elemento (`{id:"2", symbol:"ETH"}`). Se elimina de `localStorage` (verificación de persistencia). | Crítica |
| TC-010 | Eliminar holding con ID inexistente | `localStorage` con `[{id:"1", symbol:"BTC"}]` | 1. Invocar `removeHolding("non-existent")` | `id:"non-existent"` | Retorna el mismo array sin cambios (`[{id:"1", symbol:"BTC"}]`). | Media |

### 5.5 Casos borde y de error no cubiertos por la suite actual

| ID | Nombre | Precondiciones | Pasos | Datos de Entrada | Resultado Esperado | Prioridad |
|---|---|---|---|---|---|---|
| TC-011 | `localStorage.setItem` falla (cuota excedida) | Simular `QuotaExceededError` en mock | 1. Mutar `localStorage.setItem` para lanzar error → 2. Invocar `addHolding()` | `{symbol:"BTC"}` | La función no lanza error no capturado; `storage.set` maneja el error internamente. | Alta |
| TC-012 | `localStorage` devuelve JSON corrupto | Poblar mockStorage con string inválido | 1. Setear `caleta_user_holdings` a `"{invalid"` → 2. Invocar `getHoldings()` | `"{invalid"` | Retorna el fallback `[]` gracias al manejo de errores en `storage.get`. | Alta |
| TC-013 | `addHolding` sin propiedades | `localStorage` vacío | 1. Invocar `addHolding({})` (objeto vacío) | `{}` | Se crea un holding con solo `id` y `createdAt`. Las demás propiedades son `undefined`. No lanza error. | Media |
| TC-014 | `updateHolding` con objeto vacío | `localStorage` con 1 holding | 1. Invocar `updateHolding("1", {})` | `id:"1"`, `{}` | Solo se añade `updatedAt`. Las propiedades existentes se conservan intactas. | Baja |
| TC-015 | `crypto.randomUUID` no disponible | Entorno sin `crypto.randomUUID` (Node < 19 sin polyfill) | 1. Eliminar `crypto.randomUUID` → 2. Invocar `addHolding()` | `{symbol:"BTC"}` | La función lanza error (TypeError). Se requiere mock o polyfill. | Alta |

---

## 6. Resultados de Ejecución

| ID | Caso de Prueba | Resultado Obtenido | Estado |
|---|---|---|---|
| TC-001 | Obtener holdings vacíos | — | Pendiente |
| TC-002 | Obtener holdings almacenados | — | Pendiente |
| TC-003 | Añadir holding a lista vacía | — | Pendiente |
| TC-004 | Añadir holding a lista existente | — | Pendiente |
| TC-005 | Generación de timestamp ISO en createdAt | — | Pendiente |
| TC-006 | Actualizar holding existente | — | Pendiente |
| TC-007 | Actualizar un holding sin afectar otros | — | Pendiente |
| TC-008 | Actualizar holding con ID inexistente | — | Pendiente |
| TC-009 | Eliminar holding por ID | — | Pendiente |
| TC-010 | Eliminar holding con ID inexistente | — | Pendiente |
| TC-011 | `localStorage.setItem` falla (cuota excedida) | — | Pendiente |
| TC-012 | `localStorage` devuelve JSON corrupto | — | Pendiente |
| TC-013 | `addHolding` sin propiedades | — | Pendiente |
| TC-014 | `updateHolding` con objeto vacío | — | Pendiente |
| TC-015 | `crypto.randomUUID` no disponible | — | Pendiente |

> **Nota:** Los TC-001 a TC-010 están cubiertos por la suite automatizada en `holdingsStorage.test.js`. Los TC-011 a TC-015 son casos adicionales identificados durante el análisis que requieren implementación.

---

## 7. Conclusiones y Recomendaciones

### Conclusiones

1. **Cobertura inicial sólida:** La suite cubre los 4 métodos exportados de `holdingsStorage.js` con 10 casos de prueba que validan flujos principales y escenarios de idempotencia (ID inexistente en `update` y `remove`).

2. **Mock funcional pero limitado:** El mock de `localStorage` basado en `Map` es suficiente para los escenarios actuales, pero no simula comportamientos reales como cuota excedida, datos corruptos, ni el asíncronismo presente en algunos navegadores.

3. **Descripción del commit vs implementación:** El mensaje del commit indica "Mocked `localStorage` and `crypto` for deterministic testing", pero el código **no incluye un mock de `crypto.randomUUID()`**. Las pruebas dependen de la implementación nativa, lo cual es funcional pero no es determinístico (los IDs generados varían entre ejecuciones).

4. **Sin mock de `storage.js`:** Las pruebas mockean `localStorage` directamente en lugar de mockear el wrapper `storage`. Esto significa que los caminos de error (try/catch en `storage.get` y `storage.set`) no son ejercitados por la suite actual.

### Recomendaciones

1. **Añadir mock de `crypto.randomUUID()`** para garantizar tests determinísticos. Generar IDs fijos permite aserciones más estrictas:
   ```javascript
   beforeEach(() => {
     globalThis.crypto = { randomUUID: () => 'test-uuid-1234' };
   });
   afterEach(() => {
     delete globalThis.crypto;
   });
   ```

2. **Añadir tests para `storage.js`:** Los métodos `storage.get` y `storage.set` tienen lógica de manejo de errores (try/catch) que no está cubierta. Se recomienda:
   - Test de `storage.get` con JSON corrupto → retorna fallback.
   - Test de `storage.set` con `QuotaExceededError` → no lanza error.
   - Test de `storage.get` con clave inexistente → retorna `null`.

3. **Añadir tests borde:** Implementar los casos TC-011 a TC-015 identificados en la sección 5.5, especialmente los de manejo de errores de `localStorage`.

4. **Integrar a CI/CD:** Configurar el comando `pnpm test` en el pipeline de integración continua para que se ejecute automáticamente en cada push/PR.

5. **Considerar cobertura de código:** Añadir `c8` como dependencia de desarrollo para generar métricas de cobertura:
   ```json
   "test:coverage": "c8 --src src node --test src/**/*.test.js"
   ```

6. **Convención de mock:** Documentar en la arquitectura (`docs/arquitectura/testing.md`) el patrón de mock vía `globalThis` para mantener consistencia en futuras suites de test.

---
*Generado a partir del commit `95fdc11cb7d3243271428a026e0db14134323c6d`*
