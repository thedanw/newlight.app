/**
 * Font loader — dynamic brand-font loading for the whole shell.
 *
 * Selecting a font in BrandForm fetches ONLY that family's webfont CSS
 * (one <link> per family, injected once and kept mounted so re-selecting
 * is instant) and writes the matching stack onto <html>. Body text and
 * headings both inherit from <html> — no other font-family rules exist in
 * the app — so one inline style re-fonts everything live.
 *
 * Sources: Inter variable via rsms.me (also statically linked in
 * index.html under the same element id), Poppins / Raleway / DM Sans via
 * Google Fonts css2.
 */

export type FontKey = 'inter' | 'poppins' | 'raleway' | 'dm-sans'

/** Full CSS stacks — selected family first, Inter/system fallbacks behind. */
export const FONT_FAMILIES: Record<FontKey, string> = {
  inter: "'InterVariable', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
  poppins: "'Poppins', 'Inter', ui-sans-serif, system-ui, sans-serif",
  raleway: "'Raleway', 'Inter', ui-sans-serif, system-ui, sans-serif",
  'dm-sans': "'DM Sans', 'Inter', ui-sans-serif, system-ui, sans-serif",
}

/**
 * Heading stacks — Inter headings use the display cut (large optical size,
 * shipped as the `InterDisplay` static family in rsms inter.css); every
 * other brand font uses its body stack for headings too.
 */
export const FONT_HEADING_FAMILIES: Record<FontKey, string> = {
  inter: "'InterDisplay', 'InterVariable', 'Inter', ui-sans-serif, system-ui, sans-serif",
  poppins: FONT_FAMILIES.poppins,
  raleway: FONT_FAMILIES.raleway,
  'dm-sans': FONT_FAMILIES['dm-sans'],
}

/**
 * OpenType character-set features applied to ALL text while the font is
 * active (font-feature-settings inherits). Inter ships alternate glyphs for
 * these; other fonts have none configured and fall back to the theme.css
 * :root default.
 */
const FONT_FEATURES: Record<FontKey, string> = {
  inter: "'cv06' 1, 'cv11' 1, 'cv12' 1, 'cv13' 1, 'ss07' 1, 'ss08' 1",
  poppins: '',
  raleway: '',
  'dm-sans': '',
}

export const FONT_OPTIONS: Array<{ label: string; value: FontKey }> = [
  { label: 'Inter', value: 'inter' },
  { label: 'Poppins', value: 'poppins' },
  { label: 'Raleway', value: 'raleway' },
  { label: 'DM Sans', value: 'dm-sans' },
]

/** Webfont stylesheet per family. `id` makes injection idempotent. */
const FONT_CSS: Record<FontKey, { id: string; href: string }> = {
  inter: {
    id: 'brand-font-inter',
    // Variable font + static fallbacks; also hard-coded in index.html so
    // Inter is fetching before JS boots. Same id → loader skips it.
    href: 'https://rsms.me/inter/inter.css',
  },
  poppins: {
    id: 'brand-font-poppins',
    href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700&display=swap',
  },
  raleway: {
    id: 'brand-font-raleway',
    href: 'https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap',
  },
  'dm-sans': {
    id: 'brand-font-dm-sans',
    href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap',
  },
}

let preconnectsReady = false

function ensurePreconnects(): void {
  if (preconnectsReady || typeof document === 'undefined') return
  const origins: Array<{ href: string; crossOrigin?: string }> = [
    { href: 'https://fonts.googleapis.com' },
    { href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { href: 'https://rsms.me' },
  ]
  for (const { href, crossOrigin } of origins) {
    if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = href
    if (crossOrigin) link.crossOrigin = crossOrigin
    document.head.appendChild(link)
  }
  preconnectsReady = true
}

/** Injects the family's stylesheet once (kept mounted for instant re-select). */
export function ensureFontLoaded(font: FontKey): void {
  if (typeof document === 'undefined') return
  ensurePreconnects()
  const spec = FONT_CSS[font]
  if (document.getElementById(spec.id)) return
  const link = document.createElement('link')
  link.id = spec.id
  link.rel = 'stylesheet'
  link.href = spec.href
  document.head.appendChild(link)
}

/** Loads the family AND applies it to <html> — body + headings inherit. */
export function applyFont(font: FontKey): void {
  ensureFontLoaded(font)
  const root = document.documentElement
  root.style.fontFamily = FONT_FAMILIES[font]
  // Headings read this var (heading recipe + theme.css h1-h6 rule); the
  // default lives in theme.css §0 so pre-JS render is sane.
  root.style.setProperty('--font-family-heading', FONT_HEADING_FAMILIES[font])
  // Applies to ALL text via inheritance. '' clears the inline declaration so
  // non-Inter fonts fall back to the theme.css :root feature set.
  root.style.fontFeatureSettings = FONT_FEATURES[font]
}

/** Reads the live inline font-family back into a FontKey (boot restore). */
export function detectFont(root: HTMLElement): FontKey {
  const inline = root.style.fontFamily
  if (inline.includes('Poppins')) return 'poppins'
  if (inline.includes('Raleway')) return 'raleway'
  if (inline.includes('DM Sans')) return 'dm-sans'
  return 'inter'
}
