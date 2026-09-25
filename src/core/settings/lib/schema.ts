import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import { getAllSettingsSections as getPluginSections, getAllSettingsPages as getPluginPages } from '@/core/plugins/HookRegistry'

/**
 * Settings schema — seed of the core #41 `settings-schema` extension point.
 *
 * Modules AND plugins register their own settings sections/pages via the API below; the
 * Settings dashboard renders whatever is registered. This keeps core
 * decoupled from module/plugin-specific settings while giving them a typed,
 * deep-linkable surface (`/settings/<sectionId>` and `/settings/<sectionId>/<pageId>`).
 */

/** Dashboard group a settings section renders under. */
export type SettingsSectionGroup = 'general' | 'modules'

export interface SettingsSection {
  /** Stable id used in the URL: `/settings/<id>` */
  id: string
  title: string
  description?: string
  /** Rendered when the section is selected (no page param). */
  component: ComponentType
  /** Lower sorts first. */
  order?: number
  /**
   * Dashboard group this section is listed under. Core platform settings
   * (church info, email, integrations) declare `'general'`; module- and
   * plugin-registered sections default to `'modules'`.
   */
  group?: SettingsSectionGroup
  /**
   * Icon shown in the iOS-style settings list / side nav.
   * Modules should pass their own manifest icon (e.g. `peopleManifest.icon`)
   * so the settings card matches the module. Sections without an explicit
   * icon fall back to a generic icon in the dashboard.
   */
  icon?: LucideIcon
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
  const existing = coreSections.find((s) => s.id === section.id)
  if (existing) {
    // Idempotent re-registration: module-load side effects re-run on Vite HMR,
    // so a duplicate id must replace in place (last wins) instead of throwing.
    // New modules still register fresh sections via the push path below.
    Object.assign(existing, section)
  } else {
    coreSections.push(section)
  }
  coreSections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function registerSettingsPage(page: SettingsPage) {
  const existing = corePages.find(
    (p) => p.sectionId === page.sectionId && p.id === page.id,
  )
  if (existing) {
    // Idempotent re-registration (see registerSettingsSection).
    Object.assign(existing, page)
  } else {
    corePages.push(page)
  }
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

/** Ordered dashboard groups — General Settings first, then Modules. */
const SECTION_GROUPS: Array<{ group: SettingsSectionGroup; label: string }> = [
  { group: 'general', label: 'General Settings' },
  { group: 'modules', label: 'Modules' },
]

/**
 * Get settings sections grouped for the iOS-style dashboard list.
 * Sections without an explicit `group` land in `'modules'`; empty groups
 * are omitted so a group header never renders without content.
 */
export function getSettingsSectionGroups(): Array<{
  group: SettingsSectionGroup
  label: string
  sections: SettingsSection[]
}> {
  const sections = getSettingsSections()
  return SECTION_GROUPS.map(({ group, label }) => ({
    group,
    label,
    sections: sections.filter((s) => (s.group ?? 'modules') === group),
  })).filter((grouped) => grouped.sections.length > 0)
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
