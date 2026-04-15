# ADR-007: Debounce en Búsquedas con Feedback Visual Inmediato

- **Estado:** Aceptada
- **Fecha:** 2026-04-15
- **Autores:** Edwin Contreras

## Contexto

El modal `AddExchangeModal` permite buscar exchanges en la API de CoinGecko. Sin protección, cada keystroke dispararía una petición HTTP, saturando el rate limit de la API (10-30 req/min) y degradando la experiencia del usuario.

## Decisión

Se implementó un **debounce de 500ms** en el input de búsqueda usando un helper genérico (`utils/helpers.js`), combinado con **skeleton loading inmediato** para dar feedback visual antes de que el debounce se resuelva.

```javascript
const optimizedSearch = debounce(searchExchanges, 500);

input.addEventListener('input', (e) => {
  // 1. Feedback visual inmediato (skeleton)
  if (searchState !== 'loading') {
    searchState = 'loading';
    renderResults(value);
  }

  // 2. Búsqueda real diferida por debounce
  optimizedSearch(value);
});
```

### Helper genérico

```javascript
// utils/helpers.js
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
```

## Consecuencias

### Positivas

- Reduce drásticamente las peticiones a la API (de N por búsqueda a 1)
- El skeleton loading inmediato da feedback de actividad al usuario sin esperar 500ms
- El helper `debounce` es genérico y reutilizable en cualquier otro componente
- Respeta los rate limits de la API pública de CoinGecko

### Negativas

- 500ms de delay adicional hasta que se ejecuta la búsqueda real
- El skeleton puede aparecer incluso si el usuario escribe rápido y la búsqueda final es rápida
- Si el input se vacía, se hace un `loadDefaultExchanges()` sin debounce (intencionalmente inmediato)

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|---|---|
| Throttle | Menos adecuado para search — puede enviar peticiones intermedias innecesarias |
| Sin debounce + caché | La API de CoinGecko no es predecible; cachear todas las posibles queries no es viable |
| Búsqueda solo con Enter | Implementada en `CoinPicker.js` como alternativa; en exchanges se prefirió búsqueda en vivo |
| RxJS / librería reactiva | Over-engineering para un único caso de uso; el helper manual es suficiente |
