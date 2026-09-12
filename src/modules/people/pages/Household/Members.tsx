import { Badge, Card, Link, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import type { Person } from '../lib/types'

export function HouseholdMembers({ members }: { members: Person[] }) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Members</Card.Title>
      </Card.Header>
      <Card.Body>
        {members.length === 0 ? <Text>No household members found.</Text> : members.map((person) => {
          const name = person.preferred_name ? `${person.preferred_name} ${person.lastname}` : `${person.firstname} ${person.lastname}`
          return (
            <Stack key={person.id} flexDirection="row" gap="2" alignItems="center">
              <Link href={`/people/${person.id}`}>{name}</Link>
              <Badge colorPalette={person.demographic === 'adult' ? 'blue' : person.demographic === 'youth' ? 'orange' : 'green'}>{person.demographic}</Badge>
            </Stack>
          )
        })}
      </Card.Body>
    </Card.Root>
  )
}