import { Card, Table, Text } from '@/core/ui'
import type { JourneyGrid as JourneyGridData } from '../lib/types'
import { JourneyGridCell } from './JourneyGridCell'

export function JourneyGrid({ grid, onStageChange }: { grid: JourneyGridData; onStageChange: (personId: string, trackId: string, stage: string) => Promise<void> }) {
  if (grid.tracks.length === 0) {
    return <Text color="fg.muted">No journey tracks configured yet. Add tracks in Journey settings.</Text>
  }
  return (
    <Card.Root>
      <Card.Body>
        <Table.Root>
          <Table.Head><Table.Row><Table.Header>Track</Table.Header>{grid.stages.map((stage) => <Table.Header key={stage.slug}>{stage.label}</Table.Header>)}<Table.Header>Total</Table.Header></Table.Row></Table.Head>
          <Table.Body>
            {grid.tracks.map((track) => <Table.Row key={track.id}>
              <Table.Cell><Text>{track.name}</Text></Table.Cell>
              {grid.stages.map((stage) => {
                const people = grid.people.filter((person) => person.journey[track.id] === stage.slug)
                return <Table.Cell key={stage.slug}><JourneyGridCell people={people} trackId={track.id} stages={grid.stages} onStageChange={(person, nextStage) => onStageChange(person.id, track.id, nextStage)} /></Table.Cell>
              })}
              <Table.Cell><Text>{grid.people.filter((person) => person.journey[track.id]).length}</Text></Table.Cell>
            </Table.Row>)}
          </Table.Body>
          <Table.Foot><Table.Row><Table.Header>Total</Table.Header>{grid.stages.map((stage) => <Table.Cell key={stage.slug}><Text>{grid.people.filter((person) => Object.values(person.journey).includes(stage.slug)).length}</Text></Table.Cell>)}<Table.Cell><Text>{grid.people.reduce((total, person) => total + Object.keys(person.journey).length, 0)}</Text></Table.Cell></Table.Row></Table.Foot>
        </Table.Root>
      </Card.Body>
    </Card.Root>
  )
}