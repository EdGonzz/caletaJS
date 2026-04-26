# Troubleshooting y Solución de Problemas

Guía de soluciones comunes durante el desarrollo o en tiempo de ejecución.

## Problemas de Desarrollo

### 1. `pnpm start` arroja error de puerto o host
**Síntoma:** El servidor arranca pero se cierra con un error de dirección ya en uso (EADDRINUSE) o problemas de localhost (Invalid Host Header).
**Causa:** El puerto `8080` (o el indicado en `.env`) ya está en uso por otro proceso, o hay conflicto de dominios locales.
**Solución:** 
- Cambia la variable `PORT` en el `.env` (ej. `PORT=3000`).
- Verifica la configuración de `allowedHosts: ['.localhost']` en `webpack.config.js`.

### 2. Cambios en CSS (Tailwind) no se ven reflejados
**Síntoma:** Agregas una clase como `bg-red-500` pero en el navegador sigue transparente, a pesar del Auto-Reload.
**Causa:** A veces `postcss-loader` o Tailwind v4 se quedan bloqueados en caché o el componente no está incluido correctamente.
**Solución:**
- Detén el servidor (Ctrl+C) y vuélvelo a ejecutar.
- Tailwind v4 inspecciona recursivamente la carpeta actual. Si hay problemas severos, revisa dependencias: `pnpm update @tailwindcss/postcss tailwindcss`.

## Problemas en Tiempo de Ejecución (UI/Lógica)

### 3. Event listeners no funcionan en modales o listas
**Síntoma:** Haces clic en un botón (`AddAssetModal`) y no ocurre nada, no hay errores en consola.
**Causa:** El elemento no existía en el DOM al momento de ejecutar `document.getElementById()`. Esto ocurre cuando la función de `init()` se llama **antes** de renderizar el componente o actualizar un `innerHTML`.
**Solución:**
- Revisa el flujo asíncrono. Por ejemplo en paginación (`HoldingsTable.js`): después de inyectar nuevas filas con `tbody.innerHTML`, debes volver a suscribir eventos a los botones generados.
- Asegúrate de que los identificadores (`id="..."`) sean consistentes y únicos.

### 4. Peticiones a CoinGecko fallan sistemáticamente (429 Too Many Requests)
**Síntoma:** Errores 429 en la pestaña Network, gráficos que no cargan, listas vacías.
**Causa:** Exceso de límite de la API gratuita. O ausencia de la cabecera del token.
**Solución:**
- Confirma que el archivo `.env` tiene `API_KEY` correcta, y el loader `dotenv-webpack` la está inyectando.
- Modifica el uso de la API. Cerciórate de estar empleando los mecanismos de **Debounce** (ver patrón en `src/pages` y modales) para retrasar llamadas masivas al teclear en inputs de búsqueda.

---
*Última actualización: 2026-04-26*
