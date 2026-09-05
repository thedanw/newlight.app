'use client'
import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/core/lib/supabase'
import type { AuthError, Session, User } from '@supabase/supabase-js'

/**
 * AuthContextValue — session + auth actions owned by AuthProvider.
 * SettingsProvider consumes this (single source of truth, decision #9).
 */
export interface AuthContextValue {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  isLoading: boolean
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

  useEffect(() => {
    const hasRealAuth = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY

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