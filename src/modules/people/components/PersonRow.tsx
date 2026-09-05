import { useNavigate } from 'react-router-dom'
import { Link, Badge, Table } from '@/core/ui'
import type { PersonWithJourney } from '../lib/types'

type PersonRowProps = {
  person: PersonWithJourney
}

export function PersonRow({ person }: PersonRowProps) {
  const navigate = useNavigate()
  const displayName = person.preferred_name
    ? `${person.preferred_name} ${person.lastname}`
    : `${person.firstname} ${person.lastname}`
  const primaryStage = Object.values(person.journey)[0]

  const openProfile = () => navigate(`/people/${person.id}`)

  return (
    <Table.Row
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openProfile()
        }
      }}
    >
      <Table.Cell>
        <Link href={`/people/${person.id}`} onClick={(event) => event.stopPropagation()}>{displayName}</Link>
      </Table.Cell>
      <Table.Cell>
        <Badge colorPalette={person.demographic === 'adult' ? 'blue' : person.demographic === 'youth' ? 'orange' : 'green'}>
          {person.demographic}
        </Badge>
      </Table.Cell>
      <Table.Cell>{primaryStage ?? 'Archived'}</Table.Cell>
      <Table.Cell>{person.household?.name ?? 'No household'}</Table.Cell>
      <Table.Cell>{person.email ?? 'No email'}</Table.Cell>
    </Table.Row>
  )
}
