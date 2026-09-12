import type { CSSProperties } from 'react'
import { Page } from '@/core/ui'
import { Users } from 'lucide-react'
import { TagManager } from '../components/TagManager'

export default function TagsPage() {
  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Tags" />
      </Page.Header>
      <Page.Body><TagManager /></Page.Body>
    </Page.Main>
  )
}
