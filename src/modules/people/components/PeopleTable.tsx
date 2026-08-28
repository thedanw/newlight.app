import { Skeleton, Table, Text } from '@/core/ui'
import type { PersonWithJourney } from '../lib/types'
import { PersonRow } from './PersonRow'

type PeopleTableProps = {
  people: PersonWithJourney[]
  loading: boolean
}

export function PeopleTable({ people, loading }: PeopleTableProps) {
  return (
    <Table.Root interactive>
      <Table.Head>
        <Table.Row>
          <Table.Header>Name</Table.Header>
          <Table.Header>Demographic</Table.Header>
          <Table.Header>Journey</Table.Header>
          <Table.Header>Household</Table.Header>
          <Table.Header>Contact</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Table.Row key={index}>
              <Table.Cell colSpan={5}><Skeleton height="4" /></Table.Cell>
            </Table.Row>
          ))
        ) : people.length === 0 ? (
          <Table.Row><Table.Cell colSpan={5}><Text color="fg.muted">No people found.</Text></Table.Cell></Table.Row>
        ) : (
          people.map((person) => <PersonRow key={person.id} person={person} />)
        )}
      </Table.Body>
    </Table.Root>
  )
}
