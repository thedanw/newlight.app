import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/core/auth'
import { isSuperAdminPermission } from '@/core/auth/lib/permissions'

/**
 * RequireSuperAdmin — route guard for the settings surfaces (audit REQ-2 /
 * remediation 1.7). Fail closed: renders nothing while auth or the linked
 * person profile is still resolving, and redirects everyone who is not a
 * resolved super admin to /login (signed-out users included).
 */
export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading, person, isProfileLoading } = useAuth()
  const location = useLocation()

  if (isLoading || isProfileLoading) return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Signed in but not a super admin: sending them to /login is pointless —
  // LoginPage immediately bounces any signed-in user onward (to /people), so
  // go straight to the landing page instead. Deep links for super admins
  // fall through to `children` and render in place.
  if (!isSuperAdminPermission(person?.access_permission)) {
    return <Navigate to="/people" replace />
  }

  return <>{children}</>
}
