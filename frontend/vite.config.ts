import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Même alias que "paths" dans tsconfig : import '@/components/ui/button'
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
