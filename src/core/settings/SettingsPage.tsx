'use client'
import { PagePanel, PageHeader, Text, Heading } from '@/core/ui'

/**
 * SettingsPage — temporary stub for Batch 1.
 * Full dashboard shell (section/page registry) lands in Batch 2.
 */
export default function SettingsPage() {
  return (
    <PagePanel>
      <PageHeader>
        <Heading textStyle="md">Settings</Heading>
      </PageHeader>
      <div style={{ padding: '1.5rem' }}>
        <Text color="fg.muted" textStyle="sm">
          Settings dashboard placeholder — coming in Batch 2.
        </Text>
      </div>
    </PagePanel>
  )
}