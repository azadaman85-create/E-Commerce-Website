import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served under /admin so the storefront on :3000 can proxy this app
  // through to a single address. Keep in sync with the BrowserRouter
  // basename in src/main.tsx and the rewrites in the storefront's
  // next.config.ts.
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
