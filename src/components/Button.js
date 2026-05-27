import sprite from "../assets/sprite.svg";

const Button = (id, icon, text, style) => {
    const view = `
      <button id="${id}" class="btn-press shrink-0 whitespace-nowrap flex items-center justify-center gap-1 rounded-lg transition-all cursor-pointer ${style}">
        <svg class="size-6" aria-hidden="true">
          <use href="${sprite}#${icon}"></use>
        </svg>
        <span>${text}</span>
      </button>
    `
    return view;
}

export default Button;
