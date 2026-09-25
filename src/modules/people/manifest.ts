import type { LucideIcon } from 'lucide-react'
import { Users } from 'lucide-react'

export const Manifest = {
  id: 'people',
  name: 'People',
  icon: Users as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number) and sidebar order. */
  number: 1,
  alwaysOn: true,
  basePath: '/people',
} as const

export type Manifest = typeof Manifest