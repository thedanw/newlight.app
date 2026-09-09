#!/usr/bin/env node
/**
 * lint-pages — page scaffold gate (zero dependencies).
 *
 * Enforces the page structure contract across ALL pages and subpages:
 *
 *   Page.Root (AppShell)  →  Page.Main  →  Page.Header* + Page.Body
 *                                        →  Page.Footer (optional, OUTSIDE Main)
 *
 * Four checks:
 *   1. PARTIAL compliance — any file that renders ANY `Page.*` slot must
 *      render `Page.Main`, `Page.Header`, and `Page.Body`. Catches a page
 *      that forgets one slot (e.g. renders Header/Body but no Main wrapper,
 *      which breaks the flex scroll chain).
 *   2. TOTAL compliance — any file that LOOKS like a routed page (by naming /
 *      location convention: directly in a `pages/` dir, named `*Page.tsx`, or
 *      a module `dashboard.tsx`) must render the scaffold even if it renders
 *      ZERO `Page.*` slots. Without this, a page that ignores the scaffold
 *      entirely (plain `<div>`) would slip through check 1.
 *   3. FOOTER ownership — routed pages must NOT render `Page.Footer`; the
 *      footer is shell-owned (AppShell renders it once with ActionFooter).
 *      Pages register Save/Cancel via `usePageActions()` instead.
 *   4. FORM actions — routed pages that render a `<form>` element must
 *      import `usePageActions` (public submission pages are exempt).
 *
 * WHY a static script instead of only the dev-time check in Page.Main?
 *   - catches violations in files that never render in the dev browser
 *     (e.g. plugin content copied to public/, dead/error branches)
 *   - runs in CI / `pnpm build` as a hard gate
 *   - same zero-dep pattern as lint-tokens.mjs
 *
 * Usage:
 *   node scripts/lint-pages.mjs           # audit, exit 1 on violations
 *   pnpm lint:pages                       # same, via package.json
 *
 * Suppression:
 *   - file-level: add to FILES_ALLOW_RAW below (use sparingly)
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['src']
const EXT = /\.(ts|tsx)$/
const IGNORE_DIRS = new Set(['node_modules', 'styled-system', 'dist'])

/** Files that legitimately reference Page slots without being a routed page. */
const FILES_ALLOW_RAW = [
  // The Page component itself — defines the slots, never renders them.
  'src/core/ui/page.tsx',
  // AppShell — renders Page.Root (the outer wrapper), not Main/Header/Body.
  'src/core/ui/app-shell.tsx',
  // ActionFooter — the shell-owned footer bar rendered once by AppShell.
  'src/core/ui/action-footer.tsx',
  // Public auth page — centered card layout, NOT inside AppShell/Page.Root.
  'src/core/auth/LoginPage.tsx',
  // Router errorElement — full-viewport error screen that must render even
  // when AppShell/Page.Root itself fails; not a scaffold page.
  'src/core/errors/ErrorPage.tsx',
  // Styleguide demo registry (lives in pages/ but is not a routed page).
  'src/modules/example/pages/demos.tsx',
  // Test harness — renders the shell (Page.Root + Page.Footer) to exercise
  // the action footer, not a routed page.
  'src/modules/people/__tests__/form-reorder.test.tsx',
]

/**
 * Heuristic for "this file is a routed page" (mounted inside AppShell).
 * Kept deliberately narrow to avoid false positives on components:
 *   - directly inside a `pages/` folder (e.g. src/modules/people/pages/*.tsx)
 *   - filename ends in `Page.tsx` (e.g. AccountPage, ChurchInformationPage)
 *   - a module/settings `dashboard.tsx`
 * Subfolders like `pages/demos/` are NOT matched (they hold non-routed
 * registries); a page nested deeper that ends in `Page.tsx` still is.
 */
const PAGE_FILE_PATTERNS = [
  /(?:^|\/)pages\/[^/]+\.tsx$/,
  /(?:^|\/)[A-Za-z0-9]+Page\.tsx$/,
  /(?:^|\/)dashboard\.tsx$/,
]

/**
 * Strip comments and string literals so `Page.Main` inside a doc comment or a
 * string (e.g. "renders Page.Header") is not counted as a real usage.
 */
