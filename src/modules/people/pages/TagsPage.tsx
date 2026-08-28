import { Heading, PageHeader } from '@/core/ui'
import { TagManager } from '../components/TagManager'

export default function TagsPage() {
  return <><PageHeader><Heading>Tags</Heading></PageHeader><main><TagManager /></main></>
}