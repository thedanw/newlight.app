import { Link, Text } from '@/core/ui'
import type { JourneyStage, Person } from '../lib/types'

type JourneyGridCellProps = {
  people: Person[]
  trackId: string
  stages: JourneyStage[]
  onStageChange: (person: Person, stage: string) => Promise<void>
}

export function JourneyGridCell({ people, trackId, stages, onStageChange }: JourneyGridCellProps) {
  return <>
    {people.length ? people.map((person) => <div key={person.id}>
      <Link href={`/people/${person.id}`}>{person.preferred_name || person.firstname} {person.lastname}</Link>
      <select aria-label={`Stage for ${person.firstname} ${person.lastname}`} value={person.journey[trackId] ?? ''} onChange={(event) => onStageChange(person, event.target.value)}>
        {stages.map((stage) => <option key={stage.slug} value={stage.slug}>{stage.label}</option>)}
      </select>
    </div>) : <Text>-</Text>}
  </>
}