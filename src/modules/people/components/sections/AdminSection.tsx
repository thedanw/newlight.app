import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function AdminSection({ person }: { person: Person }) {
  return <ProfileSection title="Admin"><ProfileField label="Access permission" value={person.access_permission} /><ProfileField label="Date professed" value={person.date_professed} /><ProfileField label="Legacy member id" value={person.legacy_member_id} /></ProfileSection>
}
