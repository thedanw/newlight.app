import { useState } from 'react'
import { Stack, HStack } from 'styled-system/jsx'
import { Heading, Text, Tabs, TabScroller } from '@/core/ui'
import { History, AlertTriangle } from 'lucide-react'
import { SyncHistoryTable } from './components/SyncHistoryTable'
import { DeadLetterTable } from './components/DeadLetterTable'

/**
 * Activity Tab — merged monitoring view replacing the former top-level
 * "History" and "Dead Letter" tabs. Sync run reports are grouped into
 * per-batch accordions under the first sub-tab; the dead letter queue
 * triage workflow lives under the second.
 */
export function ActivityTab() {
  const [subTab, setSubTab] = useState('sync-history')

  return (
    <Stack>
      <Heading textStyle="md">Activity</Heading>
      <Text color="fg.muted" textStyle="sm">
        Monitor synchronization batches and triage failed items that exhausted retries.
      </Text>

      <Tabs.Root value={subTab} onValueChange={(details) => setSubTab(details.value)}>
        <TabScroller>
          <Tabs.List css={{ gap: '0' }}>
            <Tabs.Trigger value="sync-history" css={{ py: '2', px: '4' }}>
              <HStack gap="2">
                <History size={16} />
                <Text textStyle="sm">Sync History</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="dead-letter" css={{ py: '2', px: '4' }}>
              <HStack gap="2">
                <AlertTriangle size={16} />
                <Text textStyle="sm">Failed & Pending</Text>
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>
        </TabScroller>

        <Tabs.Content value="sync-history">
          <SyncHistoryTable />
        </Tabs.Content>
        <Tabs.Content value="dead-letter">
          <DeadLetterTable />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  )
}
