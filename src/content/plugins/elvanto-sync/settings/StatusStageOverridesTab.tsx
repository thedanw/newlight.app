import { Stack } from 'styled-system/jsx'
import { Heading, Text } from '@/core/ui'
import { StatusStageOverrides } from './components/StatusStageOverrides'

/**
 * Status Stage Overrides Tab
 */
export function StatusStageOverridesTab() {
  return (
    <Stack>
      <Heading textStyle="md">Status Stage Overrides</Heading>
      <Text color="fg.muted" textStyle="sm">
        Configure how Elvanto status flags (contact, archived, deceased) override journey stages 
        across ALL tracks. These are universal overrides applied after track assignment.
      </Text>

      <StatusStageOverrides />
    </Stack>
  )
}