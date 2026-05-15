# ADR-016: Node.js Test Runner Nativo para Pruebas Unitarias

- **Estado:** Aceptada
- **Fecha:** 2026-05-14
- **Contexto:** El proyecto requiere una infraestructura de testing para validar la lógica de negocio de los módulos utilitarios (CRUD sobre `localStorage`, formateo, etc.) sin añadir dependencias externas pesadas.

## Contexto

CaletaJS es una SPA Vanilla JS sin framework de UI. Sus utilidades (`holdingsStorage`, `helpers`, `storage`) son funciones puras que dependen principalmente de `localStorage` y `crypto.randomUUID()`. Hasta este punto, el proyecto no contaba con ninguna suite de pruebas automatizadas.

La búsqueda de un runner de pruebas debía considerar:
- Filosofía del proyecto: "Zero-JS por defecto; medir primero, optimizar segundo."
- Mínimo overhead en el bundle de producción.
- Compatibilidad con la sintaxis ES modules usada en el código fuente.

## Decisión

1. Adoptar **`node:test`** (Node.js ≥ 18) como runner de pruebas unitarias.
2. Usar **`node:assert`** como librería de aserciones, incluida en el runtime.
3. Registrar el script `"test": "node --test src/**/*.test.js"` en `package.json`.
4. Mockear APIs del navegador (`localStorage`, `crypto.randomUUID()`) mediante `globalThis` en los hooks `beforeEach`/`afterEach` de cada suite.
5. Colocar los archivos de test junto al módulo que prueban, con la convención `<nombre>.test.js`.

## Consecuencias

### Positivas
- **Cero dependencias:** No se añaden paquetes de desarrollo; el runner ya viene con Node.js.
- **Velocidad:** Ejecución directa sin compilación ni transformación previa.
- **Simplicidad:** API minimalista (`describe`, `test`, `beforeEach`, `afterEach`, `assert`) suficiente para pruebas unitarias de funciones puras.
- **Alineación arquitectónica:** Coherente con la filosofía de resolver necesidades con APIs nativas del navegador o del runtime.

### Negativas
- **Sin DOM virtual integrado:** Para pruebas de componentes que requieran DOM, será necesario añadir un entorno como `jsdom` o `happy-dom` en el futuro.
- **Cobertura limitada:** `node:test` no genera reportes de cobertura nativos; se necesitará `c8` o similar si se requiere métricas de cobertura.
- **Mocking manual:** El mocking de APIs del navegador se hace de forma manual con `globalThis`, lo cual es propenso a fugas si no se limpia correctamente en `afterEach`.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| **Jest** | Requiere babel-jest o transformer para ES modules; añade ~30 dependencias y aumenta tiempo de instalación. |
| **Vitest** | Excelente integración con Vite, pero el proyecto usa Webpack 5; añadiría un bundler de test paralelo al de producción. |
| **Mocha + Chai** | Dos paquetes adicionales con configuración manual de reporter y assertion library. `node:test` provee ambos nativamente. |
| **Tape** | Minimalista pero sin `describe`/`beforeEach` nativos; requiere librerías adicionales para estructurar suites. |

---
*Última actualización: 2026-05-14*
