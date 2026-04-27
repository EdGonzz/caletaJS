# ADR-010: Renombrado de "Overview" a "Caletas" para Fuentes de Datos
1: 
2: - **Estado:** Aceptada
3: - **Fecha:** 2026-04-27
4: - **Contexto:** El término "Overview" era demasiado genérico y no reflejaba la identidad del proyecto. Se decidió cambiar el nombre de la fuente de datos predeterminada a "Caletas" para alinear la terminología con el branding del sistema.
5: 
6: ## Contexto
7: En `src/utils/sources.js`, la constante `DEFAULT_SOURCE` estaba definida como "Overview". Esto causaba confusión en la UI y en la lógica de almacenamiento (`localStorage`), donde el usuario esperaba ver una referencia directa al nombre de la aplicación.
8: 
9: ## Decisión
10: Se actualizó `DEFAULT_SOURCE` a "Caletas". Esto afecta tanto a la visualización inicial como a la clave de filtrado por defecto en el sistema de seguimiento de inversiones.
11: 
12: ## Consecuencias
13: 
14: ### Positivas
15: - Mayor coherencia entre el nombre del proyecto (Caleta) y su funcionalidad principal.
16: - Mejor experiencia de usuario (UX) al identificar claramente dónde están sus activos.
17: 
18: ### Negativas
19: - Los usuarios existentes con datos guardados bajo la etiqueta "Overview" podrían notar una discrepancia si no se migran sus claves (se asume que en esta etapa de desarrollo la persistencia es volátil o manejable).
20: 
21: ## Alternativas Consideradas
22: 
23: | Alternativa | Razón de descarte |
24: |-------------|-------------------|
25: | Mantener "Overview". | Falta de identidad de marca. |
26: | Permitir nombres personalizados desde el inicio. | Ya se permite, pero el valor por defecto seguía siendo genérico. |
27: 
28: ---
29: *Última actualización: 2026-04-27*
