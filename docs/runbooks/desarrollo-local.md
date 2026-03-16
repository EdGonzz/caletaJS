# Desarrollo Local

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
# Editar .env con los valores necesarios

# 4. Iniciar el servidor de desarrollo
pnpm start
```

El servidor arranca en `http://localhost:8080` con Hot Module Replacement (HMR) activo.

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
└── utils/            ← Helpers puros

public/
└── index.html        ← Shell HTML — editar meta tags SEO aquí
```

---

## Variables de entorno

Las variables del archivo `.env` se inyectan en el bundle via `dotenv-webpack`. Se acceden como `process.env.VARIABLE_NAME` en el código.

```bash
# .env (ejemplo)
API_KEY=tu_api_key_aqui
```

> **Nota:** Las variables de `.env` quedan expuestas en el bundle del cliente. No incluir secretos críticos.

---

## Flujo de desarrollo típico

1. **Nueva vista:** Crear `src/pages/NombrePagina.js` → exportar función → registrar en `src/router/routes.js`
2. **Nuevo componente:** Crear `src/components/MiComponente.js` → exportar render fn + `initMiComponente` si es interactivo
3. **Nuevo estilo global:** Añadir en `src/styles/main.css` (o usar clases Tailwind en el HTML)
4. **Nuevo dato:** Añadir al array en `src/utils/*Data.js`

---

*Última actualización: 2026-03-15*
