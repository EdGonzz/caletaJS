# Testing en CaletaJS

## Infraestructura

El proyecto utiliza el **test runner nativo de Node.js** (`node:test`) junto con el módulo de aserciones `node:assert`. No se requieren dependencias externas para ejecutar las pruebas unitarias.

### Ejecución

```bash
# Ejecutar todas las pruebas
pnpm test

# Ejecutar un archivo específico
node --test src/utils/holdingsStorage.test.js
```

El script `"test": "node --test src/**/*.test.js"` está configurado en `package.json`.

> **Ver ADR-016** para la justificación de esta elección arquitectónica.

### Convenciones

| Convención | Regla |
|---|---|
| **Ubicación** | Los archivos de prueba se colocan junto al módulo que prueban: `<nombre>.test.js` |
| **Naming** | El archivo de test usa el mismo nombre del módulo con sufijo `.test.js` |
| **Estructura** | `describe()` para agrupar por función, `test()` para cada caso individual |
| **Mocking** | Las APIs del navegador se mockean vía `globalThis` en `beforeEach`/`afterEach` |
| **Aserciones** | Se usa exclusivamente `node:assert` (`strictEqual`, `deepStrictEqual`, `ok`, `doesNotThrow`) |

### Requisitos

- **Node.js ≥ 18** (para `node:test`)
- **Node.js ≥ 19** (para `crypto.randomUUID()` en tests que lo requieran; alternativa: mockear la función)
- `pnpm install` completado

---

## Estrategia de Prueba

### Nivel 1: Pruebas Unitarias de Utilidades

Las funciones puras del directorio `src/utils/` son el primer objetivo de testing por su deterministicidad: no dependen del DOM y sus entradas/salidas son predecibles.

**Módulos cubiertos:**

| Módulo | Funciones | Archivo de Test | Estado |
|---|---|---|---|
| `holdingsStorage` | `getHoldings`, `addHolding`, `updateHolding`, `removeHolding` | `holdingsStorage.test.js` | ✅ Cubierto |
| `storage` | `storage.get`, `storage.set` | — | 🔲 Pendiente |
| `helpers` | `debounce`, `escapeHTML` | — | 🔲 Pendiente |
| `formatters` | `now`, `formatUsd` | — | 🔲 Pendiente |
| `getCoin` | `getCoin`, `getTopCoins` | — | 🔲 Pendiente |

**Enfoque de mocking:** Se mockea `localStorage` con un `Map` y se inyecta vía `globalThis.localStorage` en `beforeEach`, limpiando en `afterEach` para garantizar aislamiento entre tests.

Ejemplo de patrón de mock:
```javascript
let mockStorage = new Map();

beforeEach(() => {
  mockStorage = new Map();
  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, value) => mockStorage.set(key, value),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  };
});

afterEach(() => {
  delete globalThis.localStorage;
});
```

### Nivel 2: Pruebas Unitarias de Componentes (Strings)

Puesto que los componentes (`AssetRow`, `StatCard`, etc.) retornan strings literales, los tests verifican que, con ciertas entradas JSON, las cadenas de salida contienen el HTML esperado, las clases correctas y los datos interpolados.

```javascript
// Ejemplo: StatCard.test.js
test('renders title and value', () => {
  const result = StatCard('Balance', '$1000');
  assert.ok(result.includes('<h3>Balance</h3>'));
  assert.ok(result.includes('$1000'));
});
```

### Nivel 3: Pruebas de Integración (DOM / Eventos)

Para componentes que exponen funciones `init*()`, las pruebas deben:
1. Inyectar el HTML pre-generado en un DOM virtual (`jsdom` o `happy-dom`)
2. Llamar al método `init()`
3. Simular eventos (clic, input)
4. Asertar cambios de estado usando selectores Vanilla JS (`document.querySelector`)

> **Nota:** Este nivel requiere la adición de `jsdom` o `happy-dom` como dependencia de desarrollo. Ver ADR-016.

---

## Cobertura

| Módulo | Líneas | Funciones | Ramas | Suite |
|---|---|---|---|---|
| `holdingsStorage.js` | — | 4/4 | — | `holdingsStorage.test.js` (10 casos) |

> La métrica de cobertura detallada requiere la integración de `c8` o `nyc`. Actualmente no se genera reporte de cobertura automatizado.

---

## Informes de Testing por Commit

Los informes detallados de testing para commits específicos se encuentran en:

| Commit | Archivo |
|---|---|
| `95fdc11` — holdingsStorage | [`testing/holdingsStorage-report.md`](testing/holdingsStorage-report.md) |

---
*Última actualización: 2026-05-14*
