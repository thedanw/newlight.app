import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const SRC_PLUGINS_DIR = resolve('src/content/plugins')
const DEST_PLUGINS_DIR = resolve('public/content/plugins')

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  const entries = readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else if (entry.isFile()) {
      copyFileSync(srcPath, destPath)
      console.log(`Copied: ${srcPath} -> ${destPath}`)
    }
  }
}

// Generate plugin-index.json — the list of installed plugin folder names.
// The PluginLoader and Plugins settings section use this to discover plugins.
function writePluginIndex() {
  const pluginNames = readdirSync(SRC_PLUGINS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const index = { plugins: pluginNames }
  const destPath = join(DEST_PLUGINS_DIR, 'plugin-index.json')
  writeFileSync(destPath, JSON.stringify(index, null, 2))
  console.log(`Wrote plugin index: ${destPath} (${pluginNames.length} plugins)`)
}

console.log('Copying plugins to public/content/plugins...')
copyDir(SRC_PLUGINS_DIR, DEST_PLUGINS_DIR)
writePluginIndex()
console.log('Done!')