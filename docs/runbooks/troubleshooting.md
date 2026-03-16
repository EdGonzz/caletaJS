# Troubleshooting

Problemas comunes y sus soluciones en el desarrollo de CaletaJS.

---

## El servidor de desarrollo no inicia

**Síntomas:** `pnpm start` falla o no abre el navegador.

**Soluciones:**

```bash
# 1. Verificar que las dependencias estén instaladas
pnpm install

# 2. Verificar que el puerto 8080 no esté ocupado
lsof -i :8080
# Si está ocupado, editar webpack.config.js → devServer: { port: 3000 }

# 3. Borrar caché de webpack
rm -rf dist/ .cache/
pnpm start

# 4. Nuclear option
pnpm dlx /nuke  # o ver workflow /nuke
```

---

## Los estilos de Tailwind no se aplican

**Síntomas:** Las clases de Tailwind no tienen efecto visual.

**Soluciones:**

1. Verificar que `tailwind.config.js` incluya los paths correctos:
```javascript
content: [
  "./src/**/*.{html,js}",
  "./public/index.html"
]
```

2. Verificar que `main.css` tiene la directiva correcta para Tailwind v4:
```css
@import "tailwindcss";
```

3. Verificar que `postcss.config.js` usa el plugin correcto:
```javascript
module.exports = {
  plugins: { "@tailwindcss/postcss": {} }
};
```

---

## Los event listeners no funcionan después de navegar

**Síntomas:** Botones o inputs no responden al hacer click tras usar el router hash.

**Causa:** El router reemplaza `innerHTML` del `#app`, destruyendo todos los listeners previos.

**Solución:** Asegurarse de que la función `init*` de cada componente interactivo se llame en el router **después** de `root.innerHTML = await render()`:

```javascript
// routes.js
root.innerHTML = await render();
if (path === "/") {
  initHoldingsTable();    // ← ¿Está siendo llamado?
  initAddAssetModal();    // ← ¿Está siendo llamado?
}
```

---

## El modal no se abre al hacer click en "Add Funds"

**Síntomas:** El botón `#add-funds` no dispara el modal.

**Causa más probable:** `initAddAssetModal()` no se está llamando, o el botón no existe en el DOM cuando se llama.

**Debug:**

```javascript
// En DevTools Console
document.getElementById("add-funds")       // ¿Devuelve el botón?
document.getElementById("add-asset-modal") // ¿Devuelve el modal?
```

---

## Las variables de `.env` son `undefined` en runtime

**Síntomas:** `process.env.MI_VARIABLE` es `undefined`.

**Soluciones:**

1. Verificar que el archivo `.env` existe en la raíz del proyecto
2. Verificar que la variable está definida sin espacios: `MI_VARIABLE=valor`
3. Reiniciar el servidor de desarrollo (dotenv-webpack carga al iniciar, no en hot reload)
4. Verificar que `dotenv-webpack` está instalado: `pnpm list dotenv-webpack`

---

## El build de producción falla

**Síntomas:** `pnpm build` lanza errores.

**Soluciones:**

```bash
# Verificar errores de sintaxis JS
npx eslint src/ --ext .js

# Limpiar y rebuildar
rm -rf dist/
pnpm build

# Ver el error completo
pnpm build 2>&1 | tail -50
```

---

## Los SVGs del sprite no se renderizan

**Síntomas:** Los iconos aparecen en blanco o con un área vacía.

**Causa:** Webpack procesa SVGs como `asset/resource` (URL), pero si el path del sprite no es correcto, el `<use href>` falla.

**Debug:**

```javascript
// En DevTools → Network, verificar que sprite.svg se carga (200 OK)
// En DevTools → Elements, verificar que href del <use> apunta a una URL válida
// ejemplo: href="/static/media/sprite.abc123.svg#search"
```

---

*Última actualización: 2026-03-15*