function stripCommentsAndStrings(src) {
  let out = ''
  let i = 0
  const n = src.length
  while (i < n) {
    const ch = src[i]
    const next = src[i + 1]
    // line comment
    if (ch === '/' && next === '/') {
      while (i < n && src[i] !== '\n') i++
      continue
    }
    // block comment
    if (ch === '/' && next === '*') {
      i += 2
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++
      i += 2
      continue
    }
    // single-quoted string
    if (ch === "'") {
      i++
      while (i < n && src[i] !== "'") {
        if (src[i] === '\\') i++
        i++
      }
      i++
      continue
    }
    // double-quoted string
    if (ch === '"') {
      i++
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\') i++
        i++
      }
      i++
      continue
    }
    // template literal (backtick) — skip ${…} interpolation roughly
    if (ch === '`') {
      i++
      while (i < n && src[i] !== '`') {
        if (src[i] === '\\') {
          i += 2
          continue
        }
        if (src[i] === '$' && src[i + 1] === '{') {
          let depth = 1
          i += 2
          while (i < n && depth > 0) {
            if (src[i] === '{') depth++
            else if (src[i] === '}') depth--
            else if (src[i] === '`') break
            i++
          }
          continue
        }
        i++
      }
      i++
      continue
    }
    out += ch
    i++
  }
  return out
}

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

const SLOTS = ['Main', 'Header', 'Body', 'HeaderTop', 'HeaderBottom', 'Footer']
const count = (stripped, slot) => (stripped.match(new RegExp(`<Page\\.${slot}\\b`, 'g')) || []).length

const violations = []

for (const file of ROOTS.flatMap((r) => walk(r))) {
  const rel = file.replaceAll('\\', '/')
  if (FILES_ALLOW_RAW.some((allow) => rel === allow || rel.endsWith(allow))) continue

  const stripped = stripCommentsAndStrings(readFileSync(file, 'utf8'))
  const counts = Object.fromEntries(SLOTS.map((slot) => [slot, count(stripped, slot)]))
  const rendersAnySlot = SLOTS.some((slot) => counts[slot] > 0)
  const isRoutedPage = PAGE_FILE_PATTERNS.some((re) => re.test(rel))

  if (rendersAnySlot) {
    // Check 1 — partial compliance: any Page.* usage must include the full
    // Main > Header + Body scaffold.
    if (counts.Main === 0) {
      violations.push(
        `${rel}: renders Page.* slots but is NOT wrapped in <Page.Main> — every page must be <Page.Main><Page.Header/><Page.Body/></Page.Main>`,
      )
    }
    if (counts.Header === 0) {
      violations.push(
        `${rel}: <Page.Main> is missing <Page.Header> — every page must have a Page.Header`,
      )
    }
    if (counts.Body === 0) {
      violations.push(
        `${rel}: <Page.Main> is missing <Page.Body> — every page must have a Page.Body`,
      )
    }
  } else if (isRoutedPage) {
    // Check 2 — total compliance: a file that looks like a routed page but
    // renders NO Page.* scaffold at all (e.g. a plain <div>) must be flagged.
    violations.push(
      `${rel}: looks like a routed page (pages/ dir, *Page.tsx, or dashboard.tsx) but renders NO <Page.Main>/<Page.Header>/<Page.Body> — every page must be <Page.Main><Page.Header/><Page.Body/></Page.Main>`,
    )
  }

  // Check 3 — routed pages must NOT render Page.Footer (shell-owned now).
  if (isRoutedPage && counts.Footer > 0) {
    violations.push(
      `${rel}: renders <Page.Footer> — the footer is SHELL-OWNED (AppShell renders it once). Register actions via usePageActions() instead.`,
    )
  }

  // Check 4 — routed pages with a form must register actions with the shell
  // footer via usePageActions. Public submission surfaces are exempt.
  // Matches an actual `<form>` element (not `onSubmit` prop-passing to a
  // child component like PersonForm, which registers its own actions).
  const FORM_PAGE_ALLOWLIST = [
    'src/core/auth/LoginPage.tsx',
    'src/modules/people/pages/FormPublicPage.tsx',
  ]
  const hasForm = /<form\b/.test(stripped)
  if (isRoutedPage && hasForm && !/use(?:Register)?PageActions/.test(stripped)) {
    if (!FORM_PAGE_ALLOWLIST.some((allow) => rel === allow || rel.endsWith(allow))) {
      violations.push(
        `${rel}: renders a <form> but does not use usePageActions — forms must register Save/Cancel with the shell footer.`,
      )
    }
  }
}

if (violations.length) {
  console.error(`✖ page scaffold: ${violations.length} violation(s)\n`)
  for (const v of violations) console.error('  ' + v)
  process.exit(1)
}
console.log('✔ page scaffold: every page is Page.Main > Page.Header + Page.Body')