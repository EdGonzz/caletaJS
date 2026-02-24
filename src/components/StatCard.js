/**
 * Componente StatCard: Una tarjeta individual para mostrar métricas.
 * @param {Object} props - Propiedades de la tarjeta.
 * @param {string} props.title - Título de la métrica.
 * @param {string} props.value - Valor principal.
 * @param {string} [props.badge] - Etiqueta de porcentaje o cambio (opcional).
 * @param {string} [props.description] - Descripción secundaria.
 * @param {string} [props.icon] - Nombre del Material Symbol para el fondo.
 * @param {string} [props.content] - HTML personalizado para el cuerpo de la tarjeta (opcional).
 * @param {string} [props.extra] - HTML adicional (ej. barras de progreso, gráficos).
 * @returns {string} HTML string del componente.
 */
const StatCard = ({
  title,
  value,
  badge = "",
  description = "",
  icon = "",
  content = "",
  extra = "",
}) => {
  return `
    <article class="glass-panel group hover:border-primary/40 relative overflow-hidden rounded-xl p-5 transition-all duration-300">
      <!-- Icono decorativo -->
      ${
        icon
          ? `<div class="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20" aria-hidden="true">
               <span class="material-symbols-outlined text-primary text-4xl">${icon}</span>
             </div>`
          : ""
      }

      <header>
        <h3 class="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">${title}</h3>
      </header>

      <div class="flex flex-col gap-1">
        ${
          content || `
          <div class="flex items-baseline gap-2">
            <span class="font-mono text-2xl font-bold text-white">${value}</span>
            ${
              badge
                ? `<span class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-bold" aria-label="Cambio: ${badge}">${badge}</span>`
                : ""
            }
          </div>
          <p class="text-xs text-slate-500">${description}</p>
        `
        }
      </div>

      <!-- Espacio para elementos extra (progresos, mini charts) -->
      ${extra}
    </article>
  `;
};

export default StatCard;
