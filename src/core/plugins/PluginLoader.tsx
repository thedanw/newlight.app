import { useEffect, useState, type ReactNode } from 'react'
import { PluginProvider } from './PluginAPI'
import { pluginManager } from './pluginManager'
import { useAuth } from '@/core/auth'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/core/lib/database.types'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * PluginLoader — initialises the plugin system once the user is signed in.
 *
 * Plugin enable-state lives in the `plugins` table, which is super-admin-only
 * under RLS (audit REQ-2 / remediation 1.6). The loader therefore (re)loads
 * plugins whenever a session becomes available — not just once at boot, which
 * would run the `plugins` query while still anonymous and silently load
 * nothing — and unloads everything on sign-out.
 */
export function PluginLoader({
  children,
  supabase,
}: {
  children: ReactNode
  supabase: TypedSupabaseClient
}) {
  const { session, isLoading } = useAuth()
  const [loadedPlugins, setLoadedPlugins] = useState(() => pluginManager.getPlugins())

  // Initialise once; stay subscribed so enable/disable from the settings UI
  // re-renders without a full page reload.
  useEffect(() => {
    pluginManager.init(supabase)
    return pluginManager.subscribe(() => {
      setLoadedPlugins(pluginManager.getPlugins())
    })
  }, [supabase])

  // (Re)load when the signed-in user changes; unload when signed out.
  useEffect(() => {
    if (isLoading) return
    if (session) {
      void pluginManager.loadAll()
    } else {
      pluginManager.unloadAll()
    }
  }, [session, isLoading])

  // Provide API context to all loaded plugins.
  // Each plugin gets its own Provider with its specific context.
  const renderPluginProviders = (children: ReactNode) => {
    let result = children
    // Wrap in reverse order so first loaded is outermost
    for (const plugin of [...loadedPlugins].reverse()) {
      result = (
        <PluginProvider key={plugin.manifest.name} context={plugin.apiContext}>
          {result}
        </PluginProvider>
      )
    }
    return result
  }

  return <>{renderPluginProviders(children)}</>
}

/**
 * Hook to access loaded plugins info (for debugging/admin UI)
 */
export function useLoadedPlugins() {
  return pluginManager.getPlugins()
}

/**
 * Initialize plugin system at app root
 * Call this once in your App.tsx or main.tsx
 */
export async function initializePluginSystem(_supabase: TypedSupabaseClient): Promise<void> {
  // This is called by the PluginLoader component
  // Exported for testing or manual initialization
  console.log('[PluginSystem] Initializing...')
}