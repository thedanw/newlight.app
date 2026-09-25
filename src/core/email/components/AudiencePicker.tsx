import { useState } from 'react'
import { Button, Field, Input, TabScroller, Tabs, Text } from '@/core/ui'
import { getSavedLists } from '@/modules/people/lib/queries'
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
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(false)

  const [selectedList, setSelectedList] = useState(audienceRef ?? '')
  const [selectedPreset, setSelectedPreset] = useState(audienceRef ?? '')
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(
    new Set(peopleIds ?? []),
  )

  useState(() => {
    getSavedLists()
      .then((lists) => setAvailableLists(lists.map((l) => ({ id: l.id, name: l.name }))))
      .catch(() => [])
    setAvailablePresets(getPresets())
  })

  const handleTypeChange = (type: EmailAudienceType) => {
    onChange(type, undefined, type === 'explicit' ? [...selectedPeople] : undefined)
  }

  const handleSearchPeople = async () => {
    if (!peopleSearch.trim()) return
    setLoading(true)
    try {
      const { searchPeople } = await import('@/modules/people/lib/queries')
      const results = await searchPeople(peopleSearch)
      setSearchResults(results.map((p) => ({ id: p.id, name: `${p.firstname} ${p.lastname}` })))
    } catch (err) {
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

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
        </Tabs.Root>
      </TabScroller>

      {audienceType === 'saved_list' && (
        <Field.Root>
          <Field.Label>Saved List</Field.Label>
          <select
            value={selectedList}
            onChange={(e) => handleListChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">Select a list...</option>
            {availableLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </Field.Root>
      )}

      {audienceType === 'explicit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Field.Root>
            <Field.Label>Search People</Field.Label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                placeholder="Search by name or email"
              />
              <Button onClick={handleSearchPeople} disabled={loading || !peopleSearch.trim()}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </Field.Root>

          <Button onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? 'Hide Results' : 'Show Results'}
          </Button>

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
              {searchResults.length === 0 && !loading && <div style={{ padding: '0.5rem' }}>No results</div>}
            </div>
          )}

          {selectedPeople.size > 0 && (
            <Text color="fg.muted">
              {selectedPeople.size} person{selectedPeople.size === 1 ? '' : 's'} selected
            </Text>
          )}
        </div>
      )}

      {audienceType === 'preset' && (
        <Field.Root>
          <Field.Label>Preset</Field.Label>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">Select a preset...</option>
            {availablePresets.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </Field.Root>
      )}
    </Stack>
  )
}
