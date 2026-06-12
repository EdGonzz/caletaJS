# ADR-021: Búsqueda en Tiempo Real y Ordenamiento en Tabla de Holdings

- **Estado:** Aceptada
- **Fecha:** 2026-06-12
- **Contexto:** La tabla de holdings necesitaba búsqueda textual y ordenamiento por columnas para que el usuario pudiera localizar y organizar sus activos eficientemente. Adicionalmente, se requería feedback visual durante cargas y reseteo de estado al cambiar de filtro.

## Contexto

La `HoldingsTable` mostraba todos los activos en orden fijo (por balance), sin capacidad de filtrar o reordenar. A medida que un portafolio crece (10+, 20+ activos), esto se vuelve inmanejable. Los requerimientos eran:

1. **Búsqueda textual en tiempo real** por nombre y símbolo de criptomoneda, sin necesidad de presionar Enter.
2. **Ordenamiento por columnas** (Asset, Price, 24h%, Balance, Value) con indicadores visuales de dirección.
3. **UX fluida:** animaciones CSS en la expansión/contracción de la barra de búsqueda, skeletons durante cargas, y reseteo automático de estado al cambiar de wallet.
4. **Accesibilidad:** indicadores ARIA en cabeceras de ordenamiento y soporte completo de teclado en la búsqueda.

## Decisión

Se implementó un pipeline de procesamiento de datos y una UI de búsqueda/ordenamiento autocontenida en `HoldingsTable.js`.

### 1. Pipeline de Datos (`getProcessedData`)

Los datos crudos (`apiData`) pasan por un pipeline de 2 etapas antes de mostrarse:

```javascript
const getProcessedData = () => {
  let result = [...apiData];

  // Etapa 1: Filtro de búsqueda (case-insensitive sobre name y symbol)
  if (searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    result = result.filter(h =>
      (h.name?.toLowerCase().includes(query)) ||
      (h.symbol?.toLowerCase().includes(query))
    );
  }

  // Etapa 2: Ordenamiento (name: string, resto: numérico)
  if (sortColumn) {
    result.sort((a, b) => {
      if (sortColumn === 'name') {
        // Comparación alfabética
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else {
        // Comparación numérica (price, change24h, balance, value)
        valA = Number(a[sortColumn]) || 0;
        valB = Number(b[sortColumn]) || 0;
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }

  return result;
};
```

Este diseño permite añadir nuevas etapas (ej: filtro por rango de precios, por exchange) sin reestructurar el código.

### 2. Barra de Búsqueda Colapsable

En lugar de un input siempre visible (que consume espacio horizontal), se implementó un input que se expande/contrae con animación CSS:

```
Estado colapsado:            Estado expandido:
┌──────────────────┐        ┌─────────────────────────────┐
│ Holdings       🔍 │  →    │ Holdings   🔍[Buscar...    ✕]│
└──────────────────┘        └─────────────────────────────┘
```

- **Animación:** transiciones CSS en `width` (`w-0` → `w-40 sm:w-56`), `opacity`, y `pointer-events`
- **Reposicionamiento:** El botón de lupa se convierte en ícono decorativo estático dentro del input
- **Cierre:** Botón X visible solo en estado expandido; tecla Escape también cierra
- **Búsqueda en tiempo real:** `input` event dispara `refreshTableData(true)` en cada tecla

**Funciones clave:**
- `bindSearchAndSortEvents()`: registra listeners de apertura, cierre, input, y Escape
- `collapseSearchUI()`: helper extraído para reutilizar en cierre manual y reseteo por cambio de wallet

### 3. Ordenamiento por Columnas con Ciclo de 2 Estados

Cada columna ordenable sigue un ciclo de 2 estados según su tipo:

| Tipo de columna | Estado inicial | Click 1 | Click 2 |
|---|---|---|---|
| **name** (texto) | asc ↑ | desc ↓ | asc ↑ |
| **price, 24h%, balance, value** (numérico) | desc ↓ | asc ↑ | desc ↓ |

Los numéricos empiezan en descendente porque el caso de uso principal es ver "mayor balance/valor primero".

**Indicadores ARIA en cabeceras:**
```html
<!-- Columna activa (orden ascendente) -->
<th aria-sort="ascending">
  <button aria-label="Ordenar por Price (siguiente: descendente)">
    <span>Price</span>
    <svg class="text-primary opacity-100"><use href="#arrow-upward"/></svg>
  </button>
</th>

<!-- Columna inactiva -->
<th aria-sort="none">
  <button aria-label="Ordenar por Balance (descendente)">
    <span>Balance</span>
    <svg class="opacity-30"><use href="#arrow-downward"/></svg>
  </button>
</th>
```

`updateSortHeaders()` recorre todas las cabeceras después de cada cambio de ordenamiento para mantener los indicadores visuales y ARIA sincronizados.

