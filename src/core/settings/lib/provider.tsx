'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/core/lib/supabase'
import { useAuth } from '@/core/auth'
import type { Session, User } from '@supabase/supabase-js'
import type {
  AccentScheme,
  ColorMode,
  GrayScheme,
  RadiusKey,
  SidebarStyle,
} from '@/core/theme/theme-loader'
import type { FontKey } from '@/core/theme/font-loader'

/**
 * AppSettings — persisted shape for the single `app-settings` key in
 * `platform_settings` (decision #15). All fields are JSON-compatible so the
 * value maps 1:1 onto the `jsonb` column. Theme fields use the theme-loader
 * types so the shape is structurally identical to the section's `BrandState`.
 */
export type AppSettings = {
  theme: {
    scheme: ColorMode
    accent: AccentScheme
    gray: GrayScheme
    font: FontKey
    radius: RadiusKey
    sidebarStyle: SidebarStyle
    headings: Record<string, boolean>
  }
  churchInfo: {
    churchName: string
    appName: string
    churchEmail: string
    website: string
  }
  logoUrl: string | null
}

const APP_SETTINGS_KEY = 'app-settings'
const APP_SETTINGS_ENV = import.meta.env.MODE ?? 'development'

/**
 * SettingsProvider — React context exposing Supabase client + session
 * (consumed from AuthProvider, decision #9) plus app settings.
 */
interface SettingsContextValue {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  isLoading: boolean
  logoUrl: string | null
  /** Read the persisted `app-settings` row (null if none). */
  getAppSettings: () => Promise<AppSettings | null>
  /** Upsert the `app-settings` row. */
  saveAppSettings: (settings: AppSettings) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { supabase, session, user, isLoading } = useAuth()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Load logo URL at startup
  useEffect(() => {
    let mounted = true
    async function loadLogo() {
      const settings = await getAppSettings()
      if (mounted && settings?.logoUrl) {
        setLogoUrl(settings.logoUrl)
      }
    }
    loadLogo()
    return () => { mounted = false }
  }, [])

  const getAppSettings = async (): Promise<AppSettings | null> => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', APP_SETTINGS_KEY)
      .eq('environment', APP_SETTINGS_ENV)
      .maybeSingle()
    if (error || !data) return null
    return data.value as unknown as AppSettings
  }

  const saveAppSettings = async (settings: AppSettings): Promise<void> => {
    const { error } = await supabase
      .from('platform_settings')
      .upsert(
        {
          id: crypto.randomUUID(),
          key: APP_SETTINGS_KEY,
          environment: APP_SETTINGS_ENV,
          value: settings,
        },
        { onConflict: 'key,environment' },
      )
    if (error) {
      throw error
    }
  }

  return (
    <SettingsContext.Provider
      value={{ supabase, session, user, isLoading, logoUrl, getAppSettings, saveAppSettings }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
