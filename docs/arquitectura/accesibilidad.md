# Accesibilidad (WCAG 2.1 AA)

---

## Implementaciones actuales

| Característica                  | Implementación                                                                               | Componente(s)                           |
|---------------------------------|----------------------------------------------------------------------------------------------|-----------------------------------------|
| `aria-label` en botones         | Todos los botones interactivos tienen `aria-label` descriptivo en español                   | Todos los componentes                   |
| `aria-label` en sección         | `<section aria-label="Holdings">` en `HoldingsTable`                                        | HoldingsTable.js                        |
| `aria-label` en tabla           | `<table aria-label="Asset holdings list">`                                                  | HoldingsTable.js                        |
| `scope="col"` en `<th>`         | Todas las cabeceras de tabla tienen `scope="col"` para lectores de pantalla                 | HoldingsTable.js                        |
| `role="dialog"`                 | El modal tiene `role="dialog"` y `aria-modal="true"`                                        | AddAssetModal.js                        |
| `aria-hidden="true"`            | El backdrop del modal está marcado como `aria-hidden` para lectores de pantalla             | AddAssetModal.js                        |
| `aria-hidden="true"` en SVGs    | Los íconos decorativos tienen `aria-hidden` para no añadir ruido semántico                 | StatCard.js, HoldingsTable.js           |
| Foco en textarea                | Al expandir el área de notas, se hace foco automático (`ta.focus()`)                        | AddAssetModal.js (wireFormView)         |
| Cierre con Escape               | `keydown` en `document` cierra el modal si `e.key === "Escape"`                            | AddAssetModal.js (initAddAssetModal)    |
| `focus:outline-none` + ring     | Todos los botones e inputs usan `focus:ring-2 focus:ring-primary/20` como outline visible  | Todos los inputs y botones              |
| `focus:ring` en coin/exchange   | Los botones de selección de coin y exchange tienen `focus:ring-2 focus:ring-primary/40`    | SelectExchange.js, AddAssetModal.js     |
| HTML Semántico                  | Uso de `<main>`, `<header>`, `<nav>`, `<article>`, `<section>`, `<table>`, `<th>`         | Header.js, Home.js, StatCard.js         |
| `<h1>` único por vista          | Cada vista tiene un único `<h1>` como cabecera principal                                   | AddAssetModal.js (FormView)             |
| `alt` en imágenes               | Todas las imágenes `<img>` tienen atributo `alt` descriptivo                               | AddAssetModal.js, SelectExchange.js     |
| `lang="en"` en HTML             | El documento declara idioma (aunque el contenido mezcla inglés y español)                  | public/index.html                       |

---

## Áreas de mejora identificadas

| Área                          | Problema                                                                   | Recomendación                                                    |
|-------------------------------|----------------------------------------------------------------------------|------------------------------------------------------------------|
| **Focus trap en modal**       | Al abrir el modal, el foco no se mueve automáticamente al primer elemento | Implementar focus trap con `tabindex` y gestión de foco al abrir |
| **`lang` attribute**          | `lang="en"` pero la interfaz tiene mezcla de EN/ES                       | Usar `lang="es"` o `hreflang` según idioma real                  |
| **Live regions**              | Sin `aria-live` para actualizaciones dinámicas (paginación, totales)     | Añadir `aria-live="polite"` al contador de total y paginación    |
| **Color contrast**            | `text-slate-400` sobre fondos oscuros puede tener bajo contraste          | Verificar con herramienta (≥4.5:1 para texto normal)             |
| **Skip links**                | Sin enlace "Saltar al contenido principal"                                | Añadir `<a href="#app" class="sr-only focus:not-sr-only">`       |
| **`<title>` dinámico**        | El `<title>` siempre es "Caleta" sin reflejar la vista actual            | Actualizar `document.title` en el router al cambiar de vista     |

---

## Navegación por teclado

| Elemento                         | Comportamiento de teclado                               |
|----------------------------------|---------------------------------------------------------|
| Links de navegación (Header)     | Tab + Enter navegan entre rutas                        |
| Botones de paginación            | Tab + Enter/Space cambian de página                    |
| Modal (apertura)                 | Activado via botón "Add Funds" con Tab + Enter         |
| Modal (cierre)                   | Escape cierra el modal                                 |
| Modal (backdrop click)           | Click en backdrop cierra el modal                      |
| Inputs del formulario            | Tab navega entre campos; Enter en submit               |
| Buscadores (coin / exchange)     | Tab + tipo → filtra la lista en tiempo real           |
| Botones de selección             | Tab + Enter selecciona el ítem                         |

---

*Última actualización: 2026-03-15*
