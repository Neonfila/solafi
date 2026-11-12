import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /solafi/ until solafi.ng is connected.
// The deploy workflow sets VITE_BASE; locally and on a custom domain it is '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
