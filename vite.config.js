import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The site lives at the root of solafi.ng. VITE_BASE can still serve it from a subfolder.
// The deploy workflow sets VITE_BASE; locally and on a custom domain it is '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
