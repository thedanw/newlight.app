import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'New Light',
        short_name: 'New Light',
        description: 'Church CRM for New Light',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
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
