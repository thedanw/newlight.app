import type { SettingsSection, SettingsPage } from '@/core/settings/settings-schema'
import { 
  type DashboardWidget,
  type SettingsLink
} from '@/core/plugins/HookRegistry'
import { ElvantoSyncSettingsPage } from './settings/ElvantoSyncSettingsPage'
import { ElvantoSyncStatusWidget } from './widgets/ElvantoSyncStatusWidget'

/**
 * Register settings sections for this plugin
 * Called by PluginLoader via manifest.hooks.settingsSections
 */
export function registerElvantoSyncSettings(_register: (section: SettingsSection) => void): void {
  // The "Integrations" section is registered by core (order: 100)
  // This plugin only registers pages within that section
  // If we needed a custom section, we'd register it here:
  // register({ id: 'elvanto', title: 'Elvanto', description: 'Elvanto ChMS integration', order: 100 })
}

/**
 * Register settings pages for this plugin
 * Called by PluginLoader via manifest.hooks.settingsPages
 */
export function registerElvantoSyncPages(register: (page: SettingsPage) => void): void {
  register({
    sectionId: 'integrations',
    id: 'elvanto-sync',
    title: 'Elvanto Sync',
    component: ElvantoSyncSettingsPage,
    order: 0,
  })
}

/**
 * Register settings links for this plugin
 * Called by PluginLoader via manifest.hooks.settingsLinks
 *
 * Hooks into the People module settings section (`/settings/people`) so the
 * Elvanto Sync settings are reachable from the People module settings.
 */
export function registerElvantoSyncSettingsLinks(register: (link: SettingsLink) => void): void {
  register({
    sectionId: 'people',
    targetSectionId: 'integrations',
    targetPageId: 'elvanto-sync',
    label: 'Elvanto Sync',
    description: 'Configure two-way sync between New Light and Elvanto ChMS.',
    order: 0,
  })
}

/**
 * Register dashboard widgets for this plugin
 * Called by PluginLoader via manifest.hooks.dashboardWidgets
 */
export function registerElvantoSyncWidgets(register: (widget: DashboardWidget) => void): void {
  register({
    id: 'elvanto-sync-status',
    title: 'Elvanto Sync Status',
    component: ElvantoSyncStatusWidget,
    size: 'medium',
  })
}

// Plugin metadata for debugging
export const pluginMeta = {
  name: 'elvanto-sync',
  version: '1.0.0',
  displayName: 'Elvanto Sync',
}