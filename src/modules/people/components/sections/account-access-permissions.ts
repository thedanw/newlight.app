import type { Person } from '../../lib/types'
type AP = Person['access_permission']
export function isAccessCardVisible(op: AP | null | undefined, s: boolean) {
  if (s) return true
  return op === 'team_leaders' || op === 'admin' || op === 'super_admin'
}
export function canChangePassword(op: AP | null | undefined, s: boolean) {
  if (s) return true
  return op === 'admin' || op === 'super_admin'
}
export function canSendMagicLink(op: AP | null | undefined) {
  return op === 'team_leaders' || op === 'admin' || op === 'super_admin'
}
export function canEditRole(op: AP | null | undefined) {
  return op === 'admin' || op === 'super_admin'
}
