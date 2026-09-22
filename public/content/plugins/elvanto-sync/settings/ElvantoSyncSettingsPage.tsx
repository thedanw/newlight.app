import { useState, lazy, Suspense, type ComponentType } from 'react'
import { Page, Heading, Text, Tabs, TabScroller } from '@/core/ui'
import { Stack, Box } from 'styled-system/jsx'
import { Settings, AlertTriangle, Calendar, Clock, Columns3, MapPin, Plug } from 'lucide-react'

const ConnectionTab = lazy(() => import('./ConnectionTab').then(m => ({ default: m.ConnectionTab })))
const FieldMappingTab = lazy(() => import('./FieldMappingTab').then(m => ({ default: m.FieldMappingTab })))
const LocationTrackTab = lazy(() => import('./LocationTrackTab').then(m => ({ default: m.LocationTrackTab })))
const ScheduleTab = lazy(() => import('./ScheduleTab').then(m => ({ default: m.ScheduleTab })))
const HistoryTab = lazy(() => import('./HistoryTab').then(m => ({ default: m.HistoryTab })))
const DeadLetterTab = lazy(() => import('./DeadLetterTab').then(m => ({ default: m.DeadLetterTab })))

interface TabConfig {
  id: string
  label: string
  icon: ComponentType<{ size?: number | string }>
  component: ComponentType
}

const TABS: TabConfig[] = [
  { id: 'connection', label: 'Connection', icon: Plug, component: ConnectionTab },
  { id: 'field-mappings', label: 'Field Mappings', icon: Columns3, component: FieldMappingTab },
  { id: 'location-tracks', label: 'Locations', icon: MapPin, component: LocationTrackTab },
  { id: 'schedule', label: 'Schedule', icon: Calendar, component: ScheduleTab },
  { id: 'history', label: 'History', icon: Clock, component: HistoryTab },
  { id: 'dead-letter', label: 'Dead Letter', icon: AlertTriangle, component: DeadLetterTab },
]

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
        <TabScroller>
          <Tabs.List css={{ gap: '0' }}>
            {TABS.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                css={{
                  flexShrink: 0,
                  py: { base: '2', md: '2.5' },
                  px: { base: '3', md: '4' },
                  justifyContent: 'center',
                }}
              >
                <Stack alignItems="center" gap={{ base: '1', md: '2' }}>
                  <Box display={{ base: 'block', md: 'none' }}>
                    <tab.icon size={24} />
                  </Box>
                  <Box display={{ base: 'none', md: 'block' }}>
                    <tab.icon size={16} />
                  </Box>
                  <Text fontSize ={{ base: '2xs', md: 'sm' }}>{tab.label}</Text>
                </Stack>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </TabScroller>

        {TABS.map((tab) => (
          <Tabs.Content key={tab.id} value={tab.id}>
            <Suspense fallback={<Stack><Text>Loading {tab.label}...</Text></Stack>}>
              <tab.component />
            </Suspense>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      </Page.Body>
    </Page.Main>
  )
}