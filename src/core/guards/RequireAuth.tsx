import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/core/auth'

/**
 * RequireAuth — route guard for every authenticated surface (audit 1.3/H1).
 * Fail closed: renders nothing while the Supabase session is still restoring,
 * and sends signed-out visitors to /login with the originally requested path
 * stashed in `location.state.from` — LoginPage returns them to it after
 * sign-in, so deep links survive a refresh while signed out.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
