import sprite from "../assets/sprite.svg";

const StatCard = ({
  title,
  value,
  badge = "",
  description = "",
  iconLabel = "",
  icon = "",
  extra = "",
  skeleton = false,
}) => {
  if (skeleton) {
    return `
      <article class="glass-panel relative overflow-hidden rounded-xl p-5" aria-busy="true" aria-label="Cargando ${title}">
        <div class="absolute top-0 right-0 p-3 opacity-10">
          <div class="skeleton-shimmer size-8 rounded-lg"></div>
        </div>
        <header class="mb-2">
          <div class="skeleton-shimmer h-3 w-24 rounded"></div>
        </header>
        <div class="flex flex-col gap-3">
          <div class="flex items-baseline gap-2">
            <div class="skeleton-shimmer h-8 w-32 rounded"></div>
            <div class="skeleton-shimmer h-5 w-14 rounded-full"></div>
          </div>
          <div class="skeleton-shimmer h-3 w-20 rounded"></div>
          <div class="skeleton-shimmer h-1.5 w-full rounded-full mt-1"></div>
        </div>
      </article>
    `;
  }

  return `
    <article class="glass-panel group hover:border-primary/30 relative overflow-hidden rounded-xl p-5 transition-all duration-300">
      ${
        icon
          ? `<div class="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20" aria-hidden="true">
               <svg class="size-8" role="img" aria-label="Icono de ${iconLabel}">
                 <use href="${sprite}#${icon}"></use>
               </svg>
             </div>`
          : ""
      }

      <header>
        <h3 class="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">${title}</h3>
      </header>

      <div class="flex flex-col gap-1">
        <div class="flex items-baseline gap-2">
          <span class="font-mono text-2xl font-bold text-white">${value ?? ''}</span>
          ${
            badge
              ? `<span class="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-bold" aria-label="Cambio: ${badge}">${badge}</span>`
              : ""
          }
        </div>
        ${description ? `<p class="text-xs text-slate-500">${description}</p>` : ""}
      </div>

      ${extra}
    </article>
  `;
};

export default StatCard;
