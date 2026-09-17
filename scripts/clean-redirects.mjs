import { rmSync } from 'node:fs'

for (const p of ['public/_redirects', 'dist/_redirects']) {
  rmSync(p, { force: true })
}
