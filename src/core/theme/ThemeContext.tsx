import { createContext, useContext, useSyncExternalStore, useRef } from 'react'
import type { AccentScheme, GrayScheme, ColorMode } from './theme-loader.d'

interface ThemeLoaderInterface {
  initializeTheme: (options: any) => Promise<void>
  switchTheme: (options: any) => Promise<void>
  getCurrentTheme: () => { accent: string; gray: string; radius: string; font: string }
  cleanupTheme: () => void
}

declare global {
  interface Window {
    ThemeLoader: ThemeLoaderInterface
  }
}

interface ThemeState {
  accent: AccentScheme
  gray: GrayScheme
  mode: ColorMode
  radius: string
  font: string
}

function createSnapshot(): ThemeState {
  if (typeof window !== 'undefined' && window.ThemeLoader) {
    const t = window.ThemeLoader.getCurrentTheme()
    const html = document.documentElement
    return {
      accent: t.accent as AccentScheme,
      gray: t.gray as GrayScheme,
      mode: (html.getAttribute('data-mode') as ColorMode) ?? 'light',
      radius: t.radius,
      font: t.font,
    }
  }
  return { accent: 'orange', gray: 'neutral', mode: 'light', radius: 'md', font: 'inter' }
}

function subscribe(callback: () => void) {
  window.addEventListener('theme-change', callback)
  return () => window.removeEventListener('theme-change', callback)
}

const ThemeContext = createContext<{
  theme: ThemeState
  switchTheme: (options: Partial<ThemeState>) => Promise<void>
} | null>(null)

function shallowEqual(a: ThemeState, b: ThemeState): boolean {
  return (
    a.accent === b.accent &&
    a.gray === b.gray &&
    a.mode === b.mode &&
    a.radius === b.radius &&
    a.font === b.font
  )
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshotRef = useRef<ThemeState>(createSnapshot())

  const getSnapshot = () => {
    const newSnapshot = createSnapshot()
    if (!shallowEqual(snapshotRef.current, newSnapshot)) {
      snapshotRef.current = newSnapshot
    }
    return snapshotRef.current
  }

  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const switchTheme = async (options: Partial<ThemeState>) => {
    if (window.ThemeLoader) {
      await window.ThemeLoader.switchTheme(options as any)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, switchTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider')
  return ctx
}