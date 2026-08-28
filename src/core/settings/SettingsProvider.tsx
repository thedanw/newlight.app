'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/core/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

/**
 * SettingsProvider — React context exposing Supabase client + session.
 * 
 * In the lab (no auth), provides a mock/fallback session.
 * In the final app, uses real Supabase auth session.
 */
interface SettingsContextValue {
  supabase: typeof supabase
  session: Session | null
  user: User | null
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In the lab, we don't have real auth — provide a mock session
    // In production, this would use supabase.auth.getSession() and onAuthStateChange
    
    // Check if we have real Supabase env vars
    const hasRealAuth = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (hasRealAuth) {
      // Real auth path
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
    } else {
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
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ supabase, session, user, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}