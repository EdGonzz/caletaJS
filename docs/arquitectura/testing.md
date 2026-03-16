# Testing

---

## Estado actual

CaletaJS **no tiene tests automatizados configurados** al momento de generar este documento.

No hay:
- Framework de testing instalado (sin Jest, Vitest, etc.)
- Archivos `*.test.js` en `src/`
- Script `test` en `package.json`

---

## Recomendación: Configurar Vitest

Dado que el proyecto usa Webpack (no Vite), la opción más compatible sin cambiar el bundler es **Jest**. Sin embargo, para proyectos Vanilla JS modernos, **Vitest** es también una opción ligera.

### Opción A — Jest (compatible con Webpack/Babel)

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

### Opción B — Vitest (más moderno, requiere Vite)

Requeriría migración de Webpack a Vite. Ver [ADR-001](../decisions/001-webpack-bundler.md).

---

## Qué testear (Roadmap)

Dado que los componentes son funciones puras que retornan strings, son fácilmente testeables:

| Módulo                  | Tipo de test                | Ejemplo                                           |
|-------------------------|-----------------------------|---------------------------------------------------|
| `utils/formatters.js`   | Unit                        | `formatUsd(1000)` → `"$1,000.00"`               |
| `utils/getHash.js`      | Unit                        | Mock `location.hash`, verificar output            |
| `utils/resolveRoutes.js`| Unit                        | `resolveRoutes("coin")` → `"/coin/:id"`          |
| `components/StatCard.js`| Snapshot / integración      | Verificar que el HTML contiene el `title`         |
| `components/Pagination.js` | Unit                     | Verificar botones deshabilitados en página 1/last |
| `router/routes.js`      | Integración (JSDOM)         | Verificar que render cambia `#app.innerHTML`      |

---

## Convenciones sugeridas

- **Co-location:** Archivos de test junto al módulo: `formatters.test.js` al lado de `formatters.js`
- **Naming:** `describe("formatUsd")` + `it("formato moneda positiva")` 
- **Mocks:** Para módulos que dependen del DOM, usar `jsdom` (builtin en Jest)
- **Sin efectos secundarios:** Los componentes son funciones puras; no requieren cleanup

---

## Comandos (cuando se implementen)

```bash
pnpm test           # Ejecutar todos los tests
pnpm test --watch   # Watch mode
pnpm test --coverage # Reporte de cobertura
```

---

*Última actualización: 2026-03-15*
