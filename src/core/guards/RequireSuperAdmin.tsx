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

  if (!user || !isSuperAdminPermission(person?.access_permission)) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
