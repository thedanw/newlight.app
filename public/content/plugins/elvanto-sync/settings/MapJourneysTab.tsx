import { useState, useEffect } from 'react'
import { Stack, HStack, Box } from 'styled-system/jsx'
import { Heading, Text, Button, Card, Alert, Select, Badge, Link, Table } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { createListCollection } from '@ark-ui/react'
import { ChevronsUpDownIcon, CheckIcon, MapPin, GitBranch, Shield, Download } from 'lucide-react'
import { decrypt } from '@/content/plugins/elvanto-sync/utils/encryption'
import { fetchElvantoCategories, fetchElvantoDemographics, fetchElvantoLocations } from '@/content/plugins/elvanto-sync/sync/elvanto-api'

interface JourneyTrack {
  id: string
  name: string
  elvanto_location_id: string | null
}

interface JourneyStage {
  id: string
  label: string
}

interface ElvantoCategory {
  id: string
  name: string
}

interface ElvantoDemographic {
  name: string
}

interface ElvantoLocation {
  id: string
  name: string
}

interface JourneyGridMapping {
  trackId: string
  stageId: string
  sourceType: 'category' | 'demographic' | 'location' | 'status_contact' | 'status_archived'
  sourceValue: string
  sourceLabel: string
}

const STAGE_OPTIONS: JourneyStage[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'guest', label: 'Guest' },
  { id: 'linked', label: 'Linked' },
  { id: 'regular', label: 'Regular' },
  { id: 'archived', label: 'Archived' },
  { id: 'deleted_privacy_data', label: 'Deleted (Privacy Data)' },
]

