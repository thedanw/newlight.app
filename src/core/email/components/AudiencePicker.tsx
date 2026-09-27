import { useEffect, useMemo, useState } from 'react'
import { Button, Field, Input, Select, TabScroller, Tabs, Text } from '@/core/ui'
import { createListCollection } from '@ark-ui/react'
import { getSavedLists, searchPeople } from '@/modules/people/lib/queries'
import type { EmailAudienceType } from '../lib/types'
import { getPresets } from '../lib/audience'
import { Stack } from 'styled-system/jsx'

export interface AudiencePickerProps {
  audienceType: EmailAudienceType
  audienceRef?: string
  peopleIds?: string[]
  onChange: (type: EmailAudienceType, ref?: string, peopleIds?: string[]) => void
}

export function AudiencePicker({ audienceType, audienceRef, peopleIds, onChange }: AudiencePickerProps) {
  const [availableLists, setAvailableLists] = useState<Array<{ id: string; name: string }>>([])
  const [availablePresets, setAvailablePresets] = useState<string[]>([])
  const [peopleSearch, setPeopleSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([])
  const [resultsVisible, setResultsVisible] = useState(true)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [loading, setLoading] = useState(false)

  const [selectedList, setSelectedList] = useState(audienceRef ?? '')
  const [selectedPreset, setSelectedPreset] = useState(audienceRef ?? '')
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(
    new Set(peopleIds ?? []),
  )

  // Create list collections for Park UI Select
  const listCollection = useMemo(() => createListCollection({
    items: availableLists.map((list) => ({ label: list.name, value: list.id }))
  }), [availableLists])

  const presetCollection = useMemo(() => createListCollection({
    items: availablePresets.map((preset) => ({ label: preset, value: preset }))
  }), [availablePresets])

  const showSearch = resultsVisible
  const hasResults = searchResults.length > 0

  useEffect(() => {
    getSavedLists()
      .then((lists) => setAvailableLists(lists.map((l) => ({ id: l.id, name: l.name }))))
      .catch(() => [])
    setAvailablePresets(getPresets())
  }, [])

  const handleTypeChange = (type: EmailAudienceType) => {
    onChange(type, undefined, type === 'explicit' ? [...selectedPeople] : undefined)
  }

  const handleSearchPeople = async (searchTerm = peopleSearch) => {
    const term = searchTerm.trim()
    if (!term) {
      setSearchResults([])
      setSearchPerformed(true)
      return
    }
    setLoading(true)
    try {
      const results = await searchPeople(term)
      const seen = new Map<string, { id: string; name: string }>()
      for (const p of results) {
        const key = p.id
        if (!seen.has(key)) {
          seen.set(key, { id: p.id, name: `${p.firstname || ''} ${p.lastname || ''}`.trim() })
        }
      }
      setSearchResults([...seen.values()])
      setSearchPerformed(true)
    } catch {
      setSearchResults([])
      setSearchPerformed(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (peopleSearch.trim()) {
      const timer = setTimeout(() => handleSearchPeople(), 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setSearchPerformed(false)
    }
  }, [peopleSearch])

  const togglePerson = (id: string) => {
    const next = new Set(selectedPeople)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPeople(next)
    onChange('explicit', undefined, [...next])
  }

  const handleListChange = (id: string) => {
    setSelectedList(id)
    onChange('saved_list', id)
  }

  const handlePresetChange = (id: string) => {
    setSelectedPreset(id)
    onChange('preset', id)
  }

  return (
    <Stack>
      <TabScroller>
        <Tabs.Root
          value={audienceType}
          onValueChange={(e) => handleTypeChange(e.value as EmailAudienceType)}
        >
          <Tabs.List>
            <Tabs.Trigger value="saved_list">Saved List</Tabs.Trigger>
            <Tabs.Trigger value="explicit">People</Tabs.Trigger>
            <Tabs.Trigger value="preset">Preset</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="saved_list">
            <Field.Root>
              <Field.Label>Saved List</Field.Label>
              <Select.Root multiple value={selectedList ? [selectedList] : []} onValueChange={(details) => handleListChange(details.value[0] ?? '')}>
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select a list..." />
                    <Select.Indicator />
                  </Select.Trigger>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    <Select.Item item={{ label: 'Select a list...', value: '' }}>
                      <Select.ItemText>Select a list...</Select.ItemText>
                    </Select.Item>
                    {listCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Field.Root>
          </Tabs.Content>

          <Tabs.Content value="explicit">
            <Stack gap="2">
              <Field.Root>
                <Field.Label>Search People</Field.Label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Input
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchPeople(peopleSearch).then(() => setResultsVisible(true))
                    }}
                    placeholder="Search by name or email"
                  />
                  {!showSearch && hasResults && (
                    <Button onClick={() => setResultsVisible(true)} variant="plain">
                      Show Results
                    </Button>
                  )}
                  {!showSearch && !hasResults && (
                    <Button onClick={() => handleSearchPeople(peopleSearch).then(() => setResultsVisible(true))} disabled={loading}>
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                  )}
                </div>
              </Field.Root>

              {showSearch && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb' }}>
                  {searchResults.map((person) => (
                    <label
                      key={person.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPeople.has(person.id)}
                        onChange={() => togglePerson(person.id)}
                      />
                      {person.name || person.id}
                    </label>
                  ))}
                  {searchResults.length === 0 && !loading && searchPerformed && (
                    <div style={{ padding: '0.5rem' }}>No results</div>
                  )}
                </div>
              )}

              {showSearch && hasResults && (
                <Button onClick={() => setResultsVisible(false)} variant="plain">
                  Hide Results
                </Button>
              )}

              {selectedPeople.size > 0 && (
                <Text color="fg.muted">
                  {selectedPeople.size} person{selectedPeople.size === 1 ? '' : 's'} selected
                </Text>
              )}
            </Stack>
          </Tabs.Content>

          <Tabs.Content value="preset">
            <Field.Root>
              <Field.Label>Preset</Field.Label>
              <Select.Root multiple value={selectedPreset ? [selectedPreset] : []} onValueChange={(details) => handlePresetChange(details.value[0] ?? '')}>
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Select a preset..." />
                    <Select.Indicator />
                  </Select.Trigger>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    <Select.Item item={{ label: 'Select a preset...', value: '' }}>
                      <Select.ItemText>Select a preset...</Select.ItemText>
                    </Select.Item>
                    {presetCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Field.Root>
          </Tabs.Content>
        </Tabs.Root>
      </TabScroller>
    </Stack>
  )
}
