'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/core/lib/supabase'
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
 * SettingsProvider — React context exposing Supabase client + session.
 * 
 * In the lab (no auth), provides a mock/fallback session.
 * In the final app, uses real Supabase auth session.
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
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    // In the lab, we don't have real auth — provide a mock session
    // In production, this would use supabase.auth.getSession() and onAuthStateChange
    
    // Check if we have real Supabase env vars
    const hasRealAuth = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (hasRealAuth) {
      // Real auth path
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    } else {
      // Lab mock/fallback — anonymous session
      const mockSession: Session = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'lab-user',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'lab@newlight.app',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      }
      setSession(mockSession)
      setUser(mockSession.user)
      setIsLoading(false)
    }
  }, [])

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
