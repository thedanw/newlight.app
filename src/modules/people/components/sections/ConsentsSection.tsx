import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function ConsentsSection({ person }: { person: Person }) {
  return <ProfileSection title="Consents"><ProfileField label="External photo" value={person.consent_external_photo} /><ProfileField label="Internal photo" value={person.consent_internal_photo} /><ProfileField label="Biscuit under five" value={person.consent_biscuit_under5} /><ProfileField label="Girl Guide off-site" value={person.consent_girl_guide_offsite} /></ProfileSection>
}
