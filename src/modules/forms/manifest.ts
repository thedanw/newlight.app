import type { LucideIcon } from 'lucide-react'
import { ClipboardList } from 'lucide-react'

export const Manifest = {
  id: 'forms',
  name: 'Forms',
  icon: ClipboardList as LucideIcon,
  /** Module number — drives the page header hero hue shift (16deg × number) and sidebar order. */
  number: 2,
  alwaysOn: true,
  basePath: '/forms',
} as const

export type Manifest = typeof Manifest