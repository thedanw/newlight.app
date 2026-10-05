import { Heading, Text, Card, Alert, Button, Select } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect, useMemo } from 'react'
import { Box, HStack, Stack } from 'styled-system/jsx'
import { createListCollection } from '@ark-ui/react'
import { ChevronsUpDownIcon, CheckIcon } from 'lucide-react'

interface StatusStageOverrides {
  contact?: string
  archived?: string
  deceased?: string
}

const STAGE_OPTIONS = [
  { label: 'Contact', value: 'contact' },
  { label: 'Guest', value: 'guest' },
  { label: 'Linked', value: 'linked' },
  { label: 'Regular', value: 'regular' },
  { label: 'Archived', value: 'archived' },
  { label: 'Deleted (Privacy Data)', value: 'deleted_privacy_data' },
]

const DEFAULT_OVERRIDES: StatusStageOverrides = {
  contact: 'contact',
  archived: 'archived',
  deceased: 'deleted_privacy_data',
}

export function StatusStageOverrides() {
  const { settings, toast } = usePluginAPIContext()
  const [overrides, setOverrides] = useState<StatusStageOverrides>(DEFAULT_OVERRIDES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOverrides()
  }, [])

  const loadOverrides = async () => {
    setLoading(true)
    try {
      const saved = await settings.getConfig<StatusStageOverrides>('status_stage_overrides')
      if (saved) {
        setOverrides({ ...DEFAULT_OVERRIDES, ...saved })
      }
    } catch (err) {
      console.error('[StatusStageOverrides] Failed to load:', err)
      toast.error('Failed to load status stage overrides')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settings.setConfig('status_stage_overrides', overrides)
      toast.success('Status stage overrides saved')
    } catch (err) {
      console.error('[StatusStageOverrides] Failed to save:', err)
      toast.error('Failed to save overrides')
    } finally {
      setSaving(false)
    }
  }

  const updateOverride = (key: keyof StatusStageOverrides, value: string) => {
    setOverrides(prev => ({ ...prev, [key]: value }))
  }

  const stageCollection = useMemo(() => createListCollection({
    items: STAGE_OPTIONS.map(o => ({ label: o.label, value: o.value }))
  }), [])

  if (loading) {
    return (
      <Stack align="center">
        <Text>Loading status stage overrides...</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <HStack justifyContent="space-between" alignItems="center">
        <Heading textStyle="md">Status Stage Overrides</Heading>
        <Button onClick={handleSave} loading={saving} disabled={saving}>
          Save Overrides
        </Button>
      </HStack>

      <Alert.Root>
        <Alert.Title>Universal Status Stage Overrides</Alert.Title>
        <Text textStyle="sm" color="fg.muted">
          These overrides apply to <strong>ALL journey tracks</strong> for a person when the corresponding 
          Elvanto status flag is set. Priority order: Deceased &gt; Archived &gt; Contact.
        </Text>
      </Alert.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Override Configuration</Card.Title>
          <Card.Description>Select the stage to apply when each status flag is true</Card.Description>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            <Stack gap="2">
              <Text textStyle="sm" fontWeight="medium">Contact = 1</Text>
              <Text textStyle="xs" color="fg.muted">Person is a contact (not just in database)</Text>
              <Select.Root collection={stageCollection} value={overrides.contact ? [overrides.contact] : []} onValueChange={(details) => updateOverride('contact', details.value[0] || 'contact')}>
                <Select.Control>
                  <Select.Trigger minWidth="250px">
                    <Select.ValueText placeholder="Select stage..." />
                    <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                  </Select.Trigger>
                  <Select.Positioner>
                    <Select.Content>
                      {stageCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Control>
              </Select.Root>
            </Stack>

            <Stack gap="2">
              <Text textStyle="sm" fontWeight="medium">Archived = 1</Text>
              <Text textStyle="xs" color="fg.muted">Person is archived in Elvanto</Text>
              <Select.Root collection={stageCollection} value={overrides.archived ? [overrides.archived] : []} onValueChange={(details) => updateOverride('archived', details.value[0] || 'archived')}>
                <Select.Control>
                  <Select.Trigger minWidth="250px">
                    <Select.ValueText placeholder="Select stage..." />
                    <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                  </Select.Trigger>
                  <Select.Positioner>
                    <Select.Content>
                      {stageCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Control>
              </Select.Root>
            </Stack>

            <Stack gap="2">
              <Text textStyle="sm" fontWeight="medium">Deceased = 1</Text>
              <Text textStyle="xs" color="fg.muted">Person is marked deceased in Elvanto (highest priority)</Text>
              <Select.Root collection={stageCollection} value={overrides.deceased ? [overrides.deceased] : []} onValueChange={(details) => updateOverride('deceased', details.value[0] || 'deleted_privacy_data')}>
                <Select.Control>
                  <Select.Trigger minWidth="250px">
                    <Select.ValueText placeholder="Select stage..." />
                    <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                  </Select.Trigger>
                  <Select.Positioner>
                    <Select.Content>
                      {stageCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Control>
              </Select.Root>
            </Stack>
          </Stack>
        </Card.Body>
        <Card.Footer>
          <HStack justify="end">
            <Button variant="outline" onClick={() => setOverrides(DEFAULT_OVERRIDES)}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              Save Overrides
            </Button>
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Stack>
  )
}























































































