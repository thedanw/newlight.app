import type { Person, PersonPublic } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function ConsentsSection({ person }: { person: Person | PersonPublic }) {
  const p = person as Person
  return <ProfileSection title="Consents"><ProfileField label="External photo" value={p.consent_external_photo ?? null} /><ProfileField label="Internal photo" value={p.consent_internal_photo ?? null} /><ProfileField label="Biscuit under five" value={p.consent_biscuit_under5 ?? null} /><ProfileField label="Girl Guide off-site" value={p.consent_girl_guide_offsite ?? null} /></ProfileSection>
}
