# ADR-009: Corrección de Assets en Sprite SVG
1: 
2: - **Estado:** Aceptada
3: - **Fecha:** 2026-04-27
4: - **Contexto:** Se detectaron iconos vacíos en la interfaz debido a que el archivo `src/assets/sprite.svg` contenía etiquetas `<symbol>` sin contenido interno (paths), resultando en elementos invisibles en el DOM.
5: 
6: ## Contexto
7: Al usar la técnica de SVG Sprites (`<use href="#icon-id">`), es crítico que cada símbolo tenga definidos sus vectores internos. Un error en la generación o edición manual dejó varios símbolos como contenedores vacíos, afectando la usabilidad de componentes como el Dashboard y las tablas de activos.
8: 
9: ## Decisión
10: Se realizó un audit completo del archivo `sprite.svg` y se restauraron los paths de los iconos críticos (dashboard, wallet, plus, search, etc.) utilizando los vectores de Tabler Icons, asegurando consistencia visual y funcional.
11: 
12: ## Consecuencias
13: 
14: ### Positivas
15: - Restauración de la visibilidad de todos los iconos de la aplicación.
16: - Mejora inmediata en la accesibilidad visual y navegación del usuario.
17: - Centralización corregida de assets visuales.
18: 
19: ### Negativas
20: - Ninguna identificada, más allá del tiempo de corrección manual.
21: 
22: ## Alternativas Consideradas
23: 
24: | Alternativa | Razón de descarte |
25: |-------------|-------------------|
26: | Migrar a iconos inline (JS). | Aumentaría el tamaño del bundle de JS y dificultaría la caché del navegador para assets estáticos. |
27: | Usar una librería externa (FontAwesome, etc.). | Iría en contra de la filosofía "Zero-JS / Low dependency" del proyecto. |
28: 
29: ---
30: *Última actualización: 2026-04-27*
