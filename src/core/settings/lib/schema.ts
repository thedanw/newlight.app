import type { ComponentType } from 'react'
import { getAllSettingsSections as getPluginSections, getAllSettingsPages as getPluginPages } from '@/core/plugins/HookRegistry'

/**
 * Settings schema — seed of the core #41 `settings-schema` extension point.
 *
 * Modules AND plugins register their own settings sections/pages via the API below; the
 * Settings dashboard renders whatever is registered. This keeps core
 * decoupled from module/plugin-specific settings while giving them a typed,
 * deep-linkable surface (`/settings/<sectionId>` and `/settings/<sectionId>/<pageId>`).
 */

export interface SettingsSection {
  /** Stable id used in the URL: `/settings/<id>` */
  id: string
  title: string
  description?: string
  /** Rendered when the section is selected (no page param). */
  component: ComponentType
  /** Lower sorts first. */
  order?: number
}

export interface SettingsPage {
  /** Owning section id. */
  sectionId: string
  /** Stable id used in the URL: `/settings/<sectionId>/<id>` */
  id: string
  title: string
  component: ComponentType
  /** Lower sorts first. */
  order?: number
}

const coreSections: SettingsSection[] = []
const corePages: SettingsPage[] = []

export function registerSettingsSection(section: SettingsSection) {
  if (coreSections.some((s) => s.id === section.id)) {
    throw new Error(`Settings section "${section.id}" is already registered.`)
  }
  coreSections.push(section)
  coreSections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function registerSettingsPage(page: SettingsPage) {
  if (corePages.some((p) => p.sectionId === page.sectionId && p.id === page.id)) {
    throw new Error(`Settings page "${page.sectionId}/${page.id}" is already registered.`)
  }
  corePages.push(page)
  corePages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/**
 * Get all settings sections (core + plugins)
 */
export function getSettingsSections(): SettingsSection[] {
  const pluginSections = getPluginSections()
  // Merge core and plugin sections, plugins can override core if same id (last wins)
  const allSections = [...coreSections, ...pluginSections]
  const seen = new Set<string>()
  return allSections.filter((s) => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/**
 * Get all settings pages for a section (core + plugins)
 */
export function getSettingsPages(sectionId: string): SettingsPage[] {
  const core = corePages.filter((p) => p.sectionId === sectionId)
  const plugin = getPluginPages(sectionId)
  // Merge core and plugin pages, plugins can override core if same id (last wins)
  const allPages = [...core, ...plugin]
  const seen = new Set<string>()
  return allPages.filter((p) => {
    const key = `${p.sectionId}/${p.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function getSettingsSection(sectionId: string): SettingsSection | undefined {
  // Check core first, then plugins
  return coreSections.find((s) => s.id === sectionId) ?? getPluginSections().find((s) => s.id === sectionId)
}

export function getSettingsPage(sectionId: string, pageId: string): SettingsPage | undefined {
  // Check core first, then plugins
  return corePages.find((p) => p.sectionId === sectionId && p.id === pageId) ?? 
         getPluginPages(sectionId).find((p) => p.id === pageId)
}
