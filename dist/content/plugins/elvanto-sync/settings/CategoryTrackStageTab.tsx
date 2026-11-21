import { Stack } from 'styled-system/jsx'
import { Heading, Text } from '@/core/ui'
import { CategoryTrackStageMapping } from './components/CategoryTrackStageMapping'

/**
 * Category/Demographic → Track + Stage Mapping Tab
 */
export function CategoryTrackStageTab() {
  return (
    <Stack>
      <Heading textStyle="md">Category & Demographic → Track + Stage</Heading>
      <Text color="fg.muted" textStyle="sm">
        Map Elvanto People Categories and Demographics to specific Journey Tracks with specific Stages.
        This allows Categories like "Sunday Linked" to map to Track "10am Sundays" + Stage "linked".
      </Text>

      <CategoryTrackStageMapping />
    </Stack>
  )
}