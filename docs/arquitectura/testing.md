# Testing en CaletaJS

Actualmente la arquitectura no integra un framework de test automatizado configurado a nivel de package.json.
Sin embargo, dado el estilo arquitectónico de "Funciones puras", las piezas son inherentemente testeables de manera unitaria con frameworks estándar como Jest o Vitest.

## Estrategia de Prueba (A Desarrollar)

### 1. Pruebas Unitarias de Componentes (Strings)
Puesto que `AssetRow(data)` o `StatCard(title, value)` retornan simplemente strings literales, los test asegurarían que, con ciertas entradas JSON, las cadenas de salida contienen el HTML esperado, las clases correctas, y los datos interpolados.

Ejemplo hipotético:
```javascript
// StatCard.test.js
import StatCard from './StatCard';

test('renders title and value', () => {
  const result = StatCard('Balance', '$1000');
  expect(result).toContain('<h3>Balance</h3>');
  expect(result).toContain('<p>$1000</p>');
});
```

### 2. Pruebas de Eventos (DOM/Integración)
Para componentes que exigen `init*()`, las pruebas deben inyectar el HTML pre-generado en un DOM virtual (`jsdom`), llamar al método `init()`, simular eventos como un "clic" en paginación o un "input" en el buscador, y asertar cambios de estado usando selectores de Vanilla JS (`document.querySelector`).

---
*Última actualización: 2026-04-27*
