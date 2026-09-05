import { Badge } from '@/core/ui'
import type { Tag } from '../lib/types'

export function TagBadge({ tag }: { tag: Tag }) {
  return <Badge colorPalette="gray">{tag.name}</Badge>
}