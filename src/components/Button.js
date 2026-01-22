const Button = (icon, text, style) => {
    const view = `
      <button class="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${style}">
        <span>${icon}</span> ${text}
      </button>
    `
    return view;
}

export default Button;