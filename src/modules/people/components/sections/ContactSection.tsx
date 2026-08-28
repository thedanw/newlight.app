import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function ContactSection({ person }: { person: Person }) {
  return <ProfileSection title="Contact"><ProfileField label="Email" value={person.email} /><ProfileField label="Mobile" value={person.mobile} /></ProfileSection>
}
