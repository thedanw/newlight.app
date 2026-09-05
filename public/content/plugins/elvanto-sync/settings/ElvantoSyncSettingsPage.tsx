import { useState, lazy, Suspense, type ComponentType } from 'react'
import { Page, Heading, Text, Tabs } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Settings } from 'lucide-react'

// Lazy-load tab components to avoid bundle bloat
const ConnectionTab = lazy(() => import('./ConnectionTab').then(m => ({ default: m.ConnectionTab })))
const FieldMappingTab = lazy(() => import('./FieldMappingTab').then(m => ({ default: m.FieldMappingTab })))
const LocationTrackTab = lazy(() => import('./LocationTrackTab').then(m => ({ default: m.LocationTrackTab })))
const ScheduleTab = lazy(() => import('./ScheduleTab').then(m => ({ default: m.ScheduleTab })))
const HistoryTab = lazy(() => import('./HistoryTab').then(m => ({ default: m.HistoryTab })))
const DeadLetterTab = lazy(() => import('./DeadLetterTab').then(m => ({ default: m.DeadLetterTab })))

interface TabConfig {
  id: string
  label: string
  component: ComponentType
}

const TABS: TabConfig[] = [
  { id: 'connection', label: 'Connection', component: ConnectionTab },
  { id: 'field-mappings', label: 'Field Mappings', component: FieldMappingTab },
  { id: 'location-tracks', label: 'Location ↔ Tracks', component: LocationTrackTab },
  { id: 'schedule', label: 'Schedule', component: ScheduleTab },
  { id: 'history', label: 'History', component: HistoryTab },
  { id: 'dead-letter', label: 'Dead Letter Queue', component: DeadLetterTab },
]

/**
 * Elvanto Sync Settings Page — Main tab container for all sync settings
 * Deep-links: /settings/integrations/elvanto-sync?tab=<tabId>
 */
export function ElvantoSyncSettingsPage() {
  const [activeTab, setActiveTab] = useState('connection')

  return (
    <Page.Main>
      <Page.Header><Page.Heading level={1} icon={Settings} title="Elvanto Sync" /></Page.Header>
      <Page.Body>
      <Heading textStyle="lg">Elvanto Sync</Heading>
      <Text color="fg.muted" textStyle="sm">
        Configure and monitor synchronization with Elvanto ChMS.
      </Text>

      <Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
        <Tabs.List>
          {TABS.map((tab) => (
            <Tabs.Trigger key={tab.id} value={tab.id}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {TABS.map((tab) => (
          <Tabs.Content key={tab.id} value={tab.id}>
            <Suspense fallback={<Stack gap="4"><Text>Loading {tab.label}...</Text></Stack>}>
              <tab.component />
            </Suspense>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      </Page.Body>
    </Page.Main>
  )
}
