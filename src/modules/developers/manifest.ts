import type { LucideIcon } from 'lucide-react'
import { PencilRuler } from 'lucide-react'

export const Manifest = {
  id: 'developers',
  name: 'Developers',
  icon: PencilRuler as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number) and sidebar order. */
  number: 3,
  alwaysOn: true,
  basePath: '/developers',
} as const

export type Manifest = typeof Manifest