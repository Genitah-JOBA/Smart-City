/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        lancelot: ['Bellota', 'serif'], // Ajout de la police ici
      },
    },
  },
  plugins: [],
}
