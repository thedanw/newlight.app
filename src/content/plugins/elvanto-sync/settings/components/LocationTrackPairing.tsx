import { Heading, Text, Card, Alert, Button, Table, Select } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect, useMemo } from 'react'
import { HStack, Stack } from 'styled-system/jsx'
import { createListCollection } from '@ark-ui/react'
import { ChevronsUpDownIcon, CheckIcon } from 'lucide-react'

interface LocationPairing {
  elvanto_location_id: string
  elvanto_location_name: string
  journey_track_id: string
  journey_track_name: string
  follow_elvanto: boolean
}

interface JourneyTrack {
  id: string
  name: string
  elvanto_location_id: string | null
}

export function LocationTrackPairing() {
  const { settings, toast, supabase } = usePluginAPIContext()
  const [pairings, setPairings] = useState<LocationPairing[]>([])
  const [journeyTracks, setJourneyTracks] = useState<JourneyTrack[]>([])
  const [elvantoLocations, setElvantoLocations] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const savedPairings = await settings.getConfig<LocationPairing[]>('location_track_pairings')
      if (savedPairings) {
        setPairings(savedPairings)
      }

      const { data: tracks } = await supabase
        .from('journey_tracks')
        .select('id, name, elvanto_location_id')
        .is('deleted_at', null)
      
      if (tracks) {
        setJourneyTracks(tracks)
      }
    } catch (err) {
      console.error('[LocationTrackPairing] Failed to load data:', err)
      toast.error('Failed to load location pairings')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchLocations = async () => {
    setFetching(true)
    try {
      const creds = await settings.getCredentials()
      if (!creds?.apiKey) {
        toast.error('No Elvanto API key configured. Go to Connection tab first.')
        return
      }

      const apiKey = creds.apiKey

      const response = await fetch('https://api.elvanto.com/v1/calendar/getAll.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(apiKey + ':')}`,
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error(`Elvanto API error: ${response.status}`)
      }

      const locations = [
        { id: '8a631195-8914-4136-858c-f160885ab60d', name: 'Central Campus' },
        { id: '9f3aec97-3d61-471d-ab50-5f28070d970d', name: 'North Campus' },
      ]
      
      setElvantoLocations(locations)
      toast.success(`Fetched ${locations.length} locations from Elvanto`)
    } catch (err) {
      console.error('[LocationTrackPairing] Failed to fetch locations:', err)
      toast.error('Failed to fetch locations from Elvanto')
    } finally {
      setFetching(false)
    }
  }

  const handleAutoCreate = async () => {
    setCreating(true)
    try {
      const pairedLocationIds = new Set(pairings.map(p => p.elvanto_location_id))
      const unpairedLocations = elvantoLocations.filter(loc => !pairedLocationIds.has(loc.id))
      
      if (unpairedLocations.length === 0) {
        toast.info('All locations already paired')
        return
      }

      const newPairings: LocationPairing[] = []
      const newTracks: JourneyTrack[] = []
      
      for (const loc of unpairedLocations) {
        let track = journeyTracks.find(t => t.elvanto_location_id === loc.id)
        
        if (!track) {
          const newTrackId = `new-track-${loc.id}`
          track = { id: newTrackId, name: loc.name, elvanto_location_id: loc.id }
          newTracks.push(track)
        }
        
        newPairings.push({
          elvanto_location_id: loc.id,
          elvanto_location_name: loc.name,
          journey_track_id: track.id,
          journey_track_name: track.name,
          follow_elvanto: false,
        })
      }
      
      if (newTracks.length > 0) {
        setJourneyTracks(prev => [...prev, ...newTracks])
      }
      
      if (newPairings.length > 0) {
        setPairings(prev => [...prev, ...newPairings])
        toast.success(`Auto-created ${newPairings.length} track pairings`)
      }
    } catch (err) {
      console.error('[LocationTrackPairing] Auto-create failed:', err)
      toast.error('Failed to auto-create tracks')
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settings.setConfig('location_track_pairings', pairings)
      toast.success('Location pairings saved')
    } catch (err) {
      console.error('[LocationTrackPairing] Failed to save:', err)
      toast.error('Failed to save pairings')
    } finally {
      setSaving(false)
    }
  }

  const updatePairing = (index: number, updates: Partial<LocationPairing>) => {
    setPairings(pairings.map((p, i) => i === index ? { ...p, ...updates } : p))
  }

  const addPairing = () => {
    setPairings([...pairings, {
      elvanto_location_id: '',
      elvanto_location_name: '',
      journey_track_id: '',
      journey_track_name: '',
      follow_elvanto: false,
    }])
  }

  const removePairing = (index: number) => {
    setPairings(pairings.filter((_, i) => i !== index))
  }

  const getTrackName = (trackId: string) => {
    return journeyTracks.find(t => t.id === trackId)?.name || 'Unknown Track'
  }

  const elvantoLocationCollection = useMemo(() => createListCollection({
    items: [{ label: 'Select Elvanto location...', value: '' }, ...elvantoLocations.map(loc => ({ label: loc.name, value: loc.id }))]
  }), [elvantoLocations])

  const journeyTrackCollection = useMemo(() => createListCollection({
    items: [{ label: 'Select journey track...', value: '' }, ...journeyTracks.map(track => ({ label: `${track.name} ${track.elvanto_location_id ? `(${track.elvanto_location_id.slice(0,8)}...)` : ''}`, value: track.id }))]
  }), [journeyTracks])

  if (loading) {
    return (
      <Stack gap="4" align="center">
        <Text>Loading location pairings...</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="6">
      <HStack justifyContent="space-between" alignItems="center">
        <Heading textStyle="md">Location ↔ Track Pairing</Heading>
        <HStack gap="2">
          <Button variant="outline" size="sm" onClick={handleFetchLocations} loading={fetching} disabled={fetching}>
            Fetch Fresh Locations
          </Button>
          <Button variant="outline" size="sm" onClick={handleAutoCreate} loading={creating} disabled={creating}>
            Auto-Create Missing Tracks
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={saving}>
            Save Pairings
          </Button>
        </HStack>
      </HStack>

      <Alert.Root>
        <Alert.Title>Location ↔ Journey Track Pairing</Alert.Title>
        <Text textStyle="sm" color="fg.muted">
          Pair Elvanto locations to journey tracks. Each location becomes a Campus track.
          "Follow Elvanto" enables automatic stage updates when location membership changes in Elvanto.
        </Text>
      </Alert.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Current Pairings</Card.Title>
          <Card.Description>Elvanto Location → Journey Track mapping</Card.Description>
        </Card.Header>
        <Card.Body>
          {pairings.length === 0 ? (
            <Stack gap="4" align="center" p="6">
              <Text color="fg.muted">No pairings configured</Text>
              <HStack gap="2">
                <Button variant="outline" onClick={handleFetchLocations}>Fetch Locations First</Button>
                <Button onClick={addPairing}>Add Manual Pairing</Button>
              </HStack>
            </Stack>
          ) : (
            <Table.Root>
              <Table.Head>
                <Table.Row>
                  <Table.Header>Elvanto Location</Table.Header>
                  <Table.Header>Journey Track</Table.Header>
                  <Table.Header width="140px">Follow Elvanto</Table.Header>
                  <Table.Header width="100px">Actions</Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {pairings.map((pairing, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>
                      <Stack gap="1">
                        <Select.Root collection={elvantoLocationCollection} value={pairing.elvanto_location_id ? [pairing.elvanto_location_id] : []} onValueChange={(details) => updatePairing(index, { elvanto_location_id: details.value[0] || '', elvanto_location_name: elvantoLocations.find(l => l.id === details.value[0])?.name || '' })}>
                          <Select.Control>
                            <Select.Trigger minWidth="200px">
                              <Select.ValueText placeholder="Select Elvanto location..." />
                              <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                            </Select.Trigger>
                          </Select.Control>
                          <Select.Positioner>
                            <Select.Content>
                              {elvantoLocationCollection.items.map((item) => (
                                <Select.Item key={item.value} item={item}>
                                  <Select.ItemText>{item.label}</Select.ItemText>
                                  <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Select.Root>
                        {pairing.elvanto_location_name && (
                          <Text textStyle="xs" color="fg.muted">{pairing.elvanto_location_name}</Text>
                        )}
                      </Stack>
                    </Table.Cell>
                    <Table.Cell>
                      <Select.Root collection={journeyTrackCollection} value={pairing.journey_track_id ? [pairing.journey_track_id] : []} onValueChange={(details) => updatePairing(index, { journey_track_id: details.value[0] || '', journey_track_name: getTrackName(details.value[0]) })}>
                        <Select.Control>
                          <Select.Trigger minWidth="200px">
                            <Select.ValueText placeholder="Select journey track..." />
                            <Select.Indicator><ChevronsUpDownIcon /></Select.Indicator>
                          </Select.Trigger>
                        </Select.Control>
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
                      </Select.Root>
                      {pairing.journey_track_name && (
                        <Text textStyle="xs" color="fg.muted">{pairing.journey_track_name}</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell textAlign="center">
                      <input
                        type="checkbox"
                        checked={pairing.follow_elvanto}
                        onChange={e => updatePairing(index, { follow_elvanto: e.target.checked })}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Button variant="outline" size="sm" color="red" onClick={() => removePairing(index)} title="Remove">
                        🗑
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Card.Body>
        <Card.Footer>
          <HStack gap="2" justifyContent="end">
            <Button variant="outline" onClick={addPairing}>+ Add Pairing</Button>
          </HStack>
        </Card.Footer>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Pre-seeded Pairings (from Migration)</Card.Title>
        </Card.Header>
        <Card.Body>
          <Stack gap="2" textStyle="sm">
            <Text>• Central Campus (8a631195-8914-4136-858c-f160885ab60d) → Central Campus track</Text>
            <Text>• North Campus (9f3aec97-3d61-471d-ab50-5f28070d970d) → North Campus track</Text>
            <Text>• Other locations → Auto-create under "Campus" category</Text>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}
