import { supabase } from '@/core/lib/supabase'
import { useAsyncQuery } from './hooks'
import { getCurrentOperatorPermission } from './queries'
import type { Person } from './types'

/** What a viewer (operator or self) is allowed to do on a person profile. */
export type ProfilePermissions = {
  isAdmin: boolean
  isSelf: boolean
  /** Can edit basic profile fields (name, email, demographics, contact). */
  canEdit: boolean
  /** Can manage tags on this person. */
  canManageTags: boolean
  /** Can edit journey stage inline. */
  canManageJourney: boolean
  /** Can add/view/manage guardians. */
  canManageGuardians: boolean
  /** Can edit child-safety fields (WWCC, SMT, SMC). */
  canEditChildSafety: boolean
  /** Can edit admin-only fields (access_permission, date_professed, legacy_*). */
  canEditAdminFields: boolean
  /** Can soft-delete this person. */
  canDelete: boolean
  /** Still loading operator permission or auth user. */
  loading: boolean
}

/**
 * Pure permission derivation.
 *
 * `isSelf` must be computed externally by comparing the viewer's
 * auth user id to the viewed person's `auth_user_id`.
 */
export function deriveProfilePermissions(
  operatorPermission: Person['access_permission'] | null,
  isSelf: boolean,
): Omit<ProfilePermissions, 'loading'> {
  const isAdmin = operatorPermission === 'admin' || operatorPermission === 'super_admin'
  return {
    isAdmin,
    isSelf,
    canEdit: isAdmin || isSelf,
    canManageTags: isAdmin,
    canManageJourney: isAdmin,
    canManageGuardians: isAdmin,
    canEditChildSafety: isAdmin,
    canEditAdminFields: isAdmin,
    canDelete: isAdmin && !isSelf,
  }
}

async function getCurrentAuthUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * Hook version — fetches the operator's permission + auth user id, compares
 * to the given person's `auth_user_id` for self-view detection, and returns
 * the full permission set including `loading`.
 */
export function useProfilePermissions(person: Pick<Person, 'id' | 'auth_user_id'> | null): ProfilePermissions {
  const operatorResult = useAsyncQuery(getCurrentOperatorPermission, 'current-operator-permission')
  const authUserResult = useAsyncQuery(getCurrentAuthUserId, 'current-auth-user')

  const loading = operatorResult.loading || authUserResult.loading
  if (loading || !person) {
    return {
      isAdmin: false, isSelf: false, canEdit: false, canManageTags: false,
      canManageJourney: false, canManageGuardians: false, canEditChildSafety: false,
      canEditAdminFields: false, canDelete: false, loading,
    }
  }

  const authUserId = authUserResult.data ?? null
  const isSelf = person.auth_user_id === authUserId && authUserId !== null
  return { ...deriveProfilePermissions(operatorResult.data ?? null, isSelf), loading }
}
