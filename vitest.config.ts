import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@pandacss/dev': fileURLToPath(
        new URL('./src/core/theme/colors/pandacss-dev.ts', import.meta.url),
      ),
    },
  },
})