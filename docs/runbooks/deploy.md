# Deployment

Pasos requeridos para publicar CaletaJS a un entorno de producción (Vercel, Netlify, o Servidor Estático tradicional).

## Generar Bundle de Producción

1. Asegúrate de estar en la raíz de tu proyecto local y que las dependencias estén correctas.
2. Compila el código:
```bash
pnpm build
```
3. El directorio `dist/` se creará y contendrá todo lo necesario: un `index.html` base y tu `bundle.js` empaquetado y ofuscado, así como los `assets`.

## Opciones de Hospedaje Estático

### Opción A: Vercel / Netlify (Recomendado)
Puesto que es una SPA estática, no hay servidor Node involucrado.
- Enlázalo con tu repositorio (GitHub, GitLab).
- En Vercel: Define el framework preset a `Other` o `Vanilla`.
- **Comando de construcción:** `pnpm build`
- **Directorio de salida:** `dist`

### Opción B: Apache / Nginx
- Sube el contenido de la carpeta `/dist/` al directorio raíz público (`/var/www/html/` o análogo).
- No se requieren reglas estrictas de reescritura de URL (`mod_rewrite` o `try_files`) porque se emplea *Hash Routing*. Todas las subpáginas (e.g. `tusitio.com/#/about`) procesarán primero sobre `index.html`, donde el router de cliente asumirá el control.

## Variables de Entorno en Producción
Asegúrate de inyectar (en el dashboard de Vercel/Netlify, o en el servidor CI/CD) las variables:
- `API_URL`
- `API_KEY`

El script de `webpack` (a través del plugin `dotenv-webpack`) las empaquetará dentro del bundle JavaScript generado. **Nota de seguridad:** La API Key de CoinGecko quedará expuesta en el JavaScript de cliente. Considerar utilizar un backend-proxy en caso de que la clave contenga privilegios críticos o cuotas de pago elevadas.

---
*Última actualización: 2026-04-27*
