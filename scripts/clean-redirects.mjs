import { rmSync } from 'node:fs'

// Only clean cached redirect files from dist, preserve source _redirects
rmSync('dist/_redirects', { force: true })
