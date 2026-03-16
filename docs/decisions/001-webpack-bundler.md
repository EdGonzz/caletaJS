# ADR-001: Webpack 5 como Bundler

- **Estado:** Aceptada
- **Fecha:** 2026-03-01
- **Contexto:** La aplicación necesita un bundler para procesar JavaScript ES6+, CSS con PostCSS/Tailwind, SVGs como assets, e inyectar variables de entorno.

## Contexto

CaletaJS es una SPA Vanilla JS que necesita:
- Transpilación de ES6+ via Babel
- Procesamiento de CSS con PostCSS y Tailwind v4
- Optimización del bundle para producción
- Hot Module Replacement en desarrollo
- Inyección de variables `.env` al bundle del cliente

## Decisión

Se eligió **Webpack 5** como bundler principal, configurado con:
- `babel-loader` para transpilación JS
- `css-loader` + `style-loader` + `postcss-loader` para estilos
- `asset/resource` para SVGs
- `HtmlWebpackPlugin` para generar el `index.html`
- `dotenv-webpack` para variables de entorno

## Consecuencias

### Positivas
- Configuración explícita y controlable
- Ecosistema maduro con amplia documentación
- Compatibilidad total con Babel
- HMR funcional en desarrollo

### Negativas
- Configuración más verbose que Vite
- Tiempos de build más lentos vs Vite/esbuild
- Sin soporte nativo para ES modules en dev server

## Alternativas Consideradas

| Alternativa | Razón de descarte                                                      |
|-------------|------------------------------------------------------------------------|
| Vite        | Requeriría migración completa; Webpack era conocido por el equipo     |
| Parcel      | Menos control sobre configuración; menos maduro en ecosistema         |
| esbuild     | Sin plugin ecosystem maduro para PostCSS/Tailwind en ese momento      |
| Sin bundler | No permite HMR, optimización ni procesamiento de CSS avanzado         |
