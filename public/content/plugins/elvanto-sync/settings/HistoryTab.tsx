import { Stack } from 'styled-system/jsx'
import { Heading, Text } from '@/core/ui'
import { SyncHistoryTable } from './components/SyncHistoryTable'

/**
 * History Tab — Full implementation with sync history table
 */
export function HistoryTab() {
  return (
    <Stack>
      <Heading textStyle="md">Sync History</Heading>
      <Text color="fg.muted" textStyle="sm">
        View synchronization run history, status, and item counts.
      </Text>

      <SyncHistoryTable />
    </Stack>
  )
}