import type { LucideIcon } from 'lucide-react'
import { Palette } from 'lucide-react'

export const exampleManifest = {
  id: 'example',
  name: 'Example',
  icon: Palette as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number). */
  number: 3,
  alwaysOn: true,
  basePath: '/example',
  nav: {
    label: 'Example',
    route: '/example',
  },
} as const

export type ExampleManifest = typeof exampleManifest
