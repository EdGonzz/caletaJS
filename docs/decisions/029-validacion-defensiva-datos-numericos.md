# ADR-029: Validación Defensiva de Datos Numéricos de localStorage

- **Estado:** Aceptada
- **Fecha:** 2026-08-16
- **Contexto:** Los datos de transacciones almacenados en localStorage (`caleta_user_holdings`) pueden contener valores numéricos corruptos: strings no numéricos (ej. `"1.5"` en vez de `1.5`), `NaN`, o `Infinity`. Las funciones de utilidades y componentes que operan sobre estos datos usaban el operador `??` (nullish coalescing) como protección, pero este solo cubre `null`/`undefined` — no protege contra strings, `NaN`, ni `Infinity`.

## Contexto

Los datos en localStorage provienen de:
1. **Escritura propia:** `holdingsStorage.js` serializa con `JSON.stringify()`, que preserva tipos nativos.
2. **Edición manual del usuario:** El usuario puede editar localStorage directamente desde DevTools, introduciendo strings en campos numéricos.
3. **Versiones anteriores de la app:** Migraciones de esquema previas pueden haber dejado datos con tipos incorrectos.

Los síntomas observados (code review 2026-08-04):

| Hallazgo | Ubicación | Problema |
|----------|-----------|----------|
| W3 | `PortfolioPicker.js:36,44` | `.toFixed(8)` lanza `RangeError` si el valor es `NaN`, `Infinity`, o un string no numérico. |
| W5 | `transactionUtils.js:120-121` | `(tx.balance ?? 0) * (tx.price ?? 0)` produce `NaN` si los datos son strings no numéricos. |
| W8 | `AddAssetModal.js:725-726` | `parsedPrice <= 0` es `false` cuando `parsedPrice` es `NaN` (cualquier comparación con `NaN` retorna `false`), por lo que el mensaje de error específico no se muestra. |

## Decisión

Se adopta un patrón de **validación defensiva de datos numéricos** en tres capas:

### Capa 1: Coerción explícita a `Number()`

Antes de operaciones aritméticas, se convierte explícitamente el valor a número:

```javascript
// Antes (W5):
const totalCost = entries.reduce((sum, tx) => sum + (tx.balance ?? 0) * (tx.price ?? 0), 0);

// Después:
const bal = Number(tx.balance);
const px = Number(tx.price);
return sum + (Number.isFinite(bal) ? bal : 0) * (Number.isFinite(px) ? px : 0);
```

### Capa 2: Validación con `Number.isFinite()`

Antes de formateo (`toFixed`) y en validaciones de entrada, se verifica finitud:

```javascript
// Antes (W3):
const safeNet = (coin.netBalance ?? 0).toFixed(8);

// Después:
const safeNet = Number.isFinite(coin.netBalance) ? coin.netBalance : 0;
```

### Capa 3: Detección de NaN en validaciones de formulario

En validaciones de precio (Transfer), se reemplaza la doble negación por `Number.isFinite()`:

```javascript
// Antes (W8):
if (parsedPrice <= 0 && !isNaN(parsedPrice)) { /* error */ }

// Después:
if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) { /* error */ }
```

### Convención de nomenclatura

Las variables con validación aplicada se nombran con prefijo `safe` para indicar que garantizan un valor numérico válido:

```javascript
const safeNet = Number.isFinite(coin.netBalance) ? coin.netBalance : 0;
const safeBal = Number.isFinite(s.balance) ? s.balance : 0;
```

### Ubicación de la validación

La validación se aplica en el **punto de consumo**, no en el punto de escritura. Razones:
- Evita acoplar la capa de persistencia con la lógica de presentación.
- Permite que diferentes consumidores apliquen distintas políticas (ej. `PortfolioPicker` muestra `0`, `AddAssetModal` muestra mensaje de error).
- Es más fácil de auditar: se busca `Number.isFinite` en el código para encontrar todos los puntos de protección.

## Consecuencias

### Positivas

- **Protección contra datos corruptos:** La app no crashea ni muestra valores incorrectos si localStorage contiene strings, `NaN`, o `Infinity`.
- **NaN detectado correctamente en formularios:** La validación de precio en Transfer ahora muestra el mensaje específico "precio no determinado" cuando el valor es `NaN`, en vez del mensaje genérico.
- **Cost basis preciso:** `getAverageCostBasis()` no produce `NaN` silenciosos que contaminan cálculos posteriores.
- **Auditable:** Buscar `Number.isFinite` en el codebase identifica todos los puntos de protección. Buscar `?? 0` identifica los puntos que aún podrían necesitar protección (si se asume que el dato siempre es numérico).
- **Sin dependencias externas:** Usa exclusivamente APIs nativas de JavaScript (`Number()`, `Number.isFinite()`).

### Negativas

- **Verbosidad adicional:** Cada punto de consumo agrega 1-2 líneas de validación. Aceptable para la seguridad que provee.
- **Silenciamiento de errores:** Los valores inválidos se sustituyen por `0` (en componentes) o se rechazan (en formularios), sin logging. Si la corrupción es frecuente, el usuario no lo sabrá. Mitigación: los tests de atomicidad (W1) protegen contra la causa raíz (escrituras parciales).
- **No es un schema validator:** No valida la estructura completa del objeto, solo los campos numéricos que se consumen. Si hay otros campos corruptos, este patrón no los detecta.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| **Zod / Yup en el punto de lectura** | Dependencia externa para un caso de uso limitado. `Number.isFinite()` cubre el 100% de los casos numéricos sin overhead. |
| **Validación en el punto de escritura (`holdingsStorage.js`)** | Mezcla persistencia con lógica de presentación. Diferentes consumidores necesitan diferentes políticas (mostrar `0` vs mostrar error). |
| **`typeof x === 'number'`** | No detecta `NaN` ni `Infinity`, que son de tipo `number`. `Number.isFinite()` es superior para validación numérica. |
| **`parseFloat()` en vez de `Number()`** | `parseFloat("123abc")` retorna `123` (silencioso). `Number("123abc")` retorna `NaN` (explícito). Se prefiere `Number()` por su estrictud. |
| **Schema migration en localStorage** | Requeriría un sistema de versionado de esquemas y migración automática. Over-engineering para el volumen actual. |

## Relación con ADRs Existentes

- **ADR-025** (transactionUtils): `getAverageCostBasis()` es uno de los consumidores principales de esta validación. La coerción a `Number()` + `Number.isFinite()` protege el cálculo de cost basis promedio.
- **ADR-028** (getBalanceDelta): `getBalanceDelta()` usa `tx.balance ?? 0`. Este ADR sugiere que, si los datos pudieran ser corruptos, también debería aplicar `Number()`.
- **ADR-014** (escapeHTML): Patrón análogo — validación defensiva en el punto de consumo para proteger contra datos malformados.

---
*Última actualización: 2026-08-16*
