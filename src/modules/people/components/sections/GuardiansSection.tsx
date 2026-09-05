import type { Person } from '../../lib/types'
import { Link } from '@/core/ui'
import { ProfileField, ProfileSection } from './ProfileSection'

export function GuardiansSection({ person }: { person: Person }) {
  return (
    <ProfileSection title="Guardians">
      <ProfileField label="Household" value={person.household_id ? <Link href={`/people/households/${person.household_id}`}>{person.household_id}</Link> : null} />
      <ProfileField label="Primary contact" value={person.email ?? 'Not provided'} />
      <ProfileField label="Guardian relationships" value="Linked guardians will appear here once the relationship data is available." />
    </ProfileSection>
  )
}
