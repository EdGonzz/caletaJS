# Desarrollo Local

Este documento detalla los pasos para instalar y ejecutar el proyecto localmente.

## Prerrequisitos

- **Node.js**: v18.0.0 o superior (recomendado gestor de versiones como `nvm` o `fnm`).
- **pnpm**: v10.x. **No usar npm o yarn**. (Instalar vía `corepack enable pnpm` o npm `npm i -g pnpm@10`).

## Instalación

1. Clona el repositorio.
2. Posiciónate en la carpeta del proyecto.
3. Instala las dependencias estricta y únicamente con `pnpm`:

```bash
pnpm install
```

## Configuración de Entorno

Crea un archivo `.env` en la raíz del proyecto para definir las claves de API (de CoinGecko u otros servicios):

```env
PORT=8080
API_URL=https://api.coingecko.com/api/v3
API_KEY=tu_clave_de_demo_aqui
```

*(Nota: `.env` debe estar excluido en `.gitignore`)*

## Comandos Principales

| Comando | Acción |
|---|---|
| `pnpm start` | Inicia el Webpack Dev Server en `http://localhost:8080` con soporte para Hot Module Replacement (HMR). |
| `pnpm build` | Compila y minifica el código JS y CSS en el directorio de salida `/dist`. |

## Consideraciones de Arquitectura en Desarrollo Local

- No se requiere compilar TailwindCSS por separado debido a que usa la integración nativa `@tailwindcss/postcss` combinada con `postcss-loader` en la cadena de reglas de webpack. Simplemente al iniciar el proyecto, se generan las clases bajo demanda.
- Si un cambio en `src/styles/main.css` o `index.html` no se refleja, puede ser útil vaciar el caché o reiniciar el servidor (Ctrl+C y `pnpm start` nuevamente).

---
*Última actualización: 2026-04-26*
