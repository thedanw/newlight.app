import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'

const SRC_THEME_DIR = resolve('src/core/theme')
const DEST_THEME_DIR = resolve('public/core/theme')

// Theme files to copy (not the colors directory - those are generated)
const THEME_FILES = [
  'radius.css',
  'font.css',
  'sidebar.css',
  'typography.css',
]

function copyThemeFiles() {
  mkdirSync(DEST_THEME_DIR, { recursive: true })
  
  for (const file of THEME_FILES) {
    const srcPath = join(SRC_THEME_DIR, file)
    const destPath = join(DEST_THEME_DIR, file)
    
    try {
      copyFileSync(srcPath, destPath)
      console.log(`Copied: ${srcPath} -> ${destPath}`)
    } catch (error) {
      console.error(`Failed to copy ${file}:`, error.message)
    }
  }
}

console.log('Copying theme files to public/core/theme...')
copyThemeFiles()
console.log('Done!')