import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

// Plugin to inject runtime config into HTML for local development
function injectRuntimeConfig() {
  return {
    name: 'inject-runtime-config',
    transformIndexHtml(html, { server }) {
      if (!server) return html // Only for dev server
      
      const env = loadEnv('development', process.cwd(), 'VITE_')
      const config = {
        supabaseUrl: env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
        supabaseJwksUrl: env.VITE_SUPABASE_JWKS_URL || '',
      }
      
      const configScript = 
        '<script>window.__CF_PAGES_CONFIG__=' + 
        JSON.stringify(config) + 
        ';</script>\n'
      
      return html.replace('</head>', configScript + '</head>')
    }
  }
}

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
    injectRuntimeConfig(),
  ],
  resolve: {
    alias: {
      '@pandacss/dev': fileURLToPath(
        new URL('../src/core/theme/colors/pandacss-dev.ts', import.meta.url),
      ),
      '@/*': fileURLToPath(new URL('../src/*', import.meta.url)),
      'styled-system/*': fileURLToPath(new URL('../styled-system/*', import.meta.url)),
    },
  },
  root: '..',
  publicDir: 'public',
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
