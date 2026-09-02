import { useMemo, useState } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Field, Heading, Page, Select, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { useJourneyGrid } from '../lib/hooks'
import { JourneyGrid } from '../components/JourneyGrid'
import { PageSkeleton } from '../components/PageSkeleton'
import { updatePersonJourney } from '../lib/queries'

export default function JourneyGridPage() {
  const { data, loading, error } = useJourneyGrid()
  const [updatedJourneys, setUpdatedJourneys] = useState<Record<string, Record<string, string>>>({})
  const [demographic, setDemographic] = useState('all')
  const [tag, setTag] = useState('all')
  const [message, setMessage] = useState<string | null>(null)
  const tags = data ? [...new Map(Object.values(data.tagsByPerson).flat().map((item) => [item.id, item])).values()] : []
  const visibleGrid = data ? { ...data, people: data.people.map((person) => ({ ...person, journey: updatedJourneys[person.id] ?? person.journey })).filter((person) => (demographic === 'all' || person.demographic === demographic) && (tag === 'all' || data.tagsByPerson[person.id]?.some((item) => item.id === tag))) } : null

  const demographicCollection = useMemo(() => createListCollection({
    items: [
      { label: 'All', value: 'all' },
      { label: 'Adults', value: 'adult' },
      { label: 'Youth', value: 'youth' },
      { label: 'Children', value: 'child' },
    ]
  }), [])

  const tagCollection = useMemo(() => createListCollection({
    items: [{ label: 'All', value: 'all' }, ...tags.map((item) => ({ label: item.name, value: item.id }))]
  }), [tags])

  const handleStageChange = async (personId: string, trackId: string, stage: string) => {
    if (!data) return
    const person = data.people.find((item) => item.id === personId)
    if (!person) return
    const nextJourney = { ...person.journey, [trackId]: stage }
    try { await updatePersonJourney(personId, nextJourney); setUpdatedJourneys((current) => ({ ...current, [personId]: nextJourney })); setMessage('Stage updated.') } catch (updateError) { setMessage(updateError instanceof Error ? updateError.message : 'Unable to update stage.') }
  }
  return (
    <>
      <Page.Header>
        <Heading>Journey</Heading>
      </Page.Header>
      <Page.Body>
        <Stack gap="6">
          <Stack flexDirection="row" gap="4">
            <Field.Root>
              <Field.Label>Demographic</Field.Label>
              <Select.Root collection={demographicCollection} value={[demographic]} onValueChange={(details) => setDemographic(details.value[0])}>
                <Select.Control>
                  <Select.Trigger><Select.ValueText placeholder="All" /><Select.Indicator /></Select.Trigger>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {demographicCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>Tag</Field.Label>
              <Select.Root collection={tagCollection} value={[tag]} onValueChange={(details) => setTag(details.value[0])}>
                <Select.Control>
                  <Select.Trigger><Select.ValueText placeholder="All" /><Select.Indicator /></Select.Trigger>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {tagCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Field.Root>
          </Stack>
          {message && <Text>{message}</Text>}
          {loading && <PageSkeleton />}
          {error && <Text>{error.message}</Text>}
          {!loading && !error && visibleGrid && <JourneyGrid grid={visibleGrid} onStageChange={handleStageChange} />}
        </Stack>
      </Page.Body>
    </>
  )
}
