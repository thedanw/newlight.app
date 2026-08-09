import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  hash: false,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  theme: {
    extend: {},
  },
})
