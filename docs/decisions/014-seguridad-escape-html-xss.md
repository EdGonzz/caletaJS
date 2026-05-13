# ADR-014: Prevención de XSS mediante Escapado de HTML

- **Estado:** Aceptada
- **Fecha:** 2026-05-11
- **Contexto:** La arquitectura basada en template literals (strings) para componentes facilita la inyección de código malicioso si los datos provenientes de entradas del usuario o de APIs externas no son saneados antes de ser insertados en el DOM. Se detectó una vulnerabilidad potencial en `AddExchangeModal.js`.

## Contexto
En `AddExchangeModal.js`, los datos como nombres de exchanges, URLs y términos de búsqueda se inyectaban directamente en el HTML:
```javascript
<p>${exchange.name}</p>
```
Si un atacante lograra que la API retornara un nombre como `<img src=x onerror=alert(1)>`, el script se ejecutaría en el navegador del usuario.

## Decisión
1. Crear una función de utilidad `escapeHTML` en `src/utils/helpers.js` que reemplaza caracteres especiales (`&`, `<`, `>`, `"`, `'`) por sus entidades HTML equivalentes.
2. Aplicar `escapeHTML` a todos los campos dinámicos en los componentes que generan HTML mediante strings, especialmente en `AddExchangeModal.js`.
3. Extender el uso de esta función a atributos HTML como `aria-label`, `alt`, `src` (cuando provienen de inputs) y atributos `data-*`.

## Consecuencias

### Positivas
- **Seguridad:** Se mitiga el riesgo de ataques Cross-Site Scripting (XSS) persistentes y reflejados.
- **Robustez:** La aplicación maneja correctamente caracteres especiales que de otro modo podrían romper el marcado HTML.

### Negativas
- **Mantenimiento:** Los desarrolladores deben recordar aplicar la función `escapeHTML` manualmente, ya que no hay un motor de plantillas que lo haga automáticamente (como React o Handlebars).

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| Usar `textContent` | Difícil de aplicar en el flujo actual donde todo el componente se construye como un solo string antes de inyectarse. |
| Librería de Saneado (DOMPurify) | Añadiría peso innecesario al bundle para una funcionalidad que se puede resolver con un helper simple de regex. |

---
*Última actualización: 2026-05-13*
