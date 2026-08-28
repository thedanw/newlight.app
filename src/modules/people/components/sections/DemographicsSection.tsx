import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function DemographicsSection({ person }: { person: Person }) {
  const schoolYear = person.kindy_start_year ? new Date().getFullYear() - person.kindy_start_year : null
  return <ProfileSection title="Demographics"><ProfileField label="Demographic" value={person.demographic} /><ProfileField label="School" value={person.school_name} /><ProfileField label="School year" value={schoolYear === null ? null : schoolYear === 0 ? 'Kindy' : `Year ${schoolYear}`} /><ProfileField label="School email permission" value={person.school_email_permission} /></ProfileSection>
}
