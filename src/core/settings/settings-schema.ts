import type { ComponentType } from 'react'
import ChurchInformationSection from './sections/ChurchInformationSection'

/**
 * Settings schema — seed of the core #41 `settings-schema` extension point.
 *
 * Modules register their own settings sections/pages via the API below; the
 * Settings dashboard renders whatever is registered. This keeps core
 * decoupled from module-specific settings while giving modules a typed,
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

const sections: SettingsSection[] = []
const pages: SettingsPage[] = []

export function registerSettingsSection(section: SettingsSection) {
  if (sections.some((s) => s.id === section.id)) {
    throw new Error(`Settings section "${section.id}" is already registered.`)
  }
  sections.push(section)
  sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function registerSettingsPage(page: SettingsPage) {
  if (pages.some((p) => p.sectionId === page.sectionId && p.id === page.id)) {
    throw new Error(`Settings page "${page.sectionId}/${page.id}" is already registered.`)
  }
  pages.push(page)
  pages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function getSettingsSections(): SettingsSection[] {
  return sections
}

export function getSettingsPages(sectionId: string): SettingsPage[] {
  return pages.filter((p) => p.sectionId === sectionId)
}

export function getSettingsSection(sectionId: string): SettingsSection | undefined {
  return sections.find((s) => s.id === sectionId)
}

export function getSettingsPage(sectionId: string, pageId: string): SettingsPage | undefined {
  return pages.find((p) => p.sectionId === sectionId && p.id === pageId)
}

// Core sections — registered at module load.
registerSettingsSection({
  id: 'church-info',
  title: 'Church Information',
  description: 'Church name, app name, contact details, and brand/theme settings.',
  component: ChurchInformationSection,
  order: 0,
})