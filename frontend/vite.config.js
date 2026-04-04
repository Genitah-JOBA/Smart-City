import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- Ajoute cet import

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- Active le plugin ici
  ],
})
