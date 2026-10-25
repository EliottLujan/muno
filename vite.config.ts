import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base: the build works under any sub-path (GitHub Pages project site).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
