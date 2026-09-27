import { describe, expect, it, afterEach, vi } from 'vitest'
import {
  SEMANTIC_HUES,
  SEMANTIC_STYLE_ID,
  applySemanticColors,
  buildSemanticCss,
  deriveSemanticPalette,
  hslToHex,
  parseRgb,
  rgbToHsl,
} from '../semantic-colors'
import type { SemanticName, SemanticToken } from '../semantic-colors'

// Park UI orange values from public/core/theme/colors/orange.css.
const ORANGE_BASE = '#f76b15'
const ORANGE_HOVER_LIGHT = '#ef5f00'
const ORANGE_HOVER_DARK = '#ff801f'

function hslOf(hex: string) {
  const rgb = parseRgb(hex)
  if (!rgb) throw new Error(`not parseable: ${hex}`)
  return rgbToHsl(rgb)
}

describe('parseRgb', () => {
  it('parses computed rgb()/rgba() output', () => {
    expect(parseRgb('rgb(247, 107, 21)')).toEqual({ r: 247 / 255, g: 107 / 255, b: 21 / 255 })
    expect(parseRgb('rgba(0, 0, 0, 0.5)')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('parses 3-, 6- and 8-digit hex', () => {
    expect(parseRgb('#f76b15')).toEqual({ r: 247 / 255, g: 107 / 255, b: 21 / 255 })
    expect(parseRgb('#fff')).toEqual({ r: 1, g: 1, b: 1 })
    // 8-digit hex keeps only the opaque RGB part.
    expect(parseRgb('#f76b1580')).toEqual({ r: 247 / 255, g: 107 / 255, b: 21 / 255 })
  })

  it('rejects unsupported colour formats', () => {
    expect(parseRgb('oklch(0.7 0.1 30)')).toBeNull()
    expect(parseRgb('not-a-colour')).toBeNull()
  })
})

describe('rgbToHsl / hslToHex', () => {
  it('converts the Park UI orange primary to HSL', () => {
    const hsl = hslOf(ORANGE_BASE)
    expect(hsl.h).toBeCloseTo(22.8, 1)
    expect(hsl.s).toBeCloseTo(0.93, 2)
    expect(hsl.l).toBeCloseTo(0.525, 2)
  })

  it('round-trips HSL -> hex -> HSL without drifting', () => {
    const original = { h: 145, s: 0.62, l: 0.41 }
    const roundTripped = hslOf(hslToHex(original))
    expect(roundTripped.h).toBeCloseTo(original.h, 0)
    expect(roundTripped.s).toBeCloseTo(original.s, 2)
    expect(roundTripped.l).toBeCloseTo(original.l, 2)
  })

  it('handles greys (zero saturation) and hue wraparound', () => {
    expect(hslToHex({ h: 0, s: 0, l: 0.5 })).toBe('#808080')
    expect(hslToHex({ h: 360, s: 1, l: 0.5 })).toBe(hslToHex({ h: 0, s: 1, l: 0.5 }))
  })
})

describe('deriveSemanticPalette', () => {
  const palette = deriveSemanticPalette(ORANGE_BASE, ORANGE_HOVER_LIGHT)

  it('emits every semantic token with base, hover and active states', () => {
    const expected: SemanticToken[] = []
    for (const name of Object.keys(SEMANTIC_HUES) as SemanticName[]) {
      expected.push(name, `${name}-hover`, `${name}-active`)
    }
    expect(Object.keys(palette).sort()).toEqual([...expected].sort())
  })

  it("adopts the primary's saturation and lightness for every hue", () => {
    const base = hslOf(ORANGE_BASE)
    for (const name of Object.keys(SEMANTIC_HUES) as SemanticName[]) {
      const token = hslOf(palette[name])
      expect(token.h).toBeCloseTo(SEMANTIC_HUES[name], 0)
      expect(token.s).toBeCloseTo(base.s, 2)
      expect(token.l).toBeCloseTo(base.l, 2)
    }
  })

  it('replays the Park UI base -> hover lightness delta for states', () => {
    const base = hslOf(ORANGE_BASE)
    const parkHover = hslOf(ORANGE_HOVER_LIGHT)
    const deltaL = parkHover.l - base.l

    expect(deltaL).toBeLessThan(0) // light mode: Park UI hover darkens
    expect(hslOf(palette['success-hover']).l).toBeCloseTo(base.l + deltaL, 2)
    expect(hslOf(palette['success-active']).l).toBeCloseTo(base.l + deltaL * 2, 2)
  })

  it('follows the Park UI dark-mode delta (hover gets lighter)', () => {
    const base = hslOf(ORANGE_BASE)
    expect(hslOf(ORANGE_HOVER_DARK).l).toBeGreaterThan(base.l)

    const darkPalette = deriveSemanticPalette(ORANGE_BASE, ORANGE_HOVER_DARK)
    expect(hslOf(darkPalette['error-hover']).l).toBeGreaterThan(hslOf(darkPalette.error).l)
  })

  it('throws on unparseable input instead of emitting broken CSS', () => {
    expect(() => deriveSemanticPalette('nope', ORANGE_HOVER_LIGHT)).toThrow(/Unsupported primary base/)
    expect(() => deriveSemanticPalette(ORANGE_BASE, 'nope')).toThrow(/Unsupported primary hover/)
  })
})

describe('buildSemanticCss', () => {
  it('scopes declarations to the active accent and mode', () => {
    const palette = deriveSemanticPalette(ORANGE_BASE, ORANGE_HOVER_LIGHT)
    const css = buildSemanticCss('orange', 'dark', palette)

    expect(css).toContain("html[data-color-scheme='orange'][data-mode='dark'] {")
    expect(css).toContain(`--colors-success: ${palette.success};`)
    expect(css).toContain(`--colors-success-hover: ${palette['success-hover']};`)
    expect(css).toContain(`--colors-success-active: ${palette['success-active']};`)
    expect(css).toContain(`--colors-error: ${palette.error};`)
    expect(css).toContain(`--colors-warning: ${palette.warning};`)
    expect(css).toContain(`--colors-info: ${palette.info};`)
    expect(css.trimEnd().endsWith('}')).toBe(true)
  })
})

describe('applySemanticColors', () => {
  afterEach(() => {
    document.getElementById(SEMANTIC_STYLE_ID)?.remove()
    document.documentElement.style.removeProperty('--colors-color-palette-solid-bg')
    document.documentElement.style.removeProperty('--colors-color-palette-solid-bg-hover')
  })

  it('injects a theme-semantic style when the Park UI primary resolves', () => {
    document.documentElement.style.setProperty('--colors-color-palette-solid-bg', ORANGE_BASE)
    document.documentElement.style.setProperty(
      '--colors-color-palette-solid-bg-hover',
      ORANGE_HOVER_LIGHT,
    )

    expect(applySemanticColors('orange', 'light')).toBe(true)

    const injected = document.getElementById(SEMANTIC_STYLE_ID)
    expect(injected).not.toBeNull()
    expect(injected?.textContent).toContain("html[data-color-scheme='orange'][data-mode='light'] {")
    expect(injected?.textContent).toContain('--colors-success:')
    expect(injected?.textContent).toContain('--colors-success-hover:')
    expect(injected?.textContent).toContain('--colors-error-active:')
  })

  it('removes a stale palette when the primary cannot be resolved', () => {
    const stale = document.createElement('style')
    stale.id = SEMANTIC_STYLE_ID
    stale.textContent = 'html { --colors-success: #123456; }'
    document.head.appendChild(stale)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(applySemanticColors('blue', 'light')).toBe(false)
    expect(document.getElementById(SEMANTIC_STYLE_ID)).toBeNull()
    warn.mockRestore()
  })
})
