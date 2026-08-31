import { Heading, Text, Card, Alert, Button, Input } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState } from 'react'
import { Stack } from 'styled-system/jsx'

/**
 * Schedule Tab — Skeleton (full implementation in Phase 10)
 */
export function ScheduleTab() {
  const { settings, toast } = usePluginAPIContext()
  const [cronExpression, setCronExpression] = useState('0 2 * * *')
  const [syncDirection, setSyncDirection] = useState<'pull_only' | 'bidirectional'>('pull_only')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await settings.setConfig('cron_expression', cronExpression)
      await settings.setConfig('sync_direction', syncDirection)
      toast.success('Schedule saved')
    } catch (err) {
      console.error('[ScheduleTab] Failed to save:', err)
      toast.error('Failed to save schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNow = async () => {
    setLoading(true)
    try {
      const response = await fetch('/functions/v1/elvanto-sync-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual' }),
      })
      
      if (response.ok) {
        toast.success('Sync triggered successfully')
      } else {
        toast.error('Failed to trigger sync')
      }
    } catch (err) {
      console.error('[ScheduleTab] Sync trigger error:', err)
      toast.error('Failed to trigger sync')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="6">
      <Heading textStyle="md">Schedule</Heading>
      <Text color="fg.muted" textStyle="sm">
        Configure automatic synchronization schedule and trigger manual syncs.
      </Text>

      <Card.Root>
        <Card.Header>
          <Card.Title>Automatic Sync Schedule</Card.Title>
          <Card.Description>Cron expression for scheduled sync runs (UTC timezone)</Card.Description>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            <Stack gap="2">
              <Text textStyle="sm" fontWeight="medium">Cron Expression</Text>
              <Input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 2 * * *"
                disabled={loading}
              />
              <Text color="fg.muted" textStyle="sm">
                Default: "0 2 * * *" (daily at 02:00 UTC). Uses standard cron format.
              </Text>
            </Stack>

            <Stack gap="2">
              <Text textStyle="sm" fontWeight="medium">Sync Direction</Text>
              <select
                value={syncDirection}
                onChange={(e) => setSyncDirection(e.target.value as 'pull_only' | 'bidirectional')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-default)',
                  color: 'var(--fg-default)'
                }}
              >
                <option value="pull_only">Pull Only (Elvanto → Supabase)</option>
                <option value="bidirectional">Bidirectional (Pull + Push)</option>
              </select>
              <Text color="fg.muted" textStyle="sm">
                MVP: Pull only. Bidirectional requires explicit admin action for pushes.
              </Text>
            </Stack>

            <Stack flexDirection="row" gap="3">
              <Button onClick={handleSave} loading={loading} disabled={loading}>
                Save Schedule
              </Button>
              <Button variant="outline" onClick={handleSyncNow} loading={loading} disabled={loading}>
                Sync Now
              </Button>
            </Stack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Cron Expression Reference</Card.Title>
        </Card.Header>
        <Card.Body>
          <Stack gap="1" textStyle="sm">
            <Text><strong>Format:</strong> minute hour day month weekday</Text>
            <Text><strong>Examples:</strong></Text>
            <Text color="fg.muted">0 2 * * * — Daily at 02:00 UTC</Text>
            <Text color="fg.muted">0 2 * * 0 — Weekly on Sunday at 02:00 UTC</Text>
            <Text color="fg.muted">0 2 1 * * — Monthly on 1st at 02:00 UTC</Text>
            <Text color="fg.muted">0 2 * * 1-5 — Weekdays at 02:00 UTC</Text>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Alert.Root variant="subtle">
        <Alert.Title>MVP: Pull Only</Alert.Title>
        <Alert.Description>
          Write-back (Supabase → Elvanto) is disabled by default. Enable "Bidirectional" only after
          careful review. All pushes require explicit admin action in the UI.
        </Alert.Description>
      </Alert.Root>
    </Stack>
  )
}
