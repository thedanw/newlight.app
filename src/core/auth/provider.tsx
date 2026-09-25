'use client'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/core/lib/supabase'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/core/lib/runtime-config'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import type { Tables } from '@/core/lib/database.types'
import { getPersonByAuthUserId } from './lib/queries'
import { getInitials, getDisplayName, getFirstName } from './lib/name'

/**
 * AuthContextValue — session + auth actions owned by AuthProvider.
 * SettingsProvider consumes this (single source of truth, decision #9).
 */
export interface AuthContextValue {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  isLoading: boolean
  /** Linked people row (null if auth user has no person record). */
  person: Tables<'people'> | null
  isProfileLoading: boolean
  /** Initials for the account avatar (first+last, fallback user_metadata/email). */
  initials: string
  /** Display name for the account tile (preferred_name ?? firstname, fallback). */
  displayName: string
  /** First name for the account tile label (fallback user_metadata/email). */
  firstName: string
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * AuthProvider — owns the Supabase session lifecycle (getSession +
 * onAuthStateChange) and exposes auth actions. Falls back to a lab mock
 * session when Supabase env vars are absent (decision #10).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [person, setPerson] = useState<Tables<'people'> | null>(null)
  /**
   * Id of the auth user whose linked people row has finished loading.
   * `null` until the first lookup settles. This is deliberately a *user id*
   * rather than a boolean: a stored `isProfileLoading` flag publishes
   * `false` for the one render between "session resolved" and "profile
   * effect ran", which let route guards treat a super admin as unprivileged
   * and redirect them to /people on every hard load of a guarded URL.
   * `null` is an id no session can have, so the comparison below can never
   * accidentally report "resolved" before the query has run.
   */
  const [profileResolvedForUserId, setProfileResolvedForUserId] = useState<string | null>(null)

  /**
   * Derived, not stored: a profile is still loading whenever there is a
   * signed-in user whose people row we have not resolved yet. Fails closed
   * for the very first render where `user` is set.
   */
  const isProfileLoading = user !== null && profileResolvedForUserId !== user.id

  useEffect(() => {
    const hasRealAuth = getSupabaseUrl() && getSupabaseAnonKey()

    if (hasRealAuth) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }

    // Lab mock/fallback — anonymous session
    const mockSession: Session = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: 'lab-user',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'lab@newlight.app',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    }
    setSession(mockSession)
    setUser(mockSession.user)
    setIsLoading(false)
  }, [])

  // Load linked person profile whenever the auth user changes. Resolving the
  // lookup stamps the user id it belongs to, which is what clears
  // `isProfileLoading` (derived above) — the stamp is what makes the "session
  // resolved but profile not yet queried" render fail closed instead of
  // letting guards treat the user as unprivileged.
  useEffect(() => {
    if (!user) {
      setPerson(null)
      return
    }
    const userId = user.id
    let cancelled = false
    getPersonByAuthUserId(userId)
      .then((p) => {
        if (cancelled) return
        setPerson(p)
        setProfileResolvedForUserId(userId)
      })
      .catch(() => {
        if (cancelled) return
        // A lookup failure is a resolution too: stop the guard spinning
        // forever, and let it apply the "no linked profile" policy.
        setPerson(null)
        setProfileResolvedForUserId(userId)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const initials = getInitials({
    firstname: person?.firstname,
    lastname: person?.lastname,
    user_metadata: user?.user_metadata,
    email: user?.email,
  })
  const displayName = getDisplayName({
    preferred_name: person?.preferred_name,
    firstname: person?.firstname,
    user_metadata: user?.user_metadata,
    email: user?.email,
  })
  const firstName = getFirstName({
    firstname: person?.firstname,
    user_metadata: user?.user_metadata,
    email: user?.email,
  })

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        supabase,
        session,
        user,
        isLoading,
        person,
        isProfileLoading,
        initials,
        displayName,
        firstName,
        signInWithPassword,
        signInWithOtp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}