# Deploy

---

## Proceso de Build

```bash
# Generar bundle de producción
pnpm build
```

El output se genera en `/dist`:
```text
dist/
├── index.html       # HTML generado por HtmlWebpackPlugin
├── bundle.js        # JS minificado y optimizado
└── *.svg            # Assets SVG con hash de contenido
```

---

## Opciones de Deploy

CaletaJS es una SPA con hash router — puede desplegarse en **cualquier static host** sin configuración especial de servidor. No requiere fallback de rutas porque el hash router funciona client-side.

### GitHub Pages

```bash
# 1. Construir
pnpm build

# 2. Opción A: Deploy manual
# Subir contenido de /dist al branch gh-pages

# 3. Opción B: GitHub Actions
# Crear .github/workflows/deploy.yml (ver abajo)
```

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 10
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

### Netlify

1. Conectar repositorio en [netlify.com](https://netlify.com)
2. Configurar:
   - **Build command:** `pnpm build`
   - **Publish directory:** `dist`
   - **Node version:** 18 o superior
3. Deploy automático en cada push a `main`

> **Variables de entorno:** Configurarlas en Netlify → Site Settings → Environment Variables

---

### Vercel

```bash
# Instalar Vercel CLI
pnpm dlx vercel

# Deploy desde la raíz del proyecto
vercel --prod
```

Configuración en `vercel.json` (si necesario):

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist"
}
```

---

### Surge.sh (Deploy rápido)

```bash
# Instalar surge
pnpm dlx surge

# Build + Deploy
pnpm build && surge dist/ mi-caleta.surge.sh
```

---

## Checklist pre-deploy

- [ ] `pnpm build` completa sin errores
- [ ] Verificar que `dist/index.html` existe
- [ ] Variables de entorno configuradas en el host (si aplica)
- [ ] Verificar que el bundle no incluye datos sensibles del `.env`
- [ ] Probar el build localmente: `npx serve dist/`

---

*Última actualización: 2026-03-15*
