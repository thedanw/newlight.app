import { Card, Skeleton, Table, Text } from '@/core/ui'
import type { PersonPublic, PersonWithJourney } from '../../lib/types'
import { PersonRow } from './Row'

type PeopleTableProps = {
  people: (PersonWithJourney | PersonPublic)[]
  loading: boolean
  isPublic?: boolean
}

export function PeopleTable({ people, loading, isPublic = false }: PeopleTableProps) {
  return (
    <Card.Root>
      <Card.Body>
        <Table.Root interactive>
          <Table.Head>
            <Table.Row>
              <Table.Header>Name</Table.Header>
              <Table.Header>Demographic</Table.Header>
              {!isPublic && <Table.Header>Journey</Table.Header>}
              {!isPublic && <Table.Header>Household</Table.Header>}
              {!isPublic && <Table.Header>Contact</Table.Header>}
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Table.Row key={index}>
                  <Table.Cell colSpan={isPublic ? 2 : 5}><Skeleton height="4" /></Table.Cell>
                </Table.Row>
              ))
            ) : people.length === 0 ? (
              <Table.Row><Table.Cell colSpan={isPublic ? 2 : 5}><Text color="fg.muted">No people found.</Text></Table.Cell></Table.Row>
            ) : (
              people.map((person) => <PersonRow key={person.id} person={person} isPublic={isPublic} />)
            )}
          </Table.Body>
        </Table.Root>
      </Card.Body>
    </Card.Root>
  )
}
