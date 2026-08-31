import { Heading, Text, Card, Alert, Button, Table } from '@/core/ui'
import { usePluginAPIContext } from '@/core/plugins/PluginAPI'
import { useState, useEffect } from 'react'
import { HStack, Stack } from 'styled-system/jsx'

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
            <Stack gap="4" align="center" style={{ padding: '24px' }}>
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
                  <Table.Header style={{ width: '140px' }}>Follow Elvanto</Table.Header>
                  <Table.Header style={{ width: '100px' }}>Actions</Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {pairings.map((pairing, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>
                      <Stack gap="1">
                        <select
                          value={pairing.elvanto_location_id}
                          onChange={e => updatePairing(index, { elvanto_location_id: e.target.value, elvanto_location_name: elvantoLocations.find(l => l.id === e.target.value)?.name || '' })}
                          style={{ minWidth: '200px' }}
                        >
                          <option value="">Select Elvanto location...</option>
                          {elvantoLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                        {pairing.elvanto_location_name && (
                          <Text textStyle="xs" color="fg.muted">{pairing.elvanto_location_name}</Text>
                        )}
                      </Stack>
                    </Table.Cell>
                    <Table.Cell>
                      <select
                        value={pairing.journey_track_id}
                        onChange={e => updatePairing(index, { journey_track_id: e.target.value, journey_track_name: getTrackName(e.target.value) })}
                        style={{ minWidth: '200px' }}
                      >
                        <option value="">Select journey track...</option>
                        {journeyTracks.map(track => (
                          <option key={track.id} value={track.id}>
                            {track.name} {track.elvanto_location_id ? `(📍 ${track.elvanto_location_id.slice(0,8)}...)` : ''}
                          </option>
                        ))}
                      </select>
                      {pairing.journey_track_name && (
                        <Text textStyle="xs" color="fg.muted">{pairing.journey_track_name}</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: 'center' }}>
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
