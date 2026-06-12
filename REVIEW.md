# REVIEW.md

## Repository invariants

### Architecture & component model
- Components are pure functions returning HTML strings. No inline event handlers. All interactivity is wired in separately-exported `init*` functions called by the router after `innerHTML` is set.
- Every `init*` function must have a corresponding `cleanup*` function that removes event listeners, aborts pending requests, and clears timers. The router invokes all cleanups in fixed order before every navigation.
- Module-level `let` state is acceptable for stateful components (modals, toolbars, charts). Do not introduce a global store or state management library.
- Cross-component communication uses `CustomEvent` dispatched on `window`. The canonical events are: `prices-updated`, `holdings-updated`, `caleta-filter-changed`, `request-prices-refresh`, `prices-update-failed`, `show-error-toast`. Do not add ad-hoc events without documenting them.

### Routing
- Hash-based router at `src/router/routes.js`. Route keys in the table are documentation-only; actual resolution is hardcoded in `src/utils/resolveRoutes.js`. New routes must be added to both files.
- The cleanup and init order in `router()` is critical. `HoldingsTable.init` may dispatch `prices-updated` synchronously when net balance is zero. Do not reorder without verifying downstream listeners.

### Data & business rules
- All data is client-side, `localStorage` only. Keys: `caleta_user_holdings`, `caleta_user_sources`, `caleta_last_exchange`.
- `buy` and `transfer` add to balance; `sell` subtracts. Only holdings with `balance > 0` are shown.
- `DEFAULT_SOURCE = 'Caletas'` is the magic constant for the consolidated cross-exchange view. When the active source filter equals `'Caletas'`, balances are aggregated by `coinId` across all exchanges. Otherwise, each `(coinId, source)` pair is an independent row.
- `deleteHoldingsByCoin(coinId, 'Caletas')` ignores the source filter and deletes the coin across all exchanges. `deleteHoldingsBySource(source)` deletes all holdings for that source.
- Chart history is truncated per-coin to never project balances before the earliest `createdAt` date for that coin.
- Rate-limit responses (HTTP 429) must preserve previous prices and display a cached-data badge, not replace prices with stale/empty data.

### XSS & escaping
- **Every** dynamic value interpolated into an HTML template literal must be wrapped in `escapeHTML()` from `src/utils/helpers.js`. This includes coin names, symbols, source names, exchange names, descriptions, URLs, search queries, and toast messages.
- Source names are additionally validated at insertion via `UNSAFE_NAME_RE = /[&<>"'`]/` in `src/utils/sources.js` and rejected if matched.
- The centralized `escapeHTML` function is the single defense. Do not add alternative escaping functions.

### API calls
- All external HTTP goes through `apiFetch()` in `src/utils/errors.js`. It always throws `ApiError` with a typed `ErrorType` on failure.
- Long-lived requests (`HoldingsTable`, `HistoryChart`, `CoinPicker`, `AddExchangeModal`) must use `AbortController` and abort stale requests on filter/period change or new fetch.
- `process.env.API_KEY` and `process.env.API_URL` are injected at build time by Webpack's `Dotenv` plugin. They are replaced with string literals in the bundle. Do not add runtime reads of `process.env`.

---

## Severity calibration

### Critical
- Data loss: any bug that corrupts, drops, or overwrites `localStorage` (`caleta_user_holdings`, `caleta_user_sources`).
- Missing `escapeHTML()` on any dynamic value in an HTML template literal.
- Hardcoded or committed API keys (pro/private tier keys, not the public demo key already in the bundle).
- Breaking the cleanup/init lifecycle (memory leaks, duplicate listeners, dangling timers).
- Removing or weakening the `AbortController` pattern in API-fetching components.

### Warning
- Missing input validation or sanitization on user-controlled fields (balance, quantity, price, coin name search).
- Race conditions: missing `AbortController` for new components that do async work.
- Accessibility regressions: removing `aria-label`, `role`, focus management, keyboard handlers, or the skip-link without equivalent replacement.
- Changing the `DEFAULT_SOURCE` constant or the view aggregation logic without updating all consumers (`HoldingsTable`, `ActionToolbar`, `chartDataAdapter`, `HistoryChart`).
- Missing `try/finally` in modal close handlers (all callbacks must always close the modal, even on throw).

### Do not flag
- Formatting differences (no linter / formatter is configured in this repo).
- Module-level `let` state in components — this is the project's documented pattern.
- `process.env` references in source code — these are build-time replacements by design.
- The `.env` file in the working tree — it is gitignored and contains a public demo key.
- Direct `localStorage` access via the `storage.js` wrapper — no IndexedDB/Service Worker migration is planned.
- `node:test` / `node:assert` as the test framework — this is the project's deliberate choice.
- Comments in Spanish — the project's primary language is Spanish.

---

## Verification expectations

### Testing
- Run `pnpm test` (alias for `node --test`) before review. It globs `src/**/*.test.js`.
- Run `pnpm typecheck` (`npx tsc --noEmit --allowJs --checkJs`) to validate JSDoc type annotations.
- Tests are co-located with source files (`.test.js` suffix). New logic in `src/utils/` requires corresponding tests.
- When mocking: `localStorage` is mocked via `globalThis.localStorage` in `beforeEach`/`afterEach`. `fetch` is mocked per test. `process.env.API_KEY` and `process.env.API_URL` must be set to mock values.
- New business rules need at least one test asserting the observable result.

### Manual verification
- Changes to `HoldingsTable`, `ActionToolbar`, `AddAssetModal`, `AddExchangeModal`, `HistoryChart`, `AllocationDonut`, `ChartDataAdapter`, or the router require a `pnpm build` + manual smoke test in the browser.
- Verify the "Caletas" (consolidated) view and a specific-source filtered view both work correctly after changes to aggregation logic.
- After changes to modal components, verify Escape key, backdrop click, and focus trap behavior (for `ConfirmDeleteModal`).
- CoinPicker must handle: empty results, network errors, rate-limit (429), debounced search, and skeleton loading states.

---

## Security & performance

### Security
- `escapeHTML()` is the single XSS defense. Verify every dynamic HTML interpolation on every touched file.
- API key (`CG-*`) is bundled into client JS. Never bundle a private/Pro tier key. The demo key has public rate limits and is acceptable for this SPA.
- No CSP, SRI, or `Referrer-Policy` is configured. Adding these is welcome but not required.
- Google Fonts load via CSS `@import`. Prefer local font files if privacy compliance becomes a concern.
- `crypto.randomUUID()` is a hard runtime requirement (Node ≥ 19, modern browsers). Do not replace with `Math.random()`.

### Performance
- Target: modern browsers (ES2020+). No polyfills. Use native APIs over libraries.
- `lightweight-charts` is the only significant third-party runtime dependency.
- SVG icons use a single sprite file (`sprite.svg`) with `<use>` references. Do not inline SVGs or add icon libraries.
- Holdings table is paginated client-side. History chart respects the `days` parameter for data windowing.
- Webpack `performance.maxEntrypointSize` and `maxAssetSize` are capped at 500 KB. Monitor build output for regressions.

---

## Review style

### Summary format
```
## Review Summary
**Risk:** [Low / Medium / High]
**Focus areas:** [2-4 areas touched by this change]
**Testing:** [what was tested and how]
```

### Comment style
- Reference exact file paths and line numbers.
- Tag severity: `[critical]`, `[warning]`, `[nit]`.
- For `[critical]` findings, include a suggested fix.
- Link to relevant architectural docs in `docs/arquitectura/` when citing patterns.
- Prefer small, explicit fixes over broad refactors.
