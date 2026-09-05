// Type declarations for the dynamic theme loader (src/core/theme/theme-loader.js).
// The loader fetches the selected color-scheme CSS (remap-only, no hex) and
// writes the matching <html> data-* attributes at runtime.

/** All 26 Park UI accents (25 chromatic + neutral as monochrome accent). */
export type AccentScheme =
  | 'amber'
  | 'blue'
  | 'bronze'
  | 'brown'
  | 'crimson'
  | 'cyan'
  | 'gold'
  | 'grass'
  | 'green'
  | 'indigo'
  | 'iris'
  | 'jade'
  | 'lime'
  | 'mint'
  | 'neutral'
  | 'orange'
  | 'pink'
  | 'plum'
  | 'purple'
  | 'red'
  | 'ruby'
  | 'sky'
  | 'teal'
  | 'tomato'
  | 'violet'
  | 'yellow'
export type GrayScheme = 'neutral' | 'mauve' | 'olive' | 'sage' | 'sand' | 'slate'
export type ColorMode = 'light' | 'dark'
export type RadiusKey = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type SidebarStyle = 'light' | 'dark' | 'accent-dark' | 'accent-light'
export type FontKey = 'inter' | 'poppins' | 'raleway' | 'dm-sans'

export interface ThemeOptions {
  /** Accent color scheme (data-color-scheme). Defaults to 'orange'. */
  accent?: AccentScheme
  /** Gray / neutral scheme (data-gray-color). Defaults to 'neutral'. */
  gray?: GrayScheme
  /** Corner radius scale (data-radius). Defaults to 'md'. */
  radius?: RadiusKey
  /** Font family key (data-font + inline font-family). Defaults to 'inter'. */
  font?: FontKey
  /** Sidebar treatment (data-sidebar-style). Defaults to 'light'. */
  sidebarStyle?: SidebarStyle
  /** Light/dark mode (data-mode). initializeTheme defaults to 'light'. */
  mode?: ColorMode
  /** Light/dark mode (data-mode). switchTheme defaults to 'light'. */
  colorScheme?: ColorMode
  /** Space-separated heading style tokens (data-heading-style). */
  headingStyle?: string
}

export function initializeTheme(options: ThemeOptions): Promise<void>
export function initializeTheme(accent: AccentScheme, gray: GrayScheme): Promise<void>

export function switchTheme(options?: ThemeOptions): Promise<void>

export function getCurrentTheme(): {
  accent: AccentScheme
  gray: GrayScheme
  radius: RadiusKey
  font: FontKey
}

export function cleanupTheme(): void
