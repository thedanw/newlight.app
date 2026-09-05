/**
 * Theme color compiler — one standalone CSS file per selectable Park UI palette.
 * ---------------------------------------------------------------------------
 * Every color package in src/core/theme/colors/<name>.ts (installed via
 * `npx @park-ui/cli add <name>`) is compiled into
 * public/core/theme/colors/<name>.css:
 *
 *   - accent schemes  -> [data-color-scheme='<name>'] { --colors-color-palette-* }
 *   - gray schemes    -> [data-gray-color='<name>']   { --colors-gray-* }
 *
 * Each file is self-contained (real values, no var() remaps) with a light
 * block plus a `[data-mode='dark']` block, so it works for palettes that are
 * NOT baked into the Panda bundle. The attribute-scoped selector also wins
 * the cascade over the bundle's :root defaults while the scheme is selected.
 *
 * The front end (src/core/theme/theme-loader.js) then dynamically loads ONLY
 * the accent + gray files that are actually in use.
 *
 * Run: `pnpm theme:colors` (also wired into `dev` / `build` / `prepare`).
 * The downloaded .ts packages are never edited — this script only reads them.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SRC_DIR = fileURLToPath(new URL('../src/core/theme/colors/', import.meta.url))
const OUT_DIR = fileURLToPath(new URL('../public/core/theme/colors/', import.meta.url))

/** Selectable accent schemes (data-color-scheme) — ALL 26 Park UI accents
 *  (25 chromatic + neutral as a monochrome accent). */
const ACCENTS = [
  'amber', 'blue', 'bronze', 'brown', 'crimson', 'cyan', 'gold', 'grass',
  'green', 'indigo', 'iris', 'jade', 'lime', 'mint', 'neutral', 'orange',
  'pink', 'plum', 'purple', 'red', 'ruby', 'sky', 'teal', 'tomato', 'violet',
  'yellow',
]
/** Selectable gray schemes (data-gray-color). */
const GRAYS = ['neutral', 'mauve', 'olive', 'sage', 'sand', 'slate']
/** Non-selectable files in the colors dir that must not be compiled. */
const SKIP = new Set(['index.ts', 'pandacss-dev.ts'])

/** Scope selector + emitted var prefix per palette role. */
const ROLE_SCOPES = {
  accent: { scopeAttr: 'data-color-scheme', varPrefix: 'colors-color-palette-' },
  gray: { scopeAttr: 'data-gray-color', varPrefix: 'colors-gray-' },
}

/* --- Evaluate a palette .ts without a TS toolchain ------------------------ */
/* The CLI-generated files have the exact shape
     import { defineSemanticTokens } from '@pandacss/dev'
     export const <name> = defineSemanticTokens.colors({ ... })
   so we strip the import/de-export and swap in an identity function. */
function loadPalette(file) {
  const source = readFileSync(file, 'utf8')
  const exportMatch = source.match(/export\s+const\s+(\w+)\s*=\s*defineSemanticTokens\.colors\s*\(/)
  if (!exportMatch) throw new Error('no defineSemanticTokens.colors export found')
  const name = exportMatch[1]
  const js = source
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/export\s+const/, 'const')
    // NOTE: must be parenthesized before the call — `(v) => v({...})` would
    // assign the arrow itself instead of invoking it with the object.
    .replace(/defineSemanticTokens\.colors/, '((v) => v)')
  return { name, pkg: new Function(`${js}\nreturn ${name};`)() }
}

/* --- Resolve Panda token refs against the package itself ------------------ */
/*   '{colors.green.9}' -> the package's own step-9 entry ({_light,_dark})
     'white' / hex      -> literal (same value for both modes)
   Resolution is MODE-AWARE and recursive: a pair's _light/_dark sides and
   any ref target can themselves be pairs or further refs.                */
