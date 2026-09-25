import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session, User } from '@supabase/supabase-js'
import { AuthProvider, useAuth, type AuthContextValue } from '../index'

const sessionUser = { id: 'user-1', email: 'daniel@newlight.au' } as User
const session = { user: sessionUser } as Session

/** Resolvable handle so a test controls exactly when the profile query lands. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const getPersonByAuthUserId = vi.fn()
const getSession = vi.fn()
const unsubscribe = vi.fn()
// `onAuthStateChange` must be a spy so a test can capture the auth callback and
// simulate an account switch (SIGNED_IN for a different user).
const onAuthStateChange = vi.fn(
  (_callback: (event: string, session: Session | null) => void): {
    data: { subscription: { unsubscribe: () => void } }
  } => ({
    data: { subscription: { unsubscribe } },
  }),
)

vi.mock('@/core/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: (callback: never) => onAuthStateChange(callback),
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}))

// The provider only takes the real-auth path when these are truthy.
vi.mock('@/core/lib/runtime-config', () => ({
  getSupabaseUrl: () => 'https://test.supabase.co',
  getSupabaseAnonKey: () => 'test-anon-key',
  getSupabaseJwksUrl: () => undefined,
}))

vi.mock('@/core/auth/lib/queries', () => ({
  getPersonByAuthUserId: (id: string) => getPersonByAuthUserId(id),
}))

type Observed = Pick<AuthContextValue, 'user' | 'person' | 'isProfileLoading'>
let observed: Observed[] = []

function Probe() {
  const { user, person, isProfileLoading } = useAuth()
  observed.push({ user, person, isProfileLoading })
  return null
}

beforeEach(() => {
  observed = []
  unsubscribe.mockClear()
  onAuthStateChange.mockClear()
  getPersonByAuthUserId.mockReset()
  getSession.mockReset()
})

afterEach(() => {
  cleanup()
})

describe('AuthProvider profile-resolution state', () => {
  it('never reports a signed-in user as profile-loaded before the lookup runs', async () => {
    // The exact race that bounced super admins to /people: the session promise
    // resolves, React renders with `user` set, and the profile effect has not
    // run yet. A stored boolean flag reads `false` in that render.
    const profile = deferred<{ access_permission: string } | null>()
    getSession.mockResolvedValue({ data: { session } })
    getPersonByAuthUserId.mockReturnValue(profile.promise)

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    // Let the session resolve and effects flush; the profile query is still
    // in flight at this point.
    await act(async () => {})

    const withUser = observed.filter((state) => state.user !== null)
    expect(withUser.length).toBeGreaterThan(0)
    for (const state of withUser) {
      expect(state.isProfileLoading).toBe(true)
    }

    await act(async () => {
      profile.resolve({ access_permission: 'super_admin' })
      await profile.promise
    })

    const settled = observed[observed.length - 1]
    expect(settled.user).not.toBeNull()
    expect(settled.isProfileLoading).toBe(false)
    expect(settled.person).toEqual({ access_permission: 'super_admin' })
  })

  it('stays fail-closed when the profile lookup rejects, then releases the guard', async () => {
    getSession.mockResolvedValue({ data: { session } })
    getPersonByAuthUserId.mockRejectedValue(new Error('network down'))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await act(async () => {})

    const settled = observed[observed.length - 1]
    expect(settled.user).not.toBeNull()
    // Rejection is a resolution: the guard must not spin forever.
    expect(settled.isProfileLoading).toBe(false)
    expect(settled.person).toBeNull()
  })

  it('reports no pending profile when there is no session', async () => {
    getSession.mockResolvedValue({ data: { session: null } })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await act(async () => {})

    const settled = observed[observed.length - 1]
    expect(settled.user).toBeNull()
    expect(settled.isProfileLoading).toBe(false)
    expect(getPersonByAuthUserId).not.toHaveBeenCalled()
  })

  it('re-enters the loading state when the signed-in user changes', async () => {
    const otherUser = { id: 'user-2', email: 'other@newlight.au' } as User
    getSession.mockResolvedValue({ data: { session } })
    getPersonByAuthUserId.mockResolvedValue({ access_permission: 'super_admin' })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await act(async () => {})

    // The provider registered its auth listener; grab the callback to switch
    // accounts. The previous user's stamp must not make the new user look loaded.
    const callback = onAuthStateChange.mock.calls[0][0] as unknown as (
      event: string,
      next: Session | null,
    ) => void
    expect(callback).toBeTypeOf('function')

    await act(async () => {
      callback('SIGNED_IN', { user: otherUser } as Session)
    })

    const withOther = observed.filter((state) => state.user?.id === 'user-2')
    expect(withOther.length).toBeGreaterThan(0)
    // While the new user's row is in flight, fail closed.
    expect(withOther[0].isProfileLoading).toBe(true)
  })
})
