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
  let themeState = { accent: 'orange' as const, gray: 'neutral' as const }

  try {
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', APP_SETTINGS_KEY)
      .eq('environment', APP_SETTINGS_ENV)
      .maybeSingle()

    if (data?.value) {
      const value = data.value as { theme?: { accent?: string; gray?: string } }
      if (value.theme) {
        themeState = {
          accent: (value.theme.accent as 'orange') ?? 'orange',
          gray: (value.theme.gray as 'neutral') ?? 'neutral',
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
