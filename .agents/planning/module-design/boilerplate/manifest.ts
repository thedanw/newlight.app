import type { LucideIcon } from 'lucide-react'
import { <Icon> } from 'lucide-react'

export const <module>Manifest = {
  id: '<moduleId>',
  name: '<Module>',
  icon: <Icon> as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number). */
  number: 2,
  alwaysOn: true,
  basePath: '/<moduleId>',
  nav: {
    label: '<Module>',
    route: '/<moduleId>',
  },
} as const

export type <Module>Manifest = typeof <module>Manifest
