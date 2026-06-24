/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./mf-shell/index.html",
    "./mf-shell/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'farm-primary': '#2b5c3f',
        'farm-primary-light': '#3a7a53',
        'farm-primary-dark': '#1e402c',
        'farm-accent': '#c4a47c',
        'farm-accent-light': '#dfcba8',
        'farm-sand': '#f5f0e6',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
