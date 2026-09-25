import type { LucideIcon } from 'lucide-react'
import { <Icon> } from 'lucide-react'

export const Manifest = {
  id: '<moduleId>',
  name: '<Module>',
  icon: <Icon> as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number) and sidebar order. */
  number: 2,
  alwaysOn: true,
  basePath: '/<moduleId>',
} as const

export type Manifest = typeof Manifest