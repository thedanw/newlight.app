import { useState } from 'react'
import { Field, PageHeader, Heading, Text } from '@/core/ui'
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
  const handleStageChange = async (personId: string, trackId: string, stage: string) => {
    if (!data) return
    const person = data.people.find((item) => item.id === personId)
    if (!person) return
    const nextJourney = { ...person.journey, [trackId]: stage }
    try { await updatePersonJourney(personId, nextJourney); setUpdatedJourneys((current) => ({ ...current, [personId]: nextJourney })); setMessage('Stage updated.') } catch (updateError) { setMessage(updateError instanceof Error ? updateError.message : 'Unable to update stage.') }
  }
  return (
    <>
      <PageHeader>
        <Heading>Journey</Heading>
      </PageHeader>
      <main>
        <Field.Root><Field.Label>Demographic</Field.Label><select value={demographic} onChange={(event) => setDemographic(event.target.value)}><option value="all">All</option><option value="adult">Adults</option><option value="youth">Youth</option><option value="child">Children</option></select></Field.Root>
        <Field.Root><Field.Label>Tag</Field.Label><select value={tag} onChange={(event) => setTag(event.target.value)}><option value="all">All</option>{tags.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field.Root>
        {message && <Text>{message}</Text>}
        {loading && <PageSkeleton />}
        {error && <Text>{error.message}</Text>}
        {!loading && !error && visibleGrid && <JourneyGrid grid={visibleGrid} onStageChange={handleStageChange} />}
      </main>
    </>
  )
}
