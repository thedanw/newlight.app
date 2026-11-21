import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@pandacss/dev': fileURLToPath(
        new URL('./src/core/theme/colors/pandacss-dev.ts', import.meta.url),
      ),
    },
  },
  server: {
    proxy: {
      '/api/elvanto': {
        target: 'https://api.elvanto.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/elvanto/, ''),
      },
    },
  },
})