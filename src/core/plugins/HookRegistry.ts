import type { ComponentType } from 'react'
import type { SettingsSection, SettingsPage } from '@/core/settings/settings-schema'

/**
 * Hook Registry — Central registry for plugin-registered extensions
 * Plugins register via hooks declared in their manifest
 */

// Dashboard widget type
export interface DashboardWidget {
  id: string
  title: string
  component: ComponentType
  size?: 'small' | 'medium' | 'large'
}

// Navigation item type
export interface NavItem {
  id: string
  label: string
  route: string
  icon?: string
  order?: number
}

/**
 * Settings link — a plugin-provided link rendered inside a settings section
 * (e.g. the Elvanto Sync plugin linking to its settings from the People
 * module settings section).
 */
export interface SettingsLink {
  /** Settings section id where the link should appear (e.g. 'people'). */
  sectionId: string
  /** Target settings section to navigate to. */
  targetSectionId: string
  /** Optional target settings page within the target section. */
  targetPageId?: string
  label: string
  description?: string
  order?: number
}

// Internal storage
const pluginSections: SettingsSection[] = []
const pluginPages: SettingsPage[] = []
const pluginWidgets: DashboardWidget[] = []
const pluginNavItems: NavItem[] = []
const pluginSettingsLinks: SettingsLink[] = []

// Track which plugin registered what (for debugging/unloading)
const pluginRegistrations = new Map<string, {
  sections: string[]
  pages: string[]
  widgets: string[]
  navItems: string[]
  settingsLinks: string[]
}>()

/**
 * Register a settings section from a plugin
 */
export function registerPluginSettingsSection(section: SettingsSection, pluginName: string): void {
  if (pluginSections.some((s) => s.id === section.id)) {
    console.warn(`[HookRegistry] Settings section "${section.id}" already registered (by ${pluginName})`)
    return
  }
  pluginSections.push(section)
  pluginSections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  
  // Track registration
  const reg = pluginRegistrations.get(pluginName) ?? { sections: [], pages: [], widgets: [], navItems: [], settingsLinks: [] }
  reg.sections.push(section.id)
  pluginRegistrations.set(pluginName, reg)
}

/**
 * Register a settings page from a plugin
 */
export function registerPluginSettingsPage(page: SettingsPage, pluginName: string): void {
  const key = `${page.sectionId}/${page.id}`
  if (pluginPages.some((p) => p.sectionId === page.sectionId && p.id === page.id)) {
    console.warn(`[HookRegistry] Settings page "${key}" already registered (by ${pluginName})`)
    return
  }
  pluginPages.push(page)
  pluginPages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  
  const reg = pluginRegistrations.get(pluginName) ?? { sections: [], pages: [], widgets: [], navItems: [], settingsLinks: [] }
  reg.pages.push(key)
  pluginRegistrations.set(pluginName, reg)
}

/**
 * Register a dashboard widget from a plugin
 */
export function registerPluginDashboardWidget(widget: DashboardWidget, pluginName: string): void {
  if (pluginWidgets.some((w) => w.id === widget.id)) {
    console.warn(`[HookRegistry] Dashboard widget "${widget.id}" already registered (by ${pluginName})`)
    return
  }
  pluginWidgets.push(widget)
  
  const reg = pluginRegistrations.get(pluginName) ?? { sections: [], pages: [], widgets: [], navItems: [], settingsLinks: [] }
  reg.widgets.push(widget.id)
  pluginRegistrations.set(pluginName, reg)
}

/**
 * Register a navigation item from a plugin
 */
export function registerPluginNavItem(item: NavItem, pluginName: string): void {
  if (pluginNavItems.some((n) => n.id === item.id)) {
    console.warn(`[HookRegistry] Nav item "${item.id}" already registered (by ${pluginName})`)
    return
  }
  pluginNavItems.push(item)
  pluginNavItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  
  const reg = pluginRegistrations.get(pluginName) ?? { sections: [], pages: [], widgets: [], navItems: [], settingsLinks: [] }
  reg.navItems.push(item.id)
  pluginRegistrations.set(pluginName, reg)
}

/**
 * Register a settings link from a plugin (rendered inside a settings section)
 */
export function registerPluginSettingsLink(link: SettingsLink, pluginName: string): void {
  const key = `${link.sectionId}/${link.targetSectionId}/${link.targetPageId ?? ''}`
  if (pluginSettingsLinks.some((l) => l.sectionId === link.sectionId && l.targetSectionId === link.targetSectionId && l.targetPageId === link.targetPageId)) {
    console.warn(`[HookRegistry] Settings link "${key}" already registered (by ${pluginName})`)
    return
  }
  pluginSettingsLinks.push(link)
  pluginSettingsLinks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const reg = pluginRegistrations.get(pluginName) ?? { sections: [], pages: [], widgets: [], navItems: [], settingsLinks: [] }
  reg.settingsLinks.push(key)
  pluginRegistrations.set(pluginName, reg)
}

