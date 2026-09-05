import { useMemo } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Link, Select, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import type { JourneyStage, Person } from '../lib/types'

type JourneyGridCellProps = {
  people: Person[]
  trackId: string
  stages: JourneyStage[]
  onStageChange: (person: Person, stage: string) => Promise<void>
}

export function JourneyGridCell({ people, trackId, stages, onStageChange }: JourneyGridCellProps) {
  const stageCollection = useMemo(() => createListCollection({
    items: stages.map((stage) => ({ label: stage.label, value: stage.slug }))
  }), [stages])

  return <>
    {people.length ? people.map((person) => {
      const current = person.journey[trackId] ?? ''
      return (
        <Stack key={person.id} gap="1">
          <Link href={`/people/${person.id}`}>{person.preferred_name || person.firstname} {person.lastname}</Link>
          <Select.Root collection={stageCollection} value={[current]} onValueChange={(details) => onStageChange(person, details.value[0])}>
            <Select.Control>
              <Select.Trigger aria-label={`Stage for ${person.firstname} ${person.lastname}`}><Select.ValueText placeholder="Select stage" /><Select.Indicator /></Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {stageCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Stack>
      )
    }) : <Text>-</Text>}
  </>
}