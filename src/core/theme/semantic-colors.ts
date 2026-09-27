// Semantic color derivation for the dynamic theme loader.
//
// The Park UI primary accent is only known at RUNTIME: every accent is compiled
// by scripts/generate-theme-colors.mjs into a standalone stylesheet that
// src/core/theme/theme-loader.js fetches on demand, so it cannot be baked in at
// build time. Semantic colors (success / warning / error / info) are therefore
// derived in the browser:
//
//   1. Resolve the Park UI base + hover values through the cascade with a probe
//      element (works no matter how the custom property is serialised).
//   2. Convert the base to HSL and KEEP its saturation and lightness.
//   3. Swap in a conventional semantic hue for each token.
//   4. Derive hover/active by replaying Park UI's own base -> hover lightness
//      delta, so every accent keeps its designer-authored state intensity.
//
// The result is injected as a scoped <style id="theme-semantic"> block:
//
//   html[data-color-scheme='orange'][data-mode='light'] {
//     --colors-success: #...;
//     --colors-success-hover: #...;
//     --colors-success-active: #...;
//     ...
//   }

/** Semantic color roles exposed as CSS variables. */
export type SemanticName = 'success' | 'warning' | 'error' | 'info'

/** Every emitted token, including its interaction states. */
export type SemanticToken =
  | SemanticName
  | `${SemanticName}-hover`
  | `${SemanticName}-active`

/** Generated token map: `--colors-<token>` -> hex value. */
export type SemanticPalette = Record<SemanticToken, string>

export interface Hsl {
  /** Hue in degrees, [0, 360). */
  h: number
  /** Saturation, [0, 1]. */
  s: number
  /** HSL lightness (not luma), [0, 1]. */
  l: number
}

export interface Rgb {
  /** Normalised channels, [0, 1]. */
  r: number
  g: number
  b: number
}

/**
 * Semantic hue presets. Only the HUE differs per role — saturation and
 * lightness always come from the active Park UI primary.
 */
export const SEMANTIC_HUES: Record<SemanticName, number> = {
  success: 135,
  warning: 35,
  error: 15,
  info: 215,
}

/** Park UI solid background (the primary accent) custom property. */
export const PRIMARY_BASE_VAR = '--colors-color-palette-solid-bg'
/** Park UI solid background hover custom property. */
export const PRIMARY_HOVER_VAR = '--colors-color-palette-solid-bg-hover'
/** id of the <style> element this module injects (matches cleanupTheme's prefix). */
export const SEMANTIC_STYLE_ID = 'theme-semantic'

// Lightness bounds so a large Park UI state delta can never collapse a state
// colour to pure black or white.
const MIN_LIGHTNESS = 0.04
const MAX_LIGHTNESS = 0.96

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Parse a computed CSS colour (rgb()/rgba() from getComputedStyle, or a hex
 * literal) into normalised RGB channels. Returns null when unsupported.
 */
export function parseRgb(color: string): Rgb | null {
  const value = color.trim()

  const rgbMatch = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value)
  if (rgbMatch) {
    return {
      r: clamp(Number(rgbMatch[1]) / 255, 0, 1),
      g: clamp(Number(rgbMatch[2]) / 255, 0, 1),
      b: clamp(Number(rgbMatch[3]) / 255, 0, 1),
    }
  }

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 8) hex = hex.slice(0, 6)
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join('')
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
    }
  }

  return null
}

/** Convert normalised RGB to HSL (h in degrees, s/l in [0,1]). */
export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2

  if (delta === 0) return { h: 0, s: 0, l }

  const s = delta / (1 - Math.abs(2 * l - 1))

  let h: number
  if (max === r) h = ((g - b) / delta) % 6
  else if (max === g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4

  return { h: (h * 60 + 360) % 360, s, l }
}

function hueToRgb(p: number, q: number, t: number): number {
  let temp = t
  if (temp < 0) temp += 1
  if (temp > 1) temp -= 1
  if (temp < 1 / 6) return p + (q - p) * 6 * temp
  if (temp < 1 / 2) return q
  if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6
  return p
}

/** Convert HSL to 8-bit RGB channels. */
export function hslToRgb({ h, s, l }: Hsl): { r: number; g: number; b: number } {
  if (s === 0) {
    const grey = Math.round(l * 255)
    return { r: grey, g: grey, b: grey }
  }

  const hue = (((h % 360) + 360) % 360) / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  }
}

