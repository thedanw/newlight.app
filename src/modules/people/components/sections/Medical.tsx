import type { Person, PersonPublic } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function MedicalSection({ person }: { person: Person | PersonPublic }) {
  const p = person as Person
  return <ProfileSection title="Medical"><ProfileField label="Anaphylaxis or allergy" value={p.medical_anaphylaxis_allergy ?? null} /><ProfileField label="Other medical or behavioral information" value={p.medical_other_behavioral ?? null} /><ProfileField label="Regular medication" value={p.medical_regular_medication ?? null} /></ProfileSection>
}
