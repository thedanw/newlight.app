/**
 * Plugin discovery — shared helpers for finding installed plugins.
 *
 * Plugins live in `public/content/plugins/<name>/manifest.json` (copied from
 * `src/content/plugins/` by `scripts/copy-plugins.mjs`, which also generates
 * `plugin-index.json`). Both the PluginLoader and the Plugins settings
 * section use these helpers so discovery stays consistent.
 */

export const PLUGINS_BASE_PATH = '/content/plugins/'

/**
 * Discover installed plugin folder names.
 * Prefers the build-time generated `plugin-index.json`; falls back to a
 * hardcoded list so the app still works before the index is generated.
 */
export async function discoverPluginNames(): Promise<string[]> {
  try {
    const response = await fetch(`${PLUGINS_BASE_PATH}plugin-index.json`)
    if (response.ok) {
      const index = await response.json()
      if (Array.isArray(index.plugins) && index.plugins.length > 0) {
        return index.plugins
      }
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: known plugins (in production this is build-time generated)
  return ['elvanto-sync']
}

/**
 * Fetch and parse a plugin's manifest.json.
 * Returns null if the manifest is missing or invalid.
 */
export async function fetchPluginManifest(
  pluginName: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${PLUGINS_BASE_PATH}${pluginName}/manifest.json`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}