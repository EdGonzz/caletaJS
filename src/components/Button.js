import sprite from "../assets/sprite.svg";

const Button = (id, icon, text, style) => {
    const view = `
      <button id=${id} class="shrink-0 whitespace-nowrap flex items-center justify-center gap-1 rounded-lg transition-all cursor-pointer ${style}">
        <svg class="size-6">
          <use href="${sprite}#${icon}"></use>
        </svg>
        ${text}
      </button>
    `
    return view;
}

export default Button;