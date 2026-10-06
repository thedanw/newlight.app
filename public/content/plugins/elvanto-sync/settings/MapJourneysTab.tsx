import { useState, useEffect, useRef, useCallback } from 'react'
import { Stack, HStack, Box } from 'styled-system/jsx'
import { Heading, Text, Button, Card, Alert, Select, Badge, Link, Table, Input, IconButton, Accordion, useRegisterPageActions } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { createListCollection } from '@ark-ui/react'
import { ChevronsUpDownIcon, CheckIcon, MapPin, GitBranch, Shield, Download, TrashIcon, PlusIcon } from 'lucide-react'
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

interface ConditionRow {
  id: string
  field: 'category' | 'demographic' | 'location' | 'status_contact' | 'status_archived'
  operator: 'equals' | 'not_equals' | 'contains'
  value: string
}

interface TransformRow {
  id: string
  trackId: string
  stageId: string
}

interface TransformGroup {
  id: string
  name: string
  conditions: ConditionRow[]
  transforms: TransformRow[]
}

const STAGE_OPTIONS: JourneyStage[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'guest', label: 'Guest' },
  { id: 'linked', label: 'Linked' },
  { id: 'regular', label: 'Regular' },
  { id: 'archived', label: 'Archived' },
  { id: 'deleted_privacy_data', label: 'Deleted (Privacy Data)' },
]

const CONDITION_FIELD_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'demographic', label: 'Demographic' },
  { value: 'location', label: 'Location' },
  { value: 'status_contact', label: 'Status: Contact' },
  { value: 'status_archived', label: 'Status: Archived/Deceased' },
]

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
]

const LOGIC_OPTIONS = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
  { value: 'XOR', label: 'XOR' },
]

let idCounter = 0
const nextId = () => `local_${Date.now()}_${++idCounter}`

export function MapJourneysTab() {
  const { settings, toast, supabase } = usePluginAPIContext()
  const [journeyTracks, setJourneyTracks] = useState<JourneyTrack[]>([])
  const [elvantoCategories, setElvantoCategories] = useState<ElvantoCategory[]>([])
  const [elvantoDemographics, setElvantoDemographics] = useState<ElvantoDemographic[]>([])
  const [elvantoLocations, setElvantoLocations] = useState<ElvantoLocation[]>([])
  const [transformGroups, setTransformGroups] = useState<TransformGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const initialGroupsRef = useRef<TransformGroup[]>([])
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Try new transform groups format first
      const groups = await settings.getConfig<TransformGroup[]>('journey_transform_groups')
      if (groups && groups.length > 0) {
        setTransformGroups(groups)
        initialGroupsRef.current = JSON.parse(JSON.stringify(groups))
      } else {
        // Migrate old flat mappings to new format
        const oldMappings = await settings.getConfig<any[]>('journey_grid_mappings')
        const migrated: TransformGroup[] = (oldMappings || []).map(m => ({
          id: nextId(),
          name: `${m.trackId || m.journey_track_id} → ${m.stageId || m.stage}`,
          conditions: [{
            id: nextId(),
            field: m.sourceType || m.source_type || 'category',
            operator: 'equals' as const,
            value: m.sourceValue || m.source_value || '',
          }],
          transforms: [{
            id: nextId(),
            trackId: m.trackId || m.journey_track_id,
            stageId: m.stageId || m.stage,
          }],
        }))
        setTransformGroups(migrated)
        initialGroupsRef.current = JSON.parse(JSON.stringify(migrated))
      }
      setIsDirty(false)

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
      await settings.setConfig('journey_transform_groups', transformGroups)
      toast.success('Journey transform groups saved')
    } catch (err) {
      console.error('[MapJourneysTab] Failed to save:', err)
      toast.error('Failed to save mappings')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTransformGroups(JSON.parse(JSON.stringify(initialGroupsRef.current)))
    setIsDirty(false)
  }

  useRegisterPageActions({
    cancel: handleCancel,
    apply: handleSave,
    isSaving: saving,
    isDirty,
    applyLabel: 'Save Grid Mappings',
  })

  const markDirty = useCallback(() => setIsDirty(true), [])

  const addGroup = () => {
    setTransformGroups(prev => [...prev, {
      id: nextId(),
      name: `Transform ${prev.length + 1}`,
      conditions: [],
      transforms: [],
    }])
    markDirty()
  }

  const removeGroup = (groupId: string) => {
    setTransformGroups(prev => prev.filter(g => g.id !== groupId))
    markDirty()
  }

  const updateGroupName = (groupId: string, name: string) => {
    setTransformGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g))
    markDirty()
  }

  const addCondition = (groupId: string) => {
    setTransformGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        conditions: [...g.conditions, {
          id: nextId(),
          field: 'category',
          operator: 'equals',
          value: '',
        }],
      }
    }))
    markDirty()
  }

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<ConditionRow>) => {
    setTransformGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        conditions: g.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c),
      }
    }))
    markDirty()
  }

  const removeCondition = (groupId: string, conditionId: string) => {
    setTransformGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        conditions: g.conditions.filter(c => c.id !== conditionId),
      }
    }))
    markDirty()
  }

  const addTransform = (groupId: string) => {
    setTransformGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        transforms: [...g.transforms, {
          id: nextId(),
          trackId: journeyTracks[0]?.id || '',
          stageId: STAGE_OPTIONS[0]?.id || '',
        }],
      }
    }))
    markDirty()
  }

  const updateTransform = (groupId: string, transformId: string, updates: Partial<TransformRow>) => {
    setTransformGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        transforms: g.transforms.map(t => t.id === transformId ? { ...t, ...updates } : t),
      }
    }))
    markDirty()
  }

  const removeTransform = (groupId: string, transformId: string) => {
    setTransformGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g
      return {
        ...g,
        transforms: g.transforms.filter(t => t.id !== transformId),
      }
    }))
    markDirty()
  }

  const getConditionValueOptions = (field: ConditionRow['field']) => {
    switch (field) {
      case 'category':
        return elvantoCategories.map(c => ({ value: c.id, label: c.name }))
      case 'demographic':
        return elvantoDemographics.map(d => ({ value: d.name, label: d.name }))
      case 'location':
        return elvantoLocations.map(l => ({ value: l.id, label: l.name }))
      case 'status_contact':
      case 'status_archived':
        return [
          { value: '1', label: 'Yes' },
          { value: '0', label: 'No' },
        ]
      default:
        return []
    }
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
            <HStack alignItems="start" justifyContent={{ base: 'space-between', md: 'Start' }} flexWrap="wrap">
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
                    <Text fontWeight="medium">All</Text>
                </HStack>
              </Button>

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

      {/* Step 2: Transform Groups */}
      <Card.Root>
        <Card.Header>
          <HStack justifyContent="space-between" alignItems="center" css={{ flexWrap: 'wrap', gap: 2 }}>
            <Stack>
              <Card.Title>Step 2: Journey Grid</Card.Title>
              <Card.Description>
                Define conditional transform groups to assign Journey Tracks and Stages.
              </Card.Description>
            </Stack>
            <HStack gap="2">
              <Button onClick={addGroup} size="sm">
                <HStack gap="1" alignItems="center">
                  <PlusIcon size={16} />
                  <Text>Add Transform group</Text>
                </HStack>
              </Button>
            </HStack>
          </HStack>
        </Card.Header>
        <Card.Body>
          {journeyTracks.length === 0 ? (
            <Stack align="center" p="8">
              <Text color="fg.muted">No Journey Tracks found.</Text>
              <Link href="/settings/people" mt="2">Create tracks in /settings/people</Link>
            </Stack>
          ) : transformGroups.length === 0 ? (
            <Stack align="center" p="8">
              <Text color="fg.muted">No transform groups defined.</Text>
              <Button onClick={addGroup} variant="outline" size="sm" mt="2">
                <HStack gap="1" alignItems="center">
                  <PlusIcon size={16} />
                  <Text>Add Transform group</Text>
                </HStack>
              </Button>
            </Stack>
          ) : (
            <Accordion.Root collapsible>
              {transformGroups.map(group => (
                <Accordion.Item key={group.id} value={group.id}>
                  <Accordion.ItemTrigger>
                    <HStack flex="1" alignItems="center" gap="2">
                      <Input
                        value={group.name}
                        onChange={(e) => updateGroupName(group.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        size="sm"
                        css={{ maxW: '300px' }}
                      />
                      <Text textStyle="xs" color="fg.muted">
                        {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}, {group.transforms.length} transform{group.transforms.length !== 1 ? 's' : ''}
                      </Text>
                    </HStack>
                    <Button 
                      as="span"
                      variant="ghost" 
                      size="sm" 
                      color="red"
                      onClick={(e) => { e.stopPropagation(); removeGroup(group.id) }}
                      aria-label="Delete group"
                      css={{ cursor: 'pointer' }}
                    >
                      <TrashIcon size={16} />
                    </Button>
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Accordion.ItemBody>
                      <Stack gap="4" mt="4">
                        {/* Conditions Section */}
                        <Box borderWidth="1px" borderColor="border.subtle" borderRadius="md" p="4">
                          <HStack justifyContent="space-between" alignItems="center" mb="3">
                            <Text textStyle="sm" fontWeight="medium">Conditions</Text>
                            <Button size="xs" variant="outline" onClick={() => addCondition(group.id)}>
                              <HStack gap="1" alignItems="center">
                                <PlusIcon size={14} />
                                <Text>Add condition</Text>
                              </HStack>
                            </Button>
                          </HStack>
                          {group.conditions.length === 0 ? (
                            <Text textStyle="xs" color="fg.muted">No conditions. Click "Add condition" to define when this group applies.</Text>
                          ) : (
                            <Stack gap="2">
                              {group.conditions.map((condition, index) => (
                                <Stack key={condition.id} gap="2">
                                  {index > 0 && (
                                    <HStack justifyContent="center">
                                      <Select.Root
                                        collection={createListCollection({ items: LOGIC_OPTIONS })}
                                        value={[group.conditions[index]?.logic || 'AND']}
                                        onValueChange={(details) => {
                                          const newConditions = [...group.conditions]
                                          if (newConditions[index]) {
                                            newConditions[index] = { ...newConditions[index], logic: details.value[0] as ConditionRow['logic'] }
                                            setTransformGroups(prev => prev.map(g => g.id === group.id ? { ...g, conditions: newConditions } : g))
                                            markDirty()
                                          }
                                        }}
                                        width="fit-content"
                                      >
                                        <Select.Control>
                                          <Select.Trigger size="xs">
                                            <Select.ValueText />
                                            <Select.Indicator />
                                          </Select.Trigger>
                                          <Select.Positioner>
                                            <Select.Content>
                                              {LOGIC_OPTIONS.map(opt => (
                                                <Select.Item key={opt.value} item={opt}>
                                                  <Select.ItemText>{opt.label}</Select.ItemText>
                                                </Select.Item>
                                              ))}
                                            </Select.Content>
                                          </Select.Positioner>
                                        </Select.Control>
                                      </Select.Root>
                                    </HStack>
                                  )}
                                  <HStack gap="2" alignItems="center" flexWrap="wrap">
                                    <Select.Root
                                      collection={createListCollection({ items: CONDITION_FIELD_OPTIONS })}
                                      value={[condition.field]}
                                      onValueChange={(details) => {
                                        const newField = details.value[0] as ConditionRow['field']
                                        updateCondition(group.id, condition.id, { field: newField, value: '' })
                                      }}
                                      width="fit-content"
                                    >
                                      <Select.Control>
                                        <Select.Trigger size="sm" minWidth="140px">
                                          <Select.ValueText />
                                          <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Positioner>
                                          <Select.Content>
                                            {CONDITION_FIELD_OPTIONS.map(opt => (
                                              <Select.Item key={opt.value} item={opt}>
                                                <Select.ItemText>{opt.label}</Select.ItemText>
                                              </Select.Item>
                                            ))}
                                          </Select.Content>
                                        </Select.Positioner>
                                      </Select.Control>
                                    </Select.Root>

                                    <Select.Root
                                      collection={createListCollection({ items: OPERATOR_OPTIONS })}
                                      value={[condition.operator]}
                                      onValueChange={(details) => updateCondition(group.id, condition.id, { operator: details.value[0] as ConditionRow['operator'] })}
                                      width="fit-content"
                                    >
                                      <Select.Control>
                                        <Select.Trigger size="sm" minWidth="140px">
                                          <Select.ValueText />
                                          <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Positioner>
                                          <Select.Content>
                                            {OPERATOR_OPTIONS.map(opt => (
                                              <Select.Item key={opt.value} item={opt}>
                                                <Select.ItemText>{opt.label}</Select.ItemText>
                                              </Select.Item>
                                            ))}
                                          </Select.Content>
                                        </Select.Positioner>
                                      </Select.Control>
                                    </Select.Root>

                                    <Select.Root
                                      collection={createListCollection({ items: getConditionValueOptions(condition.field) })}
                                      value={condition.value ? [condition.value] : []}
                                      onValueChange={(details) => updateCondition(group.id, condition.id, { value: details.value[0] || '' })}
                                      width="fit-content"
                                      disabled={getConditionValueOptions(condition.field).length === 0}
                                    >
                                      <Select.Control>
                                        <Select.Trigger size="sm" minWidth="140px">
                                          <Select.ValueText placeholder="Select value..." />
                                          <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Positioner>
                                          <Select.Content>
                                            {getConditionValueOptions(condition.field).map(opt => (
                                              <Select.Item key={opt.value} item={opt}>
                                                <Select.ItemText>{opt.label}</Select.ItemText>
                                              </Select.Item>
                                            ))}
                                          </Select.Content>
                                        </Select.Positioner>
                                      </Select.Control>
                                    </Select.Root>

                                    <IconButton 
                                      variant="ghost" 
                                      size="sm" 
                                      color="red"
                                      onClick={() => removeCondition(group.id, condition.id)}
                                      aria-label="Remove condition"
                                    >
                                      <TrashIcon size={16} />
                                    </IconButton>
                                  </HStack>
                                </Stack>
                              ))}
                            </Stack>
                          )}
                        </Box>

                        {/* Transforms Section */}
                        <Box borderWidth="1px" borderColor="border.subtle" borderRadius="md" p="4">
                          <HStack justifyContent="space-between" alignItems="center" mb="3">
                            <Text textStyle="sm" fontWeight="medium">Transforms</Text>
                            <Button size="xs" variant="outline" onClick={() => addTransform(group.id)}>
                              <HStack gap="1" alignItems="center">
                                <PlusIcon size={14} />
                                <Text>Add transform</Text>
                              </HStack>
                            </Button>
                          </HStack>
                          {group.transforms.length === 0 ? (
                            <Text textStyle="xs" color="fg.muted">No transforms. Click "Add transform" to assign tracks and stages.</Text>
                          ) : (
                            <Stack gap="2">
                              {group.transforms.map(transform => (
                                <HStack key={transform.id} gap="2" alignItems="center" flexWrap="wrap">
                                  <Select.Root
                                    collection={createListCollection({ 
                                      items: journeyTracks.map(t => ({ value: t.id, label: t.name }))
                                    })}
                                    value={[transform.trackId]}
                                    onValueChange={(details) => updateTransform(group.id, transform.id, { trackId: details.value[0] || '' })}
                                    width="fit-content"
                                  >
                                    <Select.Control>
                                      <Select.Trigger size="sm" minWidth="160px">
                                        <Select.ValueText placeholder="Select track..." />
                                        <Select.Indicator />
                                      </Select.Trigger>
                                      <Select.Positioner>
                                        <Select.Content>
                                          {journeyTracks.map(t => (
                                            <Select.Item key={t.id} item={{ value: t.id, label: t.name }}>
                                              <Select.ItemText>{t.name}</Select.ItemText>
                                            </Select.Item>
                                          ))}
                                        </Select.Content>
                                      </Select.Positioner>
                                    </Select.Control>
                                  </Select.Root>

                                  <Select.Root
                                    collection={createListCollection({ 
                                      items: STAGE_OPTIONS.map(s => ({ value: s.id, label: s.label }))
                                    })}
                                    value={[transform.stageId]}
                                    onValueChange={(details) => updateTransform(group.id, transform.id, { stageId: details.value[0] || '' })}
                                    width="fit-content"
                                  >
                                    <Select.Control>
                                      <Select.Trigger size="sm" minWidth="140px">
                                        <Select.ValueText placeholder="Select stage..." />
                                        <Select.Indicator />
                                      </Select.Trigger>
                                      <Select.Positioner>
                                        <Select.Content>
                                          {STAGE_OPTIONS.map(s => (
                                            <Select.Item key={s.id} item={{ value: s.id, label: s.label }}>
                                              <Select.ItemText>{s.label}</Select.ItemText>
                                            </Select.Item>
                                          ))}
                                        </Select.Content>
                                      </Select.Positioner>
                                    </Select.Control>
                                  </Select.Root>

                                  <IconButton 
                                    variant="ghost" 
                                    size="sm" 
                                    color="red"
                                    onClick={() => removeTransform(group.id, transform.id)}
                                    aria-label="Remove transform"
                                  >
                                    <TrashIcon size={16} />
                                  </IconButton>
                                </HStack>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Accordion.ItemBody>
                  </Accordion.ItemContent>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          )}
        </Card.Body>
      </Card.Root>
     </Stack>
  )
}
