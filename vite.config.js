import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Currently served from https://lansijarvi.github.io/backfire-moto/ (a subpath).
  // Once backfiremoto.com is pointed at GitHub Pages (see README), change this to '/'.
  base: '/backfire-moto/',
})
