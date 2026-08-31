import { useEffect, useState, type ReactNode } from 'react'
import { PluginProvider } from './PluginAPI'
import { pluginManager } from './pluginManager'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/core/lib/database.types'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * PluginLoader — initialises the plugin system at app startup.
 *
 * It delegates all loading/registration to the module-level `pluginManager`
 * singleton and subscribes to it so that dynamically enabling/disabling a
 * plugin (from the Plugins settings UI) re-renders the `PluginProvider`
 * wrappers WITHOUT a full page reload.
 */
export function PluginLoader({
  children,
  supabase,
}: {
  children: ReactNode
  supabase: TypedSupabaseClient
}) {
  const [loadedPlugins, setLoadedPlugins] = useState(() => pluginManager.getPlugins())

  useEffect(() => {
    // Initialise the manager with the app's Supabase client
    pluginManager.init(supabase)

    // Subscribe to dynamic enable/disable changes
    const unsubscribe = pluginManager.subscribe(() => {
      setLoadedPlugins(pluginManager.getPlugins())
    })

    // Load all enabled plugins at startup
    void pluginManager.loadAll()

    return unsubscribe
  }, [supabase])

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