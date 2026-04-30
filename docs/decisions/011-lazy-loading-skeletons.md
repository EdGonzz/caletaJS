# ADR-011: Lazy Loading de Skeletons Contenidos (Prevención de Layout Shift)

- **Estado:** Aceptada
- **Fecha:** 2026-04-30
- **Contexto:** Componentes asíncronos en UI (CoinPicker, SelectExchange)

## Contexto
Durante la optimización de los modales y el selector de monedas (`CoinPicker`), implementamos *Lazy Loading* para evitar consultas innecesarias al abrir la aplicación. Esto requirió mostrar un estado de carga (`SelectLoading(10)`) mientras se esperaban los resultados de CoinGecko. Sin embargo, reemplazar el contenido general por estos "esqueletos" sin envoltorios causaba un *Layout Shift* severo: el modal tomaba todo el tamaño vertical (expansión abrupta) y luego saltaba al redimensionarse al cargar la vista real.

## Decisión
Se decidió que los estados de carga (skeletons) no deben reemplazar vistas completas sin su contenedor restrictivo. 

En su lugar, los componentes de interfaz (como `CoinPicker`) deben aceptar un parámetro `isLoading`. Al inicializarse en `true`, el componente renderiza toda su estructura base estática (headers, inputs deshabilitados, bordes y contenedores con `max-height`) y sólo reemplaza el listado interno por los `Skeletons`.

## Consecuencias

### Positivas
- **UX más suave:** Se elimina por completo el Layout Shift al cargar el modal.
- **Interactividad anticipada:** Los usuarios pueden ver y usar botones como "Volver" o "Cerrar" incluso durante la carga, ya que la UI estructural y los `init` funcionales están presentes.
- **Componentes más robustos:** El componente es dueño completo de su presentación en todos los estados (Loading, Empty, Data).

### Negativas
- Mayor verbosidad en los componentes, ya que deben manejar lógicas condicionales internamente (e.g. `${isLoading ? renderSkeleton() : renderData()}`).

## Alternativas Consideradas

| Alternativa | Razón de descarte |
|-------------|-------------------|
| Establecer `min-height` fijo en el contenedor padre | Difícil de mantener si el componente interno cambia su diseño; no permite reutilizar el botón "Cerrar" propio de la vista. |
| Ocultar el modal hasta que carguen los datos | Produce la sensación de "retraso de respuesta al clic", degradando la percepción de rendimiento. |
