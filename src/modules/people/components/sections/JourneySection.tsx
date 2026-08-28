import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function JourneySection({ person }: { person: Person }) {
  return <ProfileSection title="Journey">{Object.entries(person.journey).map(([track, stage]) => <ProfileField key={track} label={track} value={stage} />)}</ProfileSection>
}
