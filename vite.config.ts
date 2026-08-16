import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // Browser-safe stub for @pandacss/dev (a Node-only CLI package). The
      // Park UI color packages (src/core/theme/colors/*.ts) are dynamically
      // imported at runtime for the non-default schemes (green/violet/mint),
      // so this keeps the Panda CLI out of the client bundle while the files
      // themselves stay canonical CLI output.
      '@pandacss/dev': fileURLToPath(
        new URL('./src/core/theme/colors/pandacss-dev.ts', import.meta.url),
      ),
    },
  },
})
