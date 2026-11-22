import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/modules/people/**/*.ts',
        'src/modules/people/**/*.tsx',
        'src/modules/forms/**/*.ts',
        'src/modules/forms/**/*.tsx',
        'src/core/ui/main-list/**/*.ts',
        'src/core/ui/main-list/**/*.tsx',
      ],
      // 70% floor enforced on the surfaces this plan remediates and tests.
      // (The people-module pages predate this and are not yet at the floor —
      // they stay measured via `include` until that remediation lands.)
      thresholds: {
        'src/core/ui/main-list/**': {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
        'src/modules/forms/dashboard.tsx': {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@pandacss/dev': fileURLToPath(
        new URL('./src/core/theme/colors/pandacss-dev.ts', import.meta.url),
      ),
    },
  },
})
