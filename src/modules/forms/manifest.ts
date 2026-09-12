import type { LucideIcon } from 'lucide-react'
import { ClipboardList } from 'lucide-react'

export const formsManifest = {
  id: 'forms',
  name: 'Forms',
  icon: ClipboardList as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number). */
  number: 2,
  alwaysOn: true,
  basePath: '/forms',
  nav: {
    label: 'Forms',
    route: '/forms',
  },
} as const

export type FormsManifest = typeof formsManifest