function valueForMode(pkg, value, mode, depth = 0) {
  if (depth > 8) return String(value ?? '')
  if (value !== null && typeof value === 'object') {
    return valueForMode(pkg, mode === 'dark' ? value._dark : value._light, mode, depth + 1)
  }
  const str = String(value)
  const ref = /^\{colors\.([^.]+)\.(.+)\}$/.exec(str)
  if (ref) {
    const leaf = pkg[ref[2]]
    if (leaf && 'value' in leaf) return valueForMode(pkg, leaf.value, mode, depth + 1)
  }
  // Bare keyword refs ({colors.black} / {colors.white}) resolve to the
  // keyword itself, matching what Panda emits for the bundled palettes.
  const bare = /^\{colors\.([^.]+)\}$/.exec(str)
  if (bare) return bare[1]
  return str
}

/* Walk the package; DEFAULT segments are omitted from the var name, mirroring
   Panda's emission (solid.bg.DEFAULT -> --colors-color-palette-solid-bg). */
function collectVars(pkg, node, segments, prefix, light, dark) {
  for (const [key, child] of Object.entries(node)) {
    if (!child || typeof child !== 'object') continue
    if ('value' in child) {
      const path = [...segments, ...(key === 'DEFAULT' ? [] : [key])]
      light.push(`  --${prefix}${path.join('-')}: ${valueForMode(pkg, child.value, 'light')};`)
      dark.push(`  --${prefix}${path.join('-')}: ${valueForMode(pkg, child.value, 'dark')};`)
    } else {
      collectVars(pkg, child, [...segments, ...(key === 'DEFAULT' ? [] : [key])], prefix, light, dark)
    }
  }
}

function renderCss({ name, roles, pkg }) {
  const title = name.charAt(0).toUpperCase() + name.slice(1)
  const blocks = roles.map((role) => {
    const { scopeAttr, varPrefix } = ROLE_SCOPES[role]
    const light = []
    const dark = []
    collectVars(pkg, pkg, [], varPrefix, light, dark)
    return `[${scopeAttr}='${name}'] {\n${light.join('\n')}\n}\n\n[${scopeAttr}='${name}'][data-mode='dark'] {\n${dark.join('\n')}\n}`
  })
  return `/* ${title} palette — GENERATED FILE, DO NOT EDIT.
   Compiled from src/core/theme/colors/${name}.ts (Park UI package, installed
   via \`npx @park-ui/cli add ${name}\`) by scripts/generate-theme-colors.mjs
   (\`pnpm theme:colors\`). Self-contained light + dark values, scoped to html
   data attributes so they override the Panda bundle defaults while this
   scheme is selected. Loaded on demand by src/core/theme/theme-loader.js.
   Roles: ${roles.join(' + ')}. */

${blocks.join('\n\n')}
`
}

/* One output file per palette; a palette may serve multiple roles (neutral is
   both an accent and a gray) — every role's scopes go into the same file so
   the loader can fetch a single <name>.css regardless of which knob uses it. */
const palettes = [...new Set([...ACCENTS, ...GRAYS])].map((name) => ({
  name,
  roles: [
    ...(ACCENTS.includes(name) ? ['accent'] : []),
    ...(GRAYS.includes(name) ? ['gray'] : []),
  ],
}))

let failed = false
for (const palette of palettes) {
  try {
    const { pkg } = loadPalette(`${SRC_DIR}${palette.name}.ts`)
    const css = renderCss({ ...palette, pkg })
    writeFileSync(`${OUT_DIR}${palette.name}.css`, css, 'utf8')
    const varCount = (css.match(/--[\w-]+:/g) || []).length / 2
    console.log(`✓ public/core/theme/colors/${palette.name}.css  (${palette.roles.join('+')}, ${varCount} vars × light/dark)`)
  } catch (error) {
    failed = true
    console.error(`✗ ${palette.name}: ${error.message}`)
  }
}

/* Surface any palette file that is neither accent nor gray so nothing rots. */
for (const entry of readdirSync(SRC_DIR)) {
  if (!entry.endsWith('.ts') || SKIP.has(entry)) continue
  const base = entry.replace(/\.ts$/, '')
  if (!ACCENTS.includes(base) && !GRAYS.includes(base)) {
    console.warn(`• skipped ${entry} — not a selectable accent/gray (bundled via panda.config.ts)`)
  }
}

if (failed) process.exit(1)
