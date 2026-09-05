import { Stack } from 'styled-system/jsx'
import { Heading, Text } from '@/core/ui'
import { DeadLetterTable } from './components/DeadLetterTable'

/**
 * Dead Letter Queue Tab — Full implementation with dead letter table
 */
export function DeadLetterTab() {
  return (
    <Stack gap="6">
      <Heading textStyle="md">Dead Letter Queue</Heading>
      <Text color="fg.muted" textStyle="sm">
        Failed sync items that exceeded retry attempts. Review, retry, or resolve.
      </Text>

      <DeadLetterTable />
    </Stack>
  )
}