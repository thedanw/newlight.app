import type { LucideIcon } from 'lucide-react'
import { Users } from 'lucide-react'

export const peopleManifest = {
  id: 'people',
  name: 'People',
  icon: Users as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number). */
  number: 1,
  alwaysOn: true,
  basePath: '/people',
  nav: {
    label: 'People',
    route: '/people',
  },
} as const

export type PeopleManifest = typeof peopleManifest
