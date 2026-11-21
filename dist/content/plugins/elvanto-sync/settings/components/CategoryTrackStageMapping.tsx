import { Heading, Text, Card, Alert, Button, Table, Select, Input } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect, useMemo } from 'react'
import { Box, HStack, Stack } from 'styled-system/jsx'
import { createListCollection } from '@ark-ui/react'
import { ChevronsUpDownIcon, CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { fetchElvantoCategories, fetchElvantoDemographics } from '../../sync/elvanto-api'

interface CategoryTrackStageMapping {
  source_type: 'category' | 'demographic'
  source_value: string
  source_label: string
  journey_track_id: string
  journey_track_name: string
  stage: string
  priority: number
}

interface JourneyTrack {
  id: string
  name: string
  elvanto_location_id: string | null
}

const STAGE_OPTIONS = [
  { label: 'Contact', value: 'contact' },
  { label: 'Guest', value: 'guest' },
  { label: 'Linked', value: 'linked' },
  { label: 'Regular', value: 'regular' },
  { label: 'Archived', value: 'archived' },
  { label: 'Deleted (Privacy Data)', value: 'deleted_privacy_data' },
]

const SOURCE_TYPE_OPTIONS = [
  { label: 'People Category', value: 'category' },
  { label: 'Demographic', value: 'demographic' },
]

export function CategoryTrackStageMapping() {
  const { settings, toast, supabase } = usePluginAPIContext()
  const [mappings, setMappings] = useState<CategoryTrackStageMapping[]>([])
  const [journeyTracks, setJourneyTracks] = useState<JourneyTrack[]>([])
  const [elvantoCategories, setElvantoCategories] = useState<Array<{ id: string; name: string }>>([])
  const [elvantoDemographics, setElvantoDemographics] = useState<Array<{ name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const savedMappings = await settings.getConfig<CategoryTrackStageMapping[]>('category_demographic_track_stage_mappings')
      if (savedMappings) {
        setMappings(savedMappings)
      }

      const { data: tracks } = await supabase
        .from('journey_tracks')
        .select('id, name, elvanto_location_id')
        .is('deleted_at', null)
      
      if (tracks) {
        setJourneyTracks(tracks)
      }

      // Load discovered categories and demographics from field catalog
      const catalog = await settings.getConfig<any>('elvanto_field_catalog')
      if (catalog) {
        if (catalog.categories) {
          setElvantoCategories(catalog.categories.map((c: any) => ({ id: c.id, name: c.name })))
        }
        if (catalog.demographics) {
          setElvantoDemographics(catalog.demographics.map((d: any) => ({ id: d, name: d })))
        }
      }
    } catch (err) {
      console.error('[CategoryTrackStageMapping] Failed to load data:', err)
      toast.error('Failed to load category/demographic mappings')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchFields = async () => {
    setFetching(true)
    try {
      const creds = await settings.getCredentials()
      if (!creds?.apiKey) {
        toast.error('No Elvanto API key configured. Go to Connection tab first.')
        return
      }

      let apiKey = creds.apiKey
      try {
        apiKey = await (await import('../../utils/encryption')).decrypt(apiKey)
      } catch {
        // Fallback: legacy/plaintext credentials
      }

      // Fetch categories and demographics directly via API helpers
      const [categories, demographics] = await Promise.all([
        fetchElvantoCategories(apiKey),
        fetchElvantoDemographics(apiKey),
      ])
      
      // Update catalog
      await settings.setConfig('elvanto_field_catalog', {
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        demographics: demographics.map(d => ({ name: d.name })),
      })
      
      setElvantoCategories(categories)
      setElvantoDemographics(demographics)
      
      toast.success(`Fetched ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} and ${demographics.length} demographic${demographics.length === 1 ? '' : 's'} from Elvanto`)
    } catch (err) {
      console.error('[CategoryTrackStageMapping] Failed to fetch fields:', err)
      toast.error('Failed to fetch fields from Elvanto')
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settings.setConfig('category_demographic_track_stage_mappings', mappings)
      toast.success('Category/Demographic track-stage mappings saved')
    } catch (err) {
      console.error('[CategoryTrackStageMapping] Failed to save:', err)
      toast.error('Failed to save mappings')
    } finally {
      setSaving(false)
    }
  }

  const updateMapping = (index: number, updates: Partial<CategoryTrackStageMapping>) => {
    setMappings(mappings.map((m, i) => i === index ? { ...m, ...updates } : m))
  }

  const addMapping = () => {
    setMappings([...mappings, {
      source_type: 'category',
      source_value: '',
      source_label: '',
      journey_track_id: '',
      journey_track_name: '',
      stage: 'contact',
      priority: 100,
    }])
  }

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index))
  }

  const getTrackName = (trackId: string) => {
    return journeyTracks.find(t => t.id === trackId)?.name || 'Unknown Track'
  }

  const sourceTypeCollection = useMemo(() => createListCollection({
    items: SOURCE_TYPE_OPTIONS.map(o => ({ label: o.label, value: o.value }))
  }), [])

  const stageCollection = useMemo(() => createListCollection({
    items: STAGE_OPTIONS.map(o => ({ label: o.label, value: o.value }))
  }), [])

  const journeyTrackCollection = useMemo(() => createListCollection({
    items: [{ label: 'Select journey track...', value: '' }, ...journeyTracks.map(track => ({ 
      label: `${track.name} ${track.elvanto_location_id ? `(${track.elvanto_location_id.slice(0,8)}...)` : ''}`, 
      value: track.id 
    }))]
  }), [journeyTracks])

  const getSourceCollection = (sourceType: 'category' | 'demographic') => {
    const items = sourceType === 'category' ? elvantoCategories : elvantoDemographics
    return useMemo(() => createListCollection({
      items: [{ label: `Select Elvanto ${sourceType}...`, value: '' }, ...items.map(item => ({ 
        label: item.name, 
        value: 'id' in item ? item.id : item.name 
      }))] as Array<{ label: string; value: string }>
    }), [items])
  }

  if (loading) {
    return (
      <Stack align="center">
        <Text>Loading category/demographic mappings...</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <HStack justifyContent="space-between" alignItems="center">
        <Heading textStyle="md">Category & Demographic → Track + Stage</Heading>
        <HStack gap="2">
          <Button variant="outline" size="sm" onClick={handleFetchFields} loading={fetching} disabled={fetching}>
            <PlusIcon size={14} /> Fetch Categories & Demographics
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={saving}>
            Save Mappings
          </Button>
        </HStack>
      </HStack>

      <Alert.Root>
        <Alert.Title>Category/Demographic → Journey Track + Stage</Alert.Title>
        <Text textStyle="sm" color="fg.muted">
          Map Elvanto People Categories (e.g., "Sunday Linked") or Demographics (e.g., "Adults") 
          to specific Journey Tracks with specific Stages. This enables multi-track journey assignment 
          beyond the single "Sunday Services" track.
        </Text>
      </Alert.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Mappings</Card.Title>
          <Card.Description>Each row maps one Category or Demographic to one Track + Stage</Card.Description>
        </Card.Header>
        <Card.Body>
          {mappings.length === 0 ? (
            <Stack align="center" p="6">
              <Text color="fg.muted">No mappings configured</Text>
              <HStack gap="2">
                <Button variant="outline" onClick={handleFetchFields}>Fetch Fields First</Button>
                <Button onClick={addMapping}>Add Manual Mapping</Button>
              </HStack>
            </Stack>
          ) : (
            <Box overflowX="auto" minW="0">
            <Table.Root>
              <Table.Head>
                <Table.Row>
                  <Table.Header width="160px">Source Type</Table.Header>
                  <Table.Header width="200px">Elvanto Value</Table.Header>
                  <Table.Header width="200px">Journey Track</Table.Header>
                  <Table.Header width="160px">Stage</Table.Header>
                  <Table.Header width="100px">Priority</Table.Header>
                  <Table.Header width="80px">Actions</Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {mappings.map((mapping, index) => {
                  const sourceCollection = getSourceCollection(mapping.source_type)
                  return (
                    <Table.Row key={index}>
                      <Table.Cell>
                        <Select.Root collection={sourceTypeCollection} value={mapping.source_type ? [mapping.source_type] : []} onValueChange={(details) => updateMapping(index, { source_type: details.value[0] as 'category' | 'demographic', source_value: '', source_label: '' })}>
                          <Select.Control>
                            <Select.Trigger minWidth="140px">
                              <Select.ValueText placeholder="Select type..." />
                              <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                            </Select.Trigger>
                            <Select.Positioner>
                              <Select.Content>
                                {sourceTypeCollection.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    <Select.ItemText>{item.label}</Select.ItemText>
                                    <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Select.Control>
                        </Select.Root>
                      </Table.Cell>
                      <Table.Cell>
                        <Select.Root collection={sourceCollection} value={mapping.source_value ? [mapping.source_value] : []} onValueChange={(details) => {
                          const selected = details.value[0] || ''
                          const sourceItems = mapping.source_type === 'category' ? elvantoCategories : elvantoDemographics
                          const label = sourceItems.find(i => ('id' in i ? i.id : i.name) === selected)?.name || ''
                          updateMapping(index, { source_value: selected, source_label: label })
                        }}>
                          <Select.Control>
                            <Select.Trigger minWidth="180px">
                              <Select.ValueText placeholder="Select value..." />
                              <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                            </Select.Trigger>
                            <Select.Positioner>
                              <Select.Content>
                                {sourceCollection.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    <Select.ItemText>{item.label}</Select.ItemText>
                                    <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Select.Control>
                        </Select.Root>
                        {mapping.source_label && (
                          <Text textStyle="xs" color="fg.muted">{mapping.source_label}</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Select.Root collection={journeyTrackCollection} value={mapping.journey_track_id ? [mapping.journey_track_id] : []} onValueChange={(details) => updateMapping(index, { journey_track_id: details.value[0] || '', journey_track_name: getTrackName(details.value[0]) })} >
                          <Select.Control>
                            <Select.Trigger minWidth="180px">
                              <Select.ValueText placeholder="Select journey track..." />
                              <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                            </Select.Trigger>
                            <Select.Positioner>
                              <Select.Content>
                                {journeyTrackCollection.items.map((item) => (
                                  <Select.Item key={item.value} item={item}>
                                    <Select.ItemText>{item.label}</Select.ItemText>
                                    <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select.Positioner>
                          </Select.Control>
                        </Select.Root>
                        {mapping.journey_track_name && (
                          <Text textStyle="xs" color="fg.muted">{mapping.journey_track_name}</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Select.Root collection={stageCollection} value={mapping.stage ? [mapping.stage] : []} onValueChange={(details) => updateMapping(index, { stage: details.value[0] || 'contact' })}>
                          <Select.Control>
                            <Select.Trigger minWidth="140px">
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
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          type="number"
                          value={mapping.priority}
                          onChange={e => updateMapping(index, { priority: parseInt(e.target.value) || 0 })}
                          minWidth="80px"
                        />
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Button variant="outline" size="sm" color="red" onClick={() => removeMapping(index)}>
                          <Trash2Icon size={14} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table.Root>
            </Box>
          )}
        </Card.Body>
        <Card.Footer>
          <HStack justify="end">
            <Button variant="outline" onClick={addMapping}>
              <PlusIcon size={14} /> Add Mapping
            </Button>
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Stack>
  )
}