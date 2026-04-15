# Testing

> Última actualización: 2026-04-15

## Estado actual

CaletaJS **no tiene tests automatizados configurados** al momento de generar este documento.

No hay:
- Framework de testing instalado (sin Jest, Vitest, etc.)
- Archivos `*.test.js` en `src/`
- Script `test` en `package.json`

---

## Recomendación: Configurar Jest

Dado que el proyecto usa Webpack (no Vite), la opción más compatible sin cambiar el bundler es **Jest**.

### Setup — Jest (compatible con Webpack/Babel)

```bash
pnpm add -D jest @babel/preset-env babel-jest
```

`babel.config.js`:
```javascript
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
};
```

`package.json`:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

---

## Qué testear (Roadmap)

Dado que los componentes son funciones puras que retornan strings, son fácilmente testeables:

| Módulo                  | Tipo de test                | Ejemplo                                           |
|-------------------------|-----------------------------|---------------------------------------------------|
| `utils/formatters.js`   | Unit                        | `formatUsd(1000)` → `"$1,000.00"`               |
| `utils/formatters.js`   | Unit                        | `formatBalance(0.455612)` → `"0.455612"`         |
| `utils/formatters.js`   | Unit                        | `now()` retorna formato `YYYY-MM-DDThh:mm`       |
| `utils/getHash.js`      | Unit                        | Mock `location.hash`, verificar output            |
| `utils/resolveRoutes.js`| Unit                        | `resolveRoutes("coin")` → `"/coin/:id"`          |
| `utils/helpers.js`      | Unit                        | `debounce(fn, 300)` invoca después del delay     |
| `utils/sources.js`      | Unit (mock localStorage)    | `addSource({...})` persiste y retorna lista       |
| `components/StatCard.js`| Snapshot / integración      | Verificar que el HTML contiene el `title`         |
| `components/Pagination.js`| Unit                      | Verificar botones deshabilitados en página 1/last |
| `components/AssetRow.js`| Snapshot                    | Verificar formateo de price y change badge        |
| `utils/skeletonRow.js`  | Unit                        | Verificar que acepta opciones y genera HTML       |
| `router/routes.js`      | Integración (JSDOM)         | Verificar que render cambia `#app.innerHTML`      |

---

## Convenciones sugeridas

- **Co-location:** Archivos de test junto al módulo: `formatters.test.js` al lado de `formatters.js`
- **Naming:** `describe("formatUsd")` + `it("formato moneda positiva")` 
- **Mocks:** Para módulos que dependen del DOM, usar `jsdom` (builtin en Jest)
- **Sin efectos secundarios:** Los componentes son funciones puras; no requieren cleanup
- **localStorage:** Usar `jest.spyOn(Storage.prototype, 'getItem')` para mock

---

## Comandos (cuando se implementen)

```bash
pnpm test           # Ejecutar todos los tests
pnpm test --watch   # Watch mode
pnpm test --coverage # Reporte de cobertura
```