export function MapJourneysTab() {
  const { settings, toast, supabase } = usePluginAPIContext()
  const [journeyTracks, setJourneyTracks] = useState<JourneyTrack[]>([])
  const [elvantoCategories, setElvantoCategories] = useState<ElvantoCategory[]>([])
  const [elvantoDemographics, setElvantoDemographics] = useState<ElvantoDemographic[]>([])
  const [elvantoLocations, setElvantoLocations] = useState<ElvantoLocation[]>([])
  const [mappings, setMappings] = useState<JourneyGridMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const savedMappings = await settings.getConfig<JourneyGridMapping[]>('journey_grid_mappings')
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

      // Load discovered fields from catalog
      const catalog = await settings.getConfig<any>('elvanto_field_catalog')
      if (catalog) {
        if (catalog.categories) {
          setElvantoCategories(catalog.categories.map((c: any) => ({ id: c.id, name: c.name })))
        }
        if (catalog.demographics) {
          setElvantoDemographics(catalog.demographics.map((d: any) => ({ name: d.name })))
        }
        if (catalog.locations) {
          setElvantoLocations(catalog.locations.map((l: any) => ({ id: l.id, name: l.name })))
        }
      }
    } catch (err) {
      console.error('[MapJourneysTab] Failed to load data:', err)
      toast.error('Failed to load journey mapping data')
    } finally {
      setLoading(false)
    }
  }

  const handleFetch = async (type: 'categories' | 'demographics' | 'locations') => {
    setFetching(prev => ({ ...prev, [type]: true }))
    try {
      const creds = await settings.getCredentials()
      if (!creds?.apiKey) {
        toast.error('No Elvanto API key configured. Go to Connection tab first.')
        return
      }

      let apiKey = creds.apiKey
      try {
        apiKey = await decrypt(apiKey)
      } catch {
        // Fallback: legacy/plaintext credentials
      }

      let results: any[] = []
      if (type === 'categories') {
        results = await fetchElvantoCategories(apiKey)
        setElvantoCategories(results)
      } else if (type === 'demographics') {
        results = await fetchElvantoDemographics(apiKey)
        setElvantoDemographics(results)
      } else if (type === 'locations') {
        results = await fetchElvantoLocations(apiKey)
        setElvantoLocations(results)
      }

      // Update catalog
      const catalog = await settings.getConfig<any>('elvanto_field_catalog') || {}
      if (type === 'categories') catalog.categories = results.map(c => ({ id: c.id, name: c.name }))
      if (type === 'demographics') catalog.demographics = results.map(d => ({ name: d.name }))
      if (type === 'locations') catalog.locations = results.map(l => ({ id: l.id, name: l.name }))
      await settings.setConfig('elvanto_field_catalog', catalog)

      toast.success(`Fetched ${results.length} ${type}`)
    } catch (err) {
      console.error(`[MapJourneysTab] Failed to fetch ${type}:`, err)
      toast.error(`Failed to fetch ${type} from Elvanto`)
    } finally {
      setFetching(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settings.setConfig('journey_grid_mappings', mappings)
      toast.success('Journey grid mappings saved')
    } catch (err) {
      console.error('[MapJourneysTab] Failed to save:', err)
      toast.error('Failed to save mappings')
    } finally {
      setSaving(false)
    }
  }

  const updateMapping = (trackId: string, stageId: string, updates: Partial<JourneyGridMapping>) => {
    setMappings(prev => {
      const existing = prev.find(m => m.trackId === trackId && m.stageId === stageId)
      if (existing) {
        return prev.map(m => 
          m.trackId === trackId && m.stageId === stageId ? { ...m, ...updates } : m
        )
      } else {
        return [...prev, { trackId, stageId, ...updates } as JourneyGridMapping]
      }
    })
  }

  const removeMapping = (trackId: string, stageId: string) => {
    setMappings(prev => prev.filter(m => !(m.trackId === trackId && m.stageId === stageId)))
  }

  const getMapping = (trackId: string, stageId: string) => {
    return mappings.find(m => m.trackId === trackId && m.stageId === stageId)
  }

  const getSourceCollection = (sourceType: string) => {
    let items: Array<{ id: string; name: string }> = []
    if (sourceType === 'category') items = elvantoCategories
    else if (sourceType === 'demographic') items = elvantoDemographics.map(d => ({ id: d.name, name: d.name }))
    else if (sourceType === 'location') items = elvantoLocations
    else if (sourceType === 'status_contact') items = [{ id: 'contact', name: 'Contact = 1' }]
    else if (sourceType === 'status_archived') items = [{ id: 'archived', name: 'Archived/Deceased = 1' }]
    
    return createListCollection({
      items: [{ label: `Select ${sourceType}...`, value: '' }, ...items.map(item => ({ label: item.name, value: item.id }))]
    })
  }

  if (loading) {
    return (
      <Stack align="center">
        <Text>Loading journey mapping...</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <Heading textStyle="lg">Map Journeys</Heading>
      <Text color="fg.muted" textStyle="sm">
        Configure how Elvanto data maps to Journey Tracks and Stages.
      </Text>

      {/* Step 1: Fetch Data - at the top */}
      <Card.Root>
        <Card.Header>
          <Card.Title>Step 1: Fetch Data from Elvanto</Card.Title>
          <Card.Description>
            Pull Categories, Demographics, and Locations from Elvanto to populate the mapping grid.
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <Stack gap="3">
            <HStack gap="3" css={{ flexWrap: 'wrap' }}>
                <Stack alignItems="center">
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => handleFetch('categories')} 
                    loading={fetching.categories}
                    disabled={fetching.categories}
                >
                    <HStack alignItems="center">
                    <GitBranch size={18} />
                        <Text fontWeight="medium">Categories</Text>
                    </HStack>
                </Button>
                <Text textStyle="xs" color="fg.muted">
                {elvantoCategories.length > 0 ? `${elvantoCategories.length} fetched` : 'Not fetched'}
                </Text>
              </Stack>
              <Stack alignItems="center">
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => handleFetch('demographics')} 
                    loading={fetching.demographics}
                    disabled={fetching.demographics}
                >
                    <HStack alignItems="center">
                        <Shield size={18} />
                        <Text fontWeight="medium">Demographics</Text>
                    </HStack>
                </Button>
                <Text textStyle="xs" color="fg.muted">
                    {elvantoDemographics.length > 0 ? `${elvantoDemographics.length} fetched` : 'Not fetched'}
                </Text>
              </Stack>  
              <Stack alignItems="center">
                <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => handleFetch('locations')} 
                    loading={fetching.locations}
                    disabled={fetching.locations}
                >
                    <HStack alignItems="center">
                    <MapPin size={18} />
                    <Text>Locations</Text>
                    </HStack>
                </Button>
                <Text textStyle="xs" color="fg.muted">
                    {elvantoLocations.length > 0 ? `${elvantoLocations.length} fetched` : 'Not fetched'}
                </Text>
              </Stack>
              <Stack>
              <Button 
                variant="solid" 
                size="lg"
                onClick={() => {
                  handleFetch('categories')
                  handleFetch('demographics')
                  handleFetch('locations')
                }} 
                loading={fetching.categories || fetching.demographics || fetching.locations}
                disabled={fetching.categories || fetching.demographics || fetching.locations}
              >
                <HStack gap="1" alignItems="center">
                  <Download size={18} />
                    <Text fontWeight="medium">Fetch All</Text>
                </HStack>
              </Button>
                    <Text textStyle="xs" color="fg.muted">
                      Fetch Categories, Demographics & Locations
                    </Text>
                    </Stack>
            </HStack>

            {(elvantoCategories.length > 0 || elvantoDemographics.length > 0 || elvantoLocations.length > 0) && (
              <Alert.Root>
                <Alert.Title>Data Fetched Successfully</Alert.Title>
                <Text textStyle="sm" color="fg.muted">
                  Fetched {elvantoCategories.length} categor{elvantoCategories.length === 1 ? 'y' : 'ies'}, 
                  {elvantoDemographics.length} demographic{elvantoDemographics.length === 1 ? '' : 's'}, 
                  and {elvantoLocations.length} location{elvantoLocations.length === 1 ? '' : 's'} from Elvanto.
                </Text>
              </Alert.Root>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>

      {/* Step 2: Journey Grid - at the bottom */}
      <Card.Root>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" css={{ flexWrap: 'wrap', gap: 2 }}>
            <Stack>
              <Card.Title>Step 2: Journey Grid</Card.Title>
              <Card.Description>
                Map Elvanto sources (Categories, Demographics, Locations, Status) to Journey Tracks × Stages.
              </Card.Description>
            </Stack>
            <HStack gap="2">
              <Button onClick={handleSave} loading={saving} disabled={saving}>
                Save Grid Mappings
              </Button>
            </HStack>
          </HStack>
        </Card.Header>
        <Card.Body>
          <Alert.Root>
            <Alert.Title>Journey Grid Mapping</Alert.Title>
            <Text textStyle="sm" color="fg.muted">
              Rows = Journey Tracks, Columns = Journey Stages. Each cell defines which Elvanto source assigns a person to that Track + Stage.
              <Link href="/settings/people" textStyle="sm" color="colorPalette.fg">
                Set/Edit/Delete tracks in /settings/people
              </Link>
            </Text>
          </Alert.Root>

          {journeyTracks.length === 0 ? (
            <Stack align="center" p="8">
              <Text color="fg.muted">No Journey Tracks found.</Text>
              <Link href="/settings/people" mt="2">Create tracks in /settings/people</Link>
            </Stack>
          ) : (
            <Box overflowX="auto" minW="0">
                <Table.Root>
                    <Table.Head>
                    <Table.Row>
                        <Table.Header>Track / Stage</Table.Header>
                        {STAGE_OPTIONS.map(stage => (
                        <Table.Header key={stage.id} css={{ textAlign: 'center' }}>
                            {stage.label}
                        </Table.Header>
                        ))}
                    </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {journeyTracks.map(track => (
                            <Table.Row key={track.id}>
                            <Table.Cell css={{ fontWeight: 'medium', bg: 'gray.1' }}>
                                {track.name}
                                {track.elvanto_location_id && (
                                <Badge variant="subtle" mt="1" fontSize="xs">
                                    Location: {track.elvanto_location_id.slice(0, 8)}...
                                </Badge>
                                )}
                            </Table.Cell>
                            {STAGE_OPTIONS.map(stage => {
                                const mapping = getMapping(track.id, stage.id)
                                const sourceType = mapping?.sourceType || ''
                                const sourceValue = mapping?.sourceValue || ''
                                const sourceLabel = mapping?.sourceLabel || ''
                                
                                return (
                                <Table.Cell key={`cell-${track.id}-${stage.id}`} css={{ p: 1, textAlign: 'center' }}>
                                    <Stack gap="1" minW="140px">
                                    <Select.Root 
                                        collection={getSourceCollection(sourceType || 'category')} 
                                        value={sourceValue ? [sourceValue] : []} 
                                        onValueChange={(details) => {
                                        const selected = details.value[0] || ''
                                        const sourceItems = sourceType === 'category' ? elvantoCategories :
                                                            sourceType === 'demographic' ? elvantoDemographics.map(d => ({ id: d.name, name: d.name })) :
                                                            sourceType === 'location' ? elvantoLocations :
                                                            sourceType === 'status_contact' ? [{ id: 'contact', name: 'Contact = 1' }] :
                                                            [{ id: 'archived', name: 'Archived/Deceased = 1' }]
                                            const label = sourceItems.find(i => i.id === selected)?.name || ''
                                            updateMapping(track.id, stage.id, { 
                                            sourceType: sourceType as any, 
                                            sourceValue: selected, 
                                            sourceLabel: label 
                                            })
                                        }}
                                    >
                                        <Select.Control>
                                        <Select.Trigger minWidth="140px">
                                            <Select.ValueText placeholder="Select source..." />
                                            <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                                        </Select.Trigger>
                                        <Select.Positioner>
                                            <Select.Content>
                                            {getSourceCollection(sourceType || 'category').items.map((item) => (
                                                <Select.Item key={item.value} item={item}>
                                                <Select.ItemText>{item.label}</Select.ItemText>
                                                <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                                </Select.Item>
                                            ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                        </Select.Control>
                                    </Select.Root>
                                    {sourceLabel && (
                                        <Text textStyle="xs" color="fg.muted">{sourceLabel}</Text>
                                    )}
                                    {mapping && (
                                        <Button 
                                        variant="outline" 
                                        size="xs" 
                                        color="red"
                                        onClick={() => removeMapping(track.id, stage.id)}
                                        >
                                        Clear
                                        </Button>
                                    )}
                                    </Stack>
                                </Table.Cell>
                                )
                            })}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>
              )}
        </Card.Body>
      </Card.Root>
     </Stack>
)}
