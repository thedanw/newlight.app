import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function MedicalSection({ person }: { person: Person }) {
  return <ProfileSection title="Medical"><ProfileField label="Anaphylaxis or allergy" value={person.medical_anaphylaxis_allergy} /><ProfileField label="Other medical or behavioral information" value={person.medical_other_behavioral} /><ProfileField label="Regular medication" value={person.medical_regular_medication} /></ProfileSection>
}
