import { Badge, Heading, Link, Text } from '@/core/ui'
import type { Person } from '../lib/types'

export function HouseholdMembers({ members }: { members: Person[] }) {
  return (
    <section aria-labelledby="household-members-heading">
      <Heading id="household-members-heading">Members</Heading>
      {members.length === 0 ? <Text>No household members found.</Text> : members.map((person) => {
        const name = person.preferred_name ? `${person.preferred_name} ${person.lastname}` : `${person.firstname} ${person.lastname}`
        return (
          <p key={person.id}>
            <Link href={`/people/${person.id}`}>{name}</Link>{' '}
            <Badge colorPalette={person.demographic === 'adult' ? 'blue' : person.demographic === 'youth' ? 'orange' : 'green'}>{person.demographic}</Badge>
          </p>
        )
      })}
    </section>
  )
}