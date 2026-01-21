/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}", // Busca en todos los archivos HTML y JS dentro de src
    "./public/index.html"   // Y en tu HTML base
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}