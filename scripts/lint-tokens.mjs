#!/usr/bin/env node
/**
 * lint-tokens — token-discipline gate (zero dependencies).
 *
 * Flags RAW CSS values used on token-bound props inside Panda style objects
 * (`css({…})`, recipes, patterns, styled.* props) so they get replaced with
 * semantic tokens instead. Example catch:
 *
 *   borderRadius: '8px'   ❌  →  borderRadius: 'l2'          ✅
 *   color: '#f76b15'      ❌  →  color: 'colorPalette.solid.bg' ✅
 *
 * WHY NOT Panda `strictTokens`?
 *   Evaluated 2026-08-21 and rejected for this codebase:
 *   - 6 installed color palettes blow up TS unions (TS2590) on styled.* JSX
 *   - it forces edits to pristine Park UI vendor files (pagination, skeleton)
 *   - deliberate layout math (sidebar TILE_SIZE calc) would need `[…]`
 *     escape-hatch noise on every line
 * Revisit if the token surface shrinks. This script gives ~90% of the value
 * with zero of that pain.
 *
 * Usage:
 *   node scripts/lint-tokens.mjs           # audit, exit 1 on violations
 *   pnpm lint:tokens                       # same, via package.json
 *
 * Suppression:
 *   - line-level: append `// token-lint:ignore <reason>`
 *   - file-level: add to FILES_ALLOW_RAW below (use sparingly)
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['src']
const EXT = /\.(ts|tsx)$/
const IGNORE_DIRS = new Set(['node_modules', 'styled-system', 'dist'])

/** Files where raw values are accepted (deliberate layout math etc.). */
const FILES_ALLOW_RAW = [
  // Pristine Park UI vendor: switch thumb is 'white' by design (mode-invariant
  // thumb on a colored track); no semantic token exists for always-white.
  // Re-check if an fg.inverted-style token is ever introduced.
  'src/core/theme/recipes/switch.ts',
]

/**
 * prop → pattern of FORBIDDEN raw values.
 * Keep this list tight: only props that have a real semantic equivalent,
 * so the gate stays low-noise. Candidates for future tightening:
 *   width / height / min-max sizes, padding, margin, gap (px literals),
 *   boxShadow (raw multi-layer shadows), transition (raw durations).
 */
const RULES = [
  // Radius → radii.l1 | l2 | l3 | full  (knob-responsive via data-radius)
  {
    prop: 'borderRadius|rounded',
    bad: /^\s*['"`][0-9.]+(?:px|rem|em|%)\s*['"`]/,
    hint: "use 'l1' | 'l2' | 'l3' | 'full'",
  },
  // Type scale → textStyle.xs … 7xl
  {
    prop: 'fontSize|fs',
    bad: /^\s*['"`][0-9.]+(?:px|rem|em)\s*['"`]/,
    hint: "use a textStyle token ('xs'…'7xl') or spacing size",
  },
  // Colors → fg.* / gray.* / colorPalette.* semantic slots
  {
    prop: 'color|bg|background|backgroundColor|borderColor|fill|stroke|textDecorationColor|outlineColor|accentColor|caretColor',
    bad: /^\s*['"`](?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\b(?:red|blue|green|orange|yellow|purple|pink|gray|grey|black|white)\b(?![.\w-]))/,
    hint: 'use a semantic color token (fg.*, gray.*, colorPalette.*)',
  },
]

// Bare Panda token names inside React inline `style={{ … }}` are INVALID CSS
// (they only exist in Panda's object API). They must be `var(--radii-l2)` etc.
// Catches the one-line case; multiline inline styles need manual review.
const INLINE_TOKEN_NAME =
  /style=\{\{[^}'"]*(?:borderRadius|rounded)\s*:\s*['"](l1|l2|l3|xs|sm|md|lg|xl|2xl|full)['"]/

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(p, files)
    } else if (EXT.test(entry.name)) {
      files.push(p)
    }
  }
  return files
}

const violations = []

for (const file of ROOTS.flatMap((r) => walk(r))) {
  const rel = file.replaceAll('\\', '/')
  if (FILES_ALLOW_RAW.some((allow) => rel === allow || rel.endsWith(allow))) continue
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    // suppress via marker on the same line OR the line above
    if (line.includes('token-lint:ignore')) return
    if (i > 0 && lines[i - 1].includes('token-lint:ignore')) return
    for (const { prop, bad, hint } of RULES) {
      // match `prop: 'value'` / `prop: "value"` / `prop: \`value\`` anywhere
      // in the line; the [^\w.$] guard avoids matching suffixes of longer
      // identifiers (e.g. `myBorderRadius`) or object keys in strings.
      const re = new RegExp(`(?:^|[^\\w.$])(${prop})\\s*:\\s*([^,\\n}]+)`, 'g')
      let m
      while ((m = re.exec(line))) {
        if (bad.test(m[2])) {
          violations.push(
            `${rel}:${i + 1}: ${m[1]}: ${m[2].trim()}  →  ${hint}`,
          )
        }
      }
    }
    if (INLINE_TOKEN_NAME.test(line)) {
      violations.push(
        `${rel}:${i + 1}: Panda token name inside inline style={} is invalid CSS  →  use var(--radii-*)`,
      )
    }
  })
}

if (violations.length) {
  console.error(`✖ token discipline: ${violations.length} violation(s)\n`)
  for (const v of violations) console.error('  ' + v)
  process.exit(1)
}
console.log('✔ token discipline: no raw values on token-bound props')
