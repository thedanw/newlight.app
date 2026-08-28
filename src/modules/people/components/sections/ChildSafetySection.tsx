import type { Person } from '../../lib/types'
import { ProfileField, ProfileSection } from './ProfileSection'

export function ChildSafetySection({ person }: { person: Person }) {
  return <ProfileSection title="Child safety"><ProfileField label="Safe ministry role" value={person.safe_ministry_leader_type} /><ProfileField label="WWCC expiry" value={person.wwcc_expiry_date} /><ProfileField label="WWCC outcome" value={person.wwcc_verification_outcome} /><ProfileField label="SMT completion" value={person.smt_completion_date} /><ProfileField label="SMC result" value={person.smc_result} /></ProfileSection>
}