### 4. Skeleton Loading States en Tabla

Al iniciar la tabla o cambiar de wallet/filtro, se muestran filas fantasma (skeleton screens) mientras se fetchean los precios:

```javascript
const TableSkeletonRow = () => `
  <tr class="animate-pulse" aria-hidden="true">
    <td><div class="skeleton-shimmer h-8 w-8 rounded-full"/></td>
    <td><div class="skeleton-shimmer h-4 w-20 rounded"/></td>
    ...
  </tr>
`;

const renderTableSkeletons = (count) =>
  Array.from({ length: count }, () => TableSkeletonRow()).join('');
```

- `animate-pulse` + `skeleton-shimmer` (animación CSS definida en `main.css`)
- `aria-hidden="true"` para que lectores de pantalla ignoren el contenido fantasma
- Se usan en carga inicial, cambio de wallet, y cualquier escenario donde `tbody` quede vacío temporalmente

### 5. Reset de Estado al Cambiar de Filtro

Al recibir el evento `caleta-filter-changed` (ADR-012), la tabla resetea estado para evitar inconsistencias:

```javascript
_filterHandler = (e) => {
  activeFilter = e.detail.source;

  // Reset búsqueda si estaba activa — evita resultados del wallet anterior
  if (searchQuery !== '') {
    searchQuery = '';
    collapseSearchUI();
  }

  // Reset página — evita página vacía si nuevo wallet tiene menos páginas
  table.dataset.currentPage = '1';

  // Skeletons mientras se cargan datos del nuevo filtro
  tbody.innerHTML = renderTableSkeletons(pageSize);
  paginationEl.innerHTML = '';

  fetchPricesAndUpdate();
};
```

## Consecuencias

### Positivas
- **Pipeline extensible:** `getProcessedData()` permite añadir nuevas etapas de filtrado/ordenamiento sin tocar el resto del código.
- **UX de búsqueda no intrusiva:** La barra colapsable no ocupa espacio permanente, reduciendo el clutter visual en el header.
- **Ordenamiento intuitivo:** El ciclo de 2 estados por tipo de columna es predecible: nombres van A→Z→A, valores van mayor→menor→mayor.
- **Accesibilidad:** `aria-sort` en cabeceras, `aria-label` dinámico con el próximo estado, y `aria-hidden` en skeletons.
- **Sin condiciones de carrera:** El estado de búsqueda y página se resetea al cambiar de filtro, evitando vistas inconsistentes.
- **Feedback inmediato:** Skeletons durante cargas eliminan la percepción de "pantalla congelada".

### Negativas
- **Renderizado completo en cada búsqueda:** `refreshTableData(true)` re-renderiza todas las filas y la paginación en cada tecla. Con datasets pequeños (<100 activos) esto no es problema, pero con cientos de activos requeriría virtualización o debounce.
- **Sin debounce en búsqueda:** Cada pulsación dispara un re-renderizado. Para datasets grandes, sería recomendable añadir `setTimeout` de 150-200ms como en ADR-007.
- **Estado disperso:** `searchQuery`, `sortColumn`, y `sortDirection` viven como closures en `initHoldingsTable()`, no en un store centralizado.
- **Complejidad de cleanup:** Se registran 7 handlers (búsqueda, sort, asset actions) que deben limpiarse individualmente en `cleanupHoldingsTable()`.

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| Input de búsqueda siempre visible | Consume espacio horizontal valioso en móvil; añade clutter cuando no se necesita. |
| Ordenamiento de 3 estados (asc → desc → none) | Añade complejidad innecesaria; el usuario siempre quiere algún orden. |
| Delegación de eventos en `tbody` | La tabla ya usa delegación para acciones de fila; añadir búsqueda/sort por delegación mezclaría responsabilidades. |
| Debounce en búsqueda | Posponible. Con el volumen actual de datos (<50 activos), el re-renderizado es instantáneo. |

## Relación con ADRs Existentes

- **ADR-011** (Lazy loading skeletons): El patrón de `TableSkeletonRow` + `renderTableSkeletons` extiende el concepto de skeletons contenidos al contexto de tabla, manteniendo la estructura del `table`/`thead` mientras el `tbody` muestra placeholders.
- **ADR-012** (Filtrado dinámico): La tabla escucha `caleta-filter-changed` y resetea búsqueda + página. Este es el primer consumidor del evento que implementa cleanup de estado derivado.
- **ADR-007** (Debounce búsquedas): La búsqueda en tabla no usa debounce (los datos ya están en memoria), pero si en el futuro se busca contra API, se aplicaría el mismo patrón de 150ms documentado en ADR-007.
- **ADR-019** (Manejo de errores): La tabla maneja fallos de API mostrando badge "Caché" y toast de advertencia, integrado con el sistema de `ApiError` y `ErrorType`.

---
*Última actualización: 2026-06-12*
