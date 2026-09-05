import type { LucideIcon } from 'lucide-react'
import { Settings } from 'lucide-react'

export const settingsManifest = {
  id: 'settings',
  name: 'Settings',
  icon: Settings as LucideIcon,
  /** Settings page — base module number so hero headers can reference it. */
  number: 0,
  alwaysOn: true,
  basePath: '/settings',
  nav: {
    label: 'Settings',
    route: '/settings',
  },
} as const

export type SettingsManifest = typeof settingsManifest
