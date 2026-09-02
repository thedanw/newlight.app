import { Heading, Page } from '@/core/ui'
import { TagManager } from '../components/TagManager'

export default function TagsPage() {
  return <><Page.Header><Heading>Tags</Heading></Page.Header><Page.Body><TagManager /></Page.Body></>
}