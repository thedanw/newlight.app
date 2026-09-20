import type { Tables } from '@/core/lib/database.types'

type Person = Tables<'people'>
type AccessPermission = Person['access_permission']

/**
 * Settings surfaces (nav tile, /settings routes, platform_settings writes)
 * are restricted to super admins (audit REQ-2 / remediation 1.6–1.7).
 * Pure helpers so the guard and the sidebar share one definition and the
 * logic is unit-testable without React.
 */
export function isSuperAdminPermission(permission: AccessPermission | null | undefined): boolean {
  return permission === 'super_admin'
}

/**
 * Sidebar Settings tile visibility: fail closed — hidden while the linked
 * person profile is loading and for anyone who is not a resolved super admin.
 */
export function isSettingsTileVisible(
  person: Person | null | undefined,
  isProfileLoading: boolean,
): boolean {
  return !isProfileLoading && isSuperAdminPermission(person?.access_permission)
}
