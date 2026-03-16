# SEO

---

## Estado actual del SEO

CaletaJS es una SPA con hash-based routing. Su SEO técnico es limitado por naturaleza (el contenido se genera con JavaScript), pero hay optimizaciones básicas en `public/index.html`.

---

## Implementaciones actuales

| Elemento SEO                | Implementación                                      | Archivo              |
|-----------------------------|-----------------------------------------------------|----------------------|
| `<meta charset="UTF-8">`    | ✅ Presente                                          | public/index.html    |
| `<meta name="viewport">`    | ✅ `width=device-width, initial-scale=1.0`          | public/index.html    |
| `<title>`                   | ✅ "Caleta" (estático)                               | public/index.html    |
| `lang` en `<html>`          | ✅ `lang="en"`                                      | public/index.html    |

---

## Elementos SEO faltantes (Roadmap)

| Elemento                    | Impacto    | Descripción                                                                      |
|-----------------------------|------------|----------------------------------------------------------------------------------|
| `<meta name="description">` | Alto       | Descripción de la app para SERPs y previews sociales                            |
| Open Graph tags             | Medio      | `og:title`, `og:description`, `og:image` para previews en redes sociales        |
| Twitter Cards               | Medio      | `twitter:card`, `twitter:title`, `twitter:description`                           |
| `<link rel="canonical">`    | Medio      | Evitar contenido duplicado si se despliega en múltiples dominios                |
| JSON-LD / Schema.org        | Bajo       | Datos estructurados para rich results en Google                                  |
| `<title>` dinámico          | Alto       | Cambiar `document.title` según la vista activa en el router                     |
| `robots.txt`                | Bajo       | Controlar qué paths indexa el crawler                                           |
| `sitemap.xml`               | Bajo       | Acelerar el descubrimiento de URLs por crawlers                                 |
| `favicon`                   | Bajo       | Ícono de la pestaña del navegador                                               |

---

## Consideraciones para SPAs con Hash Router

Las URLs con `#` (ej. `http://localhost:8080/#/about`) tienen un comportamiento especial para SEO:

- Los crawlers de Google **pueden** seguir URLs con hash si el contenido se renderiza sin JS.
- El contenido generado por JavaScript **puede** ser indexado por Google pero **no garantizado** para otros motores.
- Para mejorar el SEO técnico, se podría migrar a **History API** (sin hash) con un servidor que redirija todas las rutas al `index.html`.

> Cross-reference: [ADR-003 — Hash Router](../decisions/003-hash-router.md)

---

## Archivos estáticos

| Archivo      | Ubicación   | Estado    | Propósito                        |
|--------------|-------------|-----------|----------------------------------|
| `index.html` | `public/`   | ✅ Existe | Shell HTML base de la SPA        |
| `robots.txt` | `public/`   | ❌ Falta  | Directivas para crawlers         |
| `sitemap.xml`| `public/`   | ❌ Falta  | Mapa del sitio                   |
| `favicon.ico`| `public/`   | ❌ Falta  | Ícono de navegador               |

---

*Última actualización: 2026-03-15*
