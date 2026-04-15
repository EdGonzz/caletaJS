# Desarrollo Local

> Última actualización: 2026-04-15

## Prerequisitos

| Herramienta  | Versión mínima | Instalación                          |
|--------------|----------------|--------------------------------------|
| Node.js      | 18.x o superior| https://nodejs.org                   |
| pnpm         | 10.x           | `npm install -g pnpm`               |
| Git          | Cualquiera     | https://git-scm.com                  |

> **⚠️ Importante:** No usar `npm` ni `yarn`. Este proyecto usa **pnpm** como package manager.

---

## Setup inicial

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd caleta

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env   # Si existe .env.example
# Editar .env con tus valores
```

### Variables de entorno requeridas

```bash
# .env
API_KEY=tu_api_key_de_coingecko
API_URL=https://api.coingecko.com/api/v3
```

> **Nota:** Las variables del `.env` se inyectan al bundle vía `dotenv-webpack`. Se acceden como `process.env.API_KEY` en el código. Quedan expuestas en el bundle del cliente — no incluir secretos críticos.

---

## Iniciar el servidor

```bash
pnpm start
```

El servidor arranca con `portless` (asigna un puerto disponible automáticamente) ejecutando `webpack server --mode development` con HMR activo. Si el puerto 8080 está disponible, lo usará por defecto.

---

## Comandos comunes

| Comando         | Descripción                                              |
|-----------------|----------------------------------------------------------|
| `pnpm start`    | Inicia webpack-dev-server en modo development (HMR)     |
| `pnpm build`    | Genera bundle de producción optimizado en `/dist`       |
| `pnpm install`  | Instala o actualiza dependencias del `package.json`     |

---

## Estructura de archivos relevante para desarrollo

```text
src/
├── index.js          ← Entry point, no tocar sin razón
├── router/routes.js  ← Añadir nuevas rutas aquí
├── pages/            ← Añadir nuevas vistas aquí
├── components/       ← Componentes reutilizables
├── utils/            ← Helpers puros
└── styles/main.css   ← Design tokens y CSS global

public/
└── index.html        ← Shell HTML — editar meta tags SEO aquí
```

---

## Flujo de desarrollo típico

1. **Nueva vista:** Crear `src/pages/NombrePagina.js` → exportar función → registrar en `src/router/routes.js`
2. **Nuevo componente:** Crear `src/components/MiComponente.js` → exportar render fn + `initMiComponente` si es interactivo
3. **Nuevo estilo global:** Añadir en `src/styles/main.css` (o usar clases Tailwind en el HTML)
4. **Nueva utilidad:** Añadir en `src/utils/` como función pura
5. **Nuevo ícono:** Agregar `<symbol>` en `src/assets/sprite.svg`
