import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function PersonalSection({ person }: { person: Person }) {
  return <ProfileSection title="Personal"><ProfileField label="First name" value={person.firstname} /><ProfileField label="Middle name" value={person.middle_name} /><ProfileField label="Last name" value={person.lastname} /><ProfileField label="Preferred name" value={person.preferred_name} /><ProfileField label="Gender" value={person.gender} /><ProfileField label="Date of birth" value={person.date_of_birth} /><ProfileField label="Marital status" value={person.marital_status} /></ProfileSection>
}
