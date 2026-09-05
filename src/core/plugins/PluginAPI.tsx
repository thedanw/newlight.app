import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/core/lib/database.types'
import { createContext, useContext, type ReactNode } from 'react'

export type TypedSupabaseClient = SupabaseClient<Database>

export interface PluginSettingsAPI {
  getConfig: <T>(key: string) => Promise<T | null>
  setConfig: <T>(key: string, value: T) => Promise<void>
  getCredentials: () => Promise<{ apiKey: string } | null>
  setCredentials: (apiKey: string) => Promise<void>
}

export interface PluginToastAPI {
  success: (message: string, options?: { duration?: number }) => void
  error: (message: string, options?: { duration?: number }) => void
  info: (message: string, options?: { duration?: number }) => void
  warning: (message: string, options?: { duration?: number }) => void
}

export interface PluginRouterAPI {
  navigate: (path: string) => void
  goToSettings: (sectionId: string, pageId?: string) => void
}

export interface PluginI18nAPI {
  t: (key: string, params?: Record<string, string | number>) => string
}

export interface PluginAPIContext {
  supabase: TypedSupabaseClient
  settings: PluginSettingsAPI
  router: PluginRouterAPI
  toast: PluginToastAPI
  i18n: PluginI18nAPI
  pluginName: string
  pluginVersion: string
}

export function createPluginSettingsAPI(
  supabase: SupabaseClient,
  pluginName: string
): PluginSettingsAPI {
  const configPrefix = `${pluginName}_`
  
  return {
    async getConfig<T>(key: string): Promise<T | null> {
      const { data, error } = await (supabase as any)
        .from('elvanto_sync_config')
        .select('value')
        .eq('key', `${configPrefix}${key}`)
        .maybeSingle()
      
      if (error) {
        console.error(`[PluginSettings] Failed to get config ${key}:`, error)
        return null
      }
      return (data?.value as T) ?? null
    },
    
    async setConfig<T>(key: string, value: T): Promise<void> {
      const { error } = await (supabase as any)
        .from('elvanto_sync_config')
        .upsert({
          key: `${configPrefix}${key}`,
          value: value as any,
          environment: 'production',
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        }, { onConflict: 'key' })
      
      if (error) {
        console.error(`[PluginSettings] Failed to set config ${key}:`, error)
        throw error
      }
    },
    
    async getCredentials(): Promise<{ apiKey: string } | null> {
      const settingsId = '00000000-0000-0000-0000-000000000001'
      const { data, error } = await (supabase as any)
        .from('elvanto_settings')
        .select('api_key_encrypted')
        .eq('id', settingsId)
        .maybeSingle()
      
      if (error || !data) {
        return null
      }
      
      return { apiKey: data.api_key_encrypted }
    },
    
    async setCredentials(apiKey: string): Promise<void> {
      const settingsId = '00000000-0000-0000-0000-000000000001'
      
      const { error } = await (supabase as any)
        .from('elvanto_settings')
        .upsert({
          id: settingsId,
          api_key_encrypted: apiKey,
          environment: 'production',
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        }, { onConflict: 'id' })
      
      if (error) {
        console.error('[PluginSettings] Failed to set credentials:', error)
        throw error
      }
    },
  }
}

export function createPluginRouterAPI(navigate: (path: string) => void): PluginRouterAPI {
  return {
    navigate,
    goToSettings: (sectionId: string, pageId?: string) => {
      const path = pageId ? `/settings/${sectionId}/${pageId}` : `/settings/${sectionId}`
      navigate(path)
    },
  }
}

export function createPluginToastAPI(): PluginToastAPI {
  return {
    success: (message, options) => console.log(`[Toast:success] ${message}`, options ?? {}),
    error: (message, options) => console.error(`[Toast:error] ${message}`, options ?? {}),
    info: (message, options) => console.info(`[Toast:info] ${message}`, options ?? {}),
    warning: (message, options) => console.warn(`[Toast:warning] ${message}`, options ?? {}),
  }
}

export function createPluginI18nAPI(): PluginI18nAPI {
  return {
    t: (key: string, params?: Record<string, string | number>) => {
      if (!params) return key
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
        key
      )
    },
  }
}

export function createPluginAPIContext(
  supabase: SupabaseClient,
  pluginName: string,
  pluginVersion: string,
  navigate: (path: string) => void
): PluginAPIContext {
  return {
    supabase: supabase as TypedSupabaseClient,
    settings: createPluginSettingsAPI(supabase, pluginName),
    router: createPluginRouterAPI(navigate),
    toast: createPluginToastAPI(),
    i18n: createPluginI18nAPI(),
    pluginName,
    pluginVersion,
  }
}

export function usePluginAPI(): PluginAPIContext {
  throw new Error('usePluginAPI must be used within a PluginProvider. Ensure your plugin is loaded via PluginLoader.')
}

const PluginAPIContext = createContext<PluginAPIContext | null>(null)

export function PluginProvider({ 
  children, 
  context 
}: { 
  children: ReactNode; 
  context: PluginAPIContext 
}) {
  return (
    <PluginAPIContext.Provider value={context}>
      {children}
    </PluginAPIContext.Provider>
  )
}

export function usePluginAPIContext(): PluginAPIContext {
  const ctx = useContext(PluginAPIContext)
  if (!ctx) {
    throw new Error('usePluginAPIContext must be used within a PluginProvider')
  }
  return ctx
}
