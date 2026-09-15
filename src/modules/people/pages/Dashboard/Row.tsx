import { useNavigate } from 'react-router-dom'
import { Link, Badge, Table } from '@/core/ui'
import type { PersonPublic, PersonWithJourney } from '../../lib/types'

type PersonRowProps = {
  person: PersonWithJourney | PersonPublic
  isPublic?: boolean
}

function isPersonPublic(person: PersonWithJourney | PersonPublic): person is PersonPublic {
  return 'lastname_initial' in person
}

export function PersonRow({ person, isPublic = false }: PersonRowProps) {
  const navigate = useNavigate()

  let displayName: string
  if (isPublic && isPersonPublic(person)) {
    displayName = `${person.firstname} ${person.lastname_initial ?? ''}`.trim() || 'Hidden'
  } else {
    const fullPerson = person as PersonWithJourney
    displayName = fullPerson.preferred_name
      ? `${fullPerson.preferred_name} ${fullPerson.lastname}`
      : `${fullPerson.firstname} ${fullPerson.lastname}`
  }

  const isPublicPerson = isPublic && isPersonPublic(person)
  const primaryStage = !isPublicPerson && 'journey' in person ? Object.values((person as PersonWithJourney).journey)[0] : undefined

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
      {!isPublicPerson && <Table.Cell>{primaryStage ?? 'Archived'}</Table.Cell>}
      {!isPublicPerson && <Table.Cell>{(person as PersonWithJourney).household?.name ?? 'No household'}</Table.Cell>}
      {!isPublicPerson && <Table.Cell>{(person as PersonWithJourney).email ?? 'No email'}</Table.Cell>}
    </Table.Row>
  )
}
