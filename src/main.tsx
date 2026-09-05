import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './core/theme/theme.css'
import { initializeTheme } from './core/theme/theme-loader'
import { applyFont, detectFont } from './core/theme/font-loader'
import { supabase } from './core/lib/supabase'
import App from './App'

const APP_SETTINGS_KEY = 'app-settings'
const APP_SETTINGS_ENV = import.meta.env.MODE ?? 'development'

async function boot() {
  let themeState = {
    accent: 'orange' as const,
    gray: 'neutral' as const,
    radius: 'md' as const,
    font: 'inter' as const,
    sidebarStyle: 'light' as const,
    mode: 'light' as const,
  }

  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', APP_SETTINGS_KEY)
      .eq('environment', APP_SETTINGS_ENV)
      .maybeSingle()

    if (data?.value) {
      const raw = data.value as { theme?: { scheme?: string; accent?: string; gray?: string; font?: string; radius?: string; sidebarStyle?: string } }
      if (raw.theme) {
        const t = raw.theme
        themeState = {
          accent: (t?.accent as 'orange') ?? 'orange',
          gray: (t?.gray as 'neutral') ?? 'neutral',
          radius: (t?.radius as 'md') ?? 'md',
          font: (t?.font as 'inter') ?? 'inter',
          sidebarStyle: (t?.sidebarStyle as 'light') ?? 'light',
          mode: (t?.scheme as 'light') ?? 'light',
        }
      }
    }
  } catch {
    // Fallback to defaults if Supabase is unreachable
  }

  await initializeTheme(themeState)
  applyFont(detectFont(document.documentElement))

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

boot()