/** Convert HSL to a `#rrggbb` hex string. */
export function hslToHex(hsl: Hsl): string {
  const { r, g, b } = hslToRgb(hsl)
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Resolve a custom property to a concrete colour by letting the browser do the
 * substitution: the variable is assigned to a probe element's `color` and the
 * computed value is read back. Unlike getPropertyValue() this works whether the
 * declaration is a hex literal, var(), color-mix(), oklch(), etc.
 *
 * A control probe (same cascade position, `color: unset`) detects the
 * "variable not defined" case, where the probe would silently inherit the
 * parent colour and look like a valid value.
 *
 * Returns null when the variable cannot be resolved.
 */
export function resolveCssColor(variableName: string, target?: Element): string | null {
  if (typeof document === 'undefined') return null

  const host = target ?? document.documentElement
  const baseCss = 'position:absolute;left:-99999px;top:-99999px;visibility:hidden;'

  const probe = document.createElement('span')
  probe.style.cssText = baseCss
  probe.style.color = `var(${variableName})`

  const control = document.createElement('span')
  control.style.cssText = baseCss
  control.style.color = 'unset'

  host.append(probe, control)
  try {
    const value = getComputedStyle(probe).color
    if (!value || value === getComputedStyle(control).color) return null
    return value
  } finally {
    probe.remove()
    control.remove()
  }
}

/**
 * Build the semantic palette from the primary's base + hover values.
 *
 * - saturation and lightness come from the base primary
 * - each token swaps in its conventional semantic hue
 * - hover/active replay Park UI's own base -> hover lightness delta
 *   (active applies the delta twice; there is no Park UI solid-active token)
 *
 * Throws when either colour cannot be parsed.
 */
export function deriveSemanticPalette(baseColor: string, hoverColor: string): SemanticPalette {
  const baseRgb = parseRgb(baseColor)
  const hoverRgb = parseRgb(hoverColor)
  if (!baseRgb) throw new Error(`Unsupported primary base colour: ${baseColor}`)
  if (!hoverRgb) throw new Error(`Unsupported primary hover colour: ${hoverColor}`)

  const base = rgbToHsl(baseRgb)
  const hover = rgbToHsl(hoverRgb)
  // Park UI's authored state direction — negative in light mode, positive in
  // dark mode (hover gets lighter), so both modes are handled automatically.
  const deltaL = hover.l - base.l

  const palette = {} as SemanticPalette
  for (const name of Object.keys(SEMANTIC_HUES) as SemanticName[]) {
    const hue = SEMANTIC_HUES[name]
    const make = (l: number) =>
      hslToHex({ h: hue, s: base.s, l: clamp(l, MIN_LIGHTNESS, MAX_LIGHTNESS) })

    palette[name] = make(base.l)
    palette[`${name}-hover`] = make(base.l + deltaL)
    palette[`${name}-active`] = make(base.l + deltaL * 2)
  }

  return palette
}

/** Render the scoped stylesheet for a palette. */
export function buildSemanticCss(accent: string, mode: string, palette: SemanticPalette): string {
  const selector = `html[data-color-scheme='${accent}'][data-mode='${mode}']`
  const declarations = (Object.keys(palette) as SemanticToken[])
    .map((token) => `  --colors-${token}: ${palette[token]};`)
    .join('\n')

  return [
    '/* Semantic colours — GENERATED AT RUNTIME from the active Park UI primary.',
    '   Derived in src/core/theme/semantic-colors.ts via theme-loader.js; do not edit.',
    `   accent=${accent} mode=${mode} */`,
    `${selector} {`,
    declarations,
    '}',
    '',
  ].join('\n')
}

/**
 * Extract the active primary, derive the semantic palette and inject it as
 * <style id="theme-semantic">. Must run AFTER the accent stylesheet is in the
 * document AND after data-color-scheme / data-mode are set on <html>.
 *
 * Returns true when the palette was derived and injected.
 */
export function applySemanticColors(accent: string, mode: string): boolean {
  if (typeof document === 'undefined') return false

  const dropStyle = () => document.getElementById(SEMANTIC_STYLE_ID)?.remove()

  try {
    const base = resolveCssColor(PRIMARY_BASE_VAR)
    const hover = resolveCssColor(PRIMARY_HOVER_VAR)

    if (!base || !hover) {
      // Drop any palette left over from the previous accent — it would be
      // wrong for this scheme, and missing vars would fall back to inheritance.
      dropStyle()
      console.warn(
        `Semantic colours not derived: could not resolve ${PRIMARY_BASE_VAR}` +
          `${base ? '' : ' (base)'}${hover ? '' : ` / ${PRIMARY_HOVER_VAR} (hover)`}`,
      )
      return false
    }

    const css = buildSemanticCss(accent, mode, deriveSemanticPalette(base, hover))

    let style = document.getElementById(SEMANTIC_STYLE_ID) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = SEMANTIC_STYLE_ID
      document.head.appendChild(style)
    }
    style.textContent = css
    return true
  } catch (error) {
    dropStyle()
    console.warn('Semantic colours not derived:', error)
    return false
  }
}
