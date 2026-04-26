# Cómo Agregar una Nueva Ruta o Vista

Sigue este proceso estructurado para introducir una nueva "página" completa dentro de la Single Page Application (SPA).

## Paso 1: Crear el Componente Visual

1. Navega a `src/pages/`.
2. Crea un archivo JS, por ejemplo `NuevaVista.js`.
3. Exporta una función que retorne el HTML (Template Literal).
4. Exporta una función de inicialización si es que la vista va a requerir eventos de DOM.

```javascript
// src/pages/NuevaVista.js
export const initNuevaVista = () => {
  const btn = document.getElementById('btn-accion');
  if(btn) {
    btn.addEventListener('click', () => alert('Acción disparada'));
  }
}

const NuevaVista = () => {
  return `
    <div class="glass-panel p-6">
      <h1 class="text-white text-2xl">Nueva Vista</h1>
      <button id="btn-accion" class="btn-primary mt-4">Acción</button>
    </div>
  `;
}

export default NuevaVista;
```

## Paso 2: Registrar el Hash en `resolveRoutes.js`

Edita `src/utils/resolveRoutes.js` para crear la correspondencia entre la URI del navegador (`#/nueva-vista`) y una llave estática.

```javascript
// src/utils/resolveRoutes.js
const resolveRoutes = (route) => {
  if (route === '/') return '/';
  if (route === '/about') return '/about';
  if (route === '/nueva-vista') return '/nueva-vista'; // <--- AGREGAR
  // ...
  return `/${route}`;
};
export default resolveRoutes;
```

## Paso 3: Mapear la Llave al Componente en `routes.js`

Edita el enrutador principal en `src/router/routes.js`. Importa tu nueva vista y su método de inicialización.

```javascript
// src/router/routes.js
import NuevaVista, { initNuevaVista } from '../pages/NuevaVista';

const routes = {
  '/': Home,
  '/about': About,
  '/nueva-vista': NuevaVista, // <--- AGREGAR RUTA Y COMPONENTE
};

const initFunctions = {
  '/': initHome,
  '/nueva-vista': initNuevaVista, // <--- AGREGAR INICIALIZADOR
}

const router = async () => {
  // lógica de ruteo existente...
  let render = routes[route] ? routes[route] : Error404;
  content.innerHTML = await render();

  // Llamar al inicializador si existe
  if (initFunctions[route]) {
    initFunctions[route]();
  }
};
```

## Paso 4: Agregar Enlace de Navegación

Ve a `src/components/Header.js` y agrega el enlace, asegurándote de usar correctamente el hash (`href="#/nueva-vista"`).

---
*Última actualización: 2026-04-26*