/**
 * Get all registered settings links for a settings section
 */
export function getSettingsLinks(sectionId: string): SettingsLink[] {
  return pluginSettingsLinks.filter((l) => l.sectionId === sectionId)
}

/**
 * Get all settings pages registered by a specific plugin
 * (used by the Plugins section to link to a plugin's settings)
 */
export function getPluginSettingsPages(pluginName: string): SettingsPage[] {
  const reg = pluginRegistrations.get(pluginName)
  if (!reg) return []
  return reg.pages
    .map((key) => {
      const [sectionId, pageId] = key.split('/')
      return pluginPages.find((p) => p.sectionId === sectionId && p.id === pageId)
    })
    .filter((p): p is SettingsPage => Boolean(p))
}

/**
 * Get all registered settings sections (core + plugins)
 */
export function getAllSettingsSections(): SettingsSection[] {
  return pluginSections
}

/**
 * Get all registered settings pages for a section (core + plugins)
 */
export function getAllSettingsPages(sectionId: string): SettingsPage[] {
  return pluginPages.filter((p) => p.sectionId === sectionId)
}

/**
 * Get all registered dashboard widgets
 */
export function getAllDashboardWidgets(): DashboardWidget[] {
  return pluginWidgets
}

/**
 * Get all registered navigation items
 */
export function getAllNavItems(): NavItem[] {
  return pluginNavItems
}

/**
 * Get registration info for a plugin (for debugging)
 */
export function getPluginRegistrations(pluginName: string) {
  return pluginRegistrations.get(pluginName)
}

/**
 * Clear all plugin registrations (for testing/hot reload)
 */
export function clearPluginRegistrations(pluginName?: string): void {
  if (pluginName) {
    const reg = pluginRegistrations.get(pluginName)
    if (reg) {
      // Remove sections
      reg.sections.forEach((id) => {
        const idx = pluginSections.findIndex((s) => s.id === id)
        if (idx >= 0) pluginSections.splice(idx, 1)
      })
      // Remove pages
      reg.pages.forEach((key) => {
        const [sectionId, pageId] = key.split('/')
        const idx = pluginPages.findIndex((p) => p.sectionId === sectionId && p.id === pageId)
        if (idx >= 0) pluginPages.splice(idx, 1)
      })
      // Remove widgets
      reg.widgets.forEach((id) => {
        const idx = pluginWidgets.findIndex((w) => w.id === id)
        if (idx >= 0) pluginWidgets.splice(idx, 1)
      })
      // Remove nav items
      reg.navItems.forEach((id) => {
        const idx = pluginNavItems.findIndex((n) => n.id === id)
        if (idx >= 0) pluginNavItems.splice(idx, 1)
      })
      // Remove settings links
      reg.settingsLinks.forEach((key) => {
        const [sectionId, targetSectionId, targetPageId] = key.split('/')
        const idx = pluginSettingsLinks.findIndex(
          (l) => l.sectionId === sectionId && l.targetSectionId === targetSectionId && (l.targetPageId ?? '') === targetPageId
        )
        if (idx >= 0) pluginSettingsLinks.splice(idx, 1)
      })
      pluginRegistrations.delete(pluginName)
    }
  } else {
    // Clear all
    pluginSections.length = 0
    pluginPages.length = 0
    pluginWidgets.length = 0
    pluginNavItems.length = 0
    pluginSettingsLinks.length = 0
    pluginRegistrations.clear()
  }
}

/**
 * Hook registration functions that plugins call
 * These are the "hook implementations" declared in manifest.json
 */
export const pluginHooks = {
  settingsSections: (pluginName: string) => {
    // Plugin calls this with its register function
    // We wrap to track plugin name
    return (section: SettingsSection) => registerPluginSettingsSection(section, pluginName)
  },
  
  settingsPages: (pluginName: string) => {
    return (page: SettingsPage) => registerPluginSettingsPage(page, pluginName)
  },
  
  dashboardWidgets: (pluginName: string) => {
    return (widget: DashboardWidget) => registerPluginDashboardWidget(widget, pluginName)
  },
  
  navItems: (pluginName: string) => {
    return (item: NavItem) => registerPluginNavItem(item, pluginName)
  },

  settingsLinks: (pluginName: string) => {
    return (link: SettingsLink) => registerPluginSettingsLink(link, pluginName)
  },
}