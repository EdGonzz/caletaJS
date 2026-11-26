# Deploy a Vercel con API proxy serverless — CaletaJS
Branch: `feat/deploy-vercel` | Delivery: `single-pr` (PR/push requieren autorización explícita) | Runner: `pnpm test`, `pnpm build`, `vercel dev`

## Specs

S1. Solicitud del usuario (texto exacto): "Vamos a implemenVamos a implementar el plan de Deploy para el proyecto, para esto quiere que te centres usando hc y el agente de Antigravity en el panel de Workers, tenme al tanto de las cosas ya que quiero aprender cómo lo ejecutas". Alcance: ejecutar `temp/plan-deploy-vercel.md`, orquestando con `hc` y un agente Antigravity ubicado en el tab `caleta / Workers`, con reportes de progreso al usuario.

S2. Fase 1 del plan (texto exacto): "Código Completo de los 4 Endpoints" — `api/coins.js`, `api/coin.js`, `api/coin-history.js`, `api/exchange.js`. Criterios: ESM `export default async function handler(req, res)`, `x-cg-demo-api-key: process.env.API_KEY` solo en servidor, `AbortController` de 8000 ms, whitelist regex de parámetros, `405` para métodos no GET, `400` para parámetros inválidos, `429` con `Retry-After`, y `Cache-Control` por endpoint.

S3. Fase 2 del plan (texto exacto): "Archivo Correcto: `vercel.json`" — `"framework": null`, `"buildCommand": "pnpm build"`, `"outputDirectory": "dist"`, `"cleanUrls": true` y el rewrite documentado, con la salvedad del revisor sobre path-to-regexp.

S4. Fases 3 y 5.5 del plan (texto exacto): "Modificaciones Exactas en el Frontend (Diffs)" y "⚠️ Hallazgo Crítico Adicional: `src/pages/CoinDetails.js`". Criterios: `HoldingsTable.js`, `getCoin.js`, `getCoinHistory.js`, `getExchange.js` y `CoinDetails.js` apuntan a `/api/*`, sin `process.env.API_KEY`, `process.env.API_URL` ni header `x-cg-demo-api-key` en el bundle.

S5. Fase 4 del plan (texto exacto): "Limpieza de `dotenv-webpack` y Manejo de `process.env.NODE_ENV`" — remover el import y `new Dotenv()` de `webpack.config.js`, desinstalar `dotenv-webpack` de `package.json` y del lockfile, conservando `process.env.NODE_ENV` vía DefinePlugin.

S6. Fase 11 del plan (texto exacto): "Guía Paso a Paso de Verificación y Testing" — `pnpm test` con "ℹ tests 87 / ℹ pass 87 / ℹ fail 0"; `pnpm build`; `grep -rn "x-cg-demo-api-key" dist/` y `grep -rn "CG-" dist/` sin coincidencias; curl local `200`, `200`, `400`, `405`.

S7. Fases 5, 7 y 9 del plan: configurar `API_KEY` en Vercel Dashboard, `vercel link`, preview y `vercel --prod`. Requiere credenciales del usuario y autorización explícita de publicación; queda como frontera humana.

## Tasks

T1 — S2,S3 — delegated (Antigravity en `caleta / Workers` vía hc) — crear `api/*.js`, tests y `vercel.json` — commit `0718a28`.
T2 — S4,S5 — inline — rewiring del frontend + limpieza de `dotenv-webpack` — commit `7bbec8c`.
T3 — S6 — inline — `pnpm test` (124/124), `pnpm build`, grep de secretos (sin coincidencias); `vercel dev` bloqueado por auth → ver T4 — commit `7bbec8c`.
T4 — S7 — humano — login/link/env vars/preview/prod — COMPLETADO: deploy en production (URL caleta-kappa.vercel.app).

## Log

L1: "Vamos a implemenVamos a implementar el plan de Deploy para el proyecto, para esto quiere que te centres usando hc y el agente de Antigravity en el panel de Workers, tenme al tanto de las cosas ya que quiero aprender cómo lo ejecutas"

L2: Exploración inicial: remoto real confirmado con `git remote -v` → `https://github.com/EdGonzz/caletaJS.git` (resuelve la discrepancia 2.2 del plan). `api/` y `vercel.json` no existen; los 5 archivos frontend y `dotenv-webpack` siguen intactos. Existen dos sistemas Herdr: el `agy` previo está en el Herdr viejo (`w1:t9`, inalcanzable sin HERDR_ENV propio), mientras hc-core tiene el tab `caleta / Workers` (`tb9082cf7556fab1bf4b83c7a32914643c`) con panes libres: ahí se levanta el worker.

L3: Riesgo: item 2 (secretos/API key) e item 5 (configuración de deploy/dependencias). Requiere verificación independiente al cierre.

L4: T1 delegado: worker Antigravity levantado en el pane libre t2f del tab `Workers` (herdr-app + hc), CLI 1.5.11 / Gemini 3.8 Flash. Se frenó en un prompt de permiso de herramienta MCP read-only; se desbloqueó con `hc keys t2f enter` y quedó en auto mode. T2 completado inline: RED observado antes del fix (6/6 fallos con URLs `undefined/coins/...`), GREEN 6/6 en el test nuevo. `pnpm remove -D dotenv-webpack` actualizó package.json y lockfile. `pnpm build` exitoso; `grep -rn "x-cg-demo-api-key" dist/` y `grep -rn "CG-" dist/` con exit 1 (sin coincidencias).

L5: Corrección de evidencia (hallazgo R4-03): el GREEN intermedio de T2 fue 93/93 (87 base + 6 regression), pero los 31 tests de los 4 handlers de T1 sí se ejecutaron y pasaron. Cifra final verificada por el parent y el verificador independiente: `node --test api/` 31/31 y `pnpm test` 124/124 (87 base + 6 regression + 31 handlers).

L6: Verificación independiente (Antigravity fresco en pane t2d, solo lectura): SIN BLOCKERS. Seguridad PASS (API_KEY solo en runtime serverless, grep de secretos sin coincidencias, whitelist anti-SSRF en los 4 handlers), corrección PASS (URLs frontend ↔ handlers, vercel.json según S3, códigos 405/400/429/500/504/502), tests PASS. Tres findings minor revisados por el parent contra el código real: precedencia query/id determinista (`api/coin.js:26`), `parseInt('max')` → NaN cae en caché de 1 hora correcta (`api/coin-history.js:65-69`), y negative lookahead válido en `source` de Vercel dentro de grupo de captura según doc oficial. Ninguno es defecto.

L7: Revisión nativa RDD (RDD activo, assess `high_risk` con escalate item 2, consent `granted` por el usuario): lineage `review-71951f3ef1d8c190`, lenses review-risk/resilience/reliability, resultado APPROVED con 8 hallazgos informational non-blocking (sin corrección abierta). Acknowledgement ejecutado: `review-acknowledged/v1` / `authority: burned`. Follow-ups informational para trabajo posterior: cachear respuestas de error en CDN (R3-001/R4-01), cubrir URLs de los 2 componentes con test (R3-002), y test del patrón de rewrite (R3-003/R4-04).

L8: `vercel dev` para validación local con curl queda en la frontera humana T4: el CLI pidió device auth de Vercel ("No existing credentials found") y no se autenticó. Sin login de Vercel, link, env vars, preview ni prod deploy sin autorización explícita del usuario.

L9: Cierre local inicial: 3 commits — 0718a28 (feat deploy), 7bbec8c (refactor api), 35cdb45 (docs deploy). Nada pusheado, sin PR, sin deploy.

L10: Coordinación de deploy T4 iniciada 2026-11-21: login Vercel (`edgonz`), link del proyecto `caleta` en team `edgonzzs-projects` (projectId `prj_Glpa7Cwg37LUcI6KBAfWhdhxxlB0`), `.vercel/project.json` generado, `.env.local` creado por el CLI e ignorado. Commit `98346d3` (chore: ignore .vercel y env files). Slice: 1305 authored lines en 4 commits desde origin/main (lock excluido) → delivery `single-pr`, toda la rama es un solo PR, sin chaining.

L11: Deploy completado 2026-11-21: por ser el primer deployment, Vercel lo asignó a production (no preview). URLs: `https://caleta-kappa.vercel.app` (alias) y `https://caleta-itapat7kb-edgonzzs-projects.vercel.app` (production). Validación post-deploy: `/api/coins?ids=bitcoin` 200 con datos reales (API_KEY en runtime serverless), `/api/coin?query=solana` 200, anti-SSRF `ids=../../etc/passwd` 400, POST `/api/coins` 405, SPA root 200. Edge cache activo (`x-vercel-cache: HIT`, `age`) — Vercel normaliza el header `cache-control` a `public` para el cliente pero honra `s-maxage` internamente en su CDN (mitigación ADR-018 operativa).

L12: Revisión nativa RDD del rango commiteado (`review-7c3aed805a9cfbbe`, tier medium, lenses risk/resilience/reliability, base `a93843d..HEAD`, 1338 líneas): APPROVED sin blockers; autoridad quemada. 10 hallazgos informational, el único CRITICAL (`R4-cached-error-responses`, cachear respuestas de error) fue REFUTADO por el refuter. Follow-ups reales señalados: `R3-002` (el timeout se limpia antes de parsear el body → un upstream que stallea el body no dispara el 504), `R3-003` (`price_change_percentage` limita a 20 chars pero CoinGecko documenta 25), `R3-004` (los `.test.js` dentro de `api/` quedan como endpoints deployables de Vercel).

L13: Fixes post-review (R3-002/003/004) delegados a agy en `t7` (Workers, visible): R3-002 `clearTimeout` movido después de `await json()` en los 4 handlers (el timeout ahora cubre el parseo del body), R3-003 `price_change_percentage` cap 20→25 chars, R3-004 tests movidos de `api/` a `test/` (renames). RED 5 fallos (4× 502!==504 + 1× 400!==200) → GREEN 129/129, `pnpm build` OK, grep de secretos sin coincidencias. Commit `b829f36`. `git connect` completado: `caleta` ↔ `EdGonzz/caletaJS` (auto-deploy en push).

L14: Revisión nativa RDD de los fixes (`review-9d61ad4856aefa99`, tier medium, lenses resilience/reliability, base `6401eff..HEAD`): APPROVED sin hallazgos ni refuter; autoridad quemada (`review-acknowledged/v1`).

L15: Push a `origin/feat/deploy-vercel` y PR abierto: https://github.com/EdGonzz/caletaJS/pull/15 (base `main`, estrategia `single-pr`).
