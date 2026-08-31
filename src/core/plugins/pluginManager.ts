/**
 * PluginManager — module-level singleton that owns plugin loading state.
 *
 * The `PluginLoader` component initialises it at startup (`init` + `loadAll`)
 * and subscribes to it for rendering `PluginProvider` wrappers. The Plugins
 * settings UI calls `enable`/`disable` to activate or deactivate a plugin
 * WITHOUT a full page reload — hooks are registered/unregistered live and
 * React re-renders via the subscription.
 */
import { clearPluginRegistrations, pluginHooks } from './HookRegistry'
import { discoverPluginNames, PLUGINS_BASE_PATH } from './discovery'
import { validatePluginManifest, type PluginManifest } from './manifest-schema'
import { createPluginAPIContext, type PluginAPIContext } from './PluginAPI'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/core/lib/database.types'

type TypedSupabaseClient = SupabaseClient<Database>

export interface LoadedPlugin {
  manifest: PluginManifest
  apiContext: PluginAPIContext
  module: any // The loaded plugin module (ESM)
}

// Eagerly import all plugin entry points so Vite can bundle them
const pluginModules = import.meta.glob('/src/content/plugins/*/index.ts', { eager: true })

class PluginManager {
  private supabase: TypedSupabaseClient | null = null
  private loadedPlugins: LoadedPlugin[] = []
  private listeners = new Set<() => void>()

  /** Initialise with the app's Supabase client (called once by PluginLoader). */
  init(supabase: TypedSupabaseClient): void {
    this.supabase = supabase
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getPlugins(): LoadedPlugin[] {
    return this.loadedPlugins
  }

  isLoaded(pluginName: string): boolean {
    return this.loadedPlugins.some((p) => p.manifest.name === pluginName)
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }

  /**
   * Load all enabled plugins (called at startup). Clears any previous
   * registrations first so hot-reloads stay consistent.
   */
  async loadAll(): Promise<void> {
    if (!this.supabase) return
    clearPluginRegistrations()
    const pluginNames = await discoverPluginNames()
    const enabledStates = await this.getEnabledPluginStates()
    const loaded: LoadedPlugin[] = []
    for (const pluginName of pluginNames) {
      if (!enabledStates[pluginName]) {
        console.log(`[PluginManager] Plugin ${pluginName} is disabled — skipping`)
        continue
      }
      try {
        const plugin = await this.loadPlugin(pluginName)
        if (plugin) {
          loaded.push(plugin)
          console.log(`[PluginManager] Loaded plugin: ${pluginName} v${plugin.manifest.version}`)
        }
      } catch (err) {
        console.error(`[PluginManager] Failed to load plugin ${pluginName}:`, err)
      }
    }
    this.loadedPlugins = loaded
    this.notify()
  }

  /**
   * Dynamically enable a plugin: register its hooks and add its API context.
   * Throws if the plugin cannot be loaded (invalid manifest, missing entry).
   */
  async enable(pluginName: string): Promise<void> {
    if (!this.supabase) throw new Error('PluginManager not initialised')
    if (this.isLoaded(pluginName)) return
    const plugin = await this.loadPlugin(pluginName)
    if (!plugin) throw new Error(`Failed to load plugin ${pluginName}`)
    this.loadedPlugins = [...this.loadedPlugins, plugin]
    this.notify()
    console.log(`[PluginManager] Enabled plugin: ${pluginName} v${plugin.manifest.version}`)
  }

  /**
   * Dynamically disable a plugin: unregister its hooks and drop its context.
   */
  disable(pluginName: string): void {
    clearPluginRegistrations(pluginName)
    this.loadedPlugins = this.loadedPlugins.filter((p) => p.manifest.name !== pluginName)
    this.notify()
    console.log(`[PluginManager] Disabled plugin: ${pluginName}`)
  }

  private async getEnabledPluginStates(): Promise<Record<string, boolean>> {
    if (!this.supabase) return {}
    try {
      const { data, error } = await this.supabase.from('plugins').select('id, enabled')
      if (error) throw error
      const states: Record<string, boolean> = {}
      for (const row of data ?? []) {
        states[row.id] = row.enabled
      }
      return states
    } catch (err) {
      console.error('[PluginManager] Failed to load plugin states:', err)
      return {}
    }
  }

  private async loadPlugin(pluginName: string): Promise<LoadedPlugin | null> {
    if (!this.supabase) return null

    // Fetch manifest
    const manifestResponse = await fetch(`${PLUGINS_BASE_PATH}${pluginName}/manifest.json`)
    if (!manifestResponse.ok) {
      throw new Error(`Manifest not found for ${pluginName}`)
    }
    const manifestData = await manifestResponse.json()

    // Validate manifest
    const validation = validatePluginManifest(manifestData)
    if (!validation.success) {
      throw new Error(`Invalid manifest for ${pluginName}: ${validation.error.message}`)
    }
    const manifest = validation.data

    // Create API context for this plugin
    const apiContext = createPluginAPIContext(
      this.supabase,
      manifest.name,
      manifest.version,
      (path) => {
        window.location.href = path
      },
    )

    // Load plugin entry point (eagerly imported via import.meta.glob)
    const modulePath = `/src/content/plugins/${pluginName}/index.ts`
    const pluginModule = pluginModules[modulePath] || {}

    // Register hooks if plugin exports them
    if (manifest.hooks) {
      this.registerPluginHooks(manifest, pluginModule)
    }

    return { manifest, apiContext, module: pluginModule }
  }

  private registerPluginHooks(manifest: PluginManifest, pluginModule: any): void {
    const pluginName = manifest.name

    if (manifest.hooks?.settingsSections && pluginModule[manifest.hooks.settingsSections]) {
      pluginModule[manifest.hooks.settingsSections](pluginHooks.settingsSections(pluginName))
    }
    if (manifest.hooks?.settingsPages && pluginModule[manifest.hooks.settingsPages]) {
      pluginModule[manifest.hooks.settingsPages](pluginHooks.settingsPages(pluginName))
    }
    if (manifest.hooks?.dashboardWidgets && pluginModule[manifest.hooks.dashboardWidgets]) {
      pluginModule[manifest.hooks.dashboardWidgets](pluginHooks.dashboardWidgets(pluginName))
    }
    if (manifest.hooks?.navItems && pluginModule[manifest.hooks.navItems]) {
      pluginModule[manifest.hooks.navItems](pluginHooks.navItems(pluginName))
    }
    if (manifest.hooks?.settingsLinks && pluginModule[manifest.hooks.settingsLinks]) {
      pluginModule[manifest.hooks.settingsLinks](pluginHooks.settingsLinks(pluginName))
    }
  }
}

export const pluginManager = new PluginManager()