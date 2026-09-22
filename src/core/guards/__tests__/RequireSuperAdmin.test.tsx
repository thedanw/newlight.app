import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session, User } from '@supabase/supabase-js'
import { RequireSuperAdmin } from '../RequireSuperAdmin'
import { useAuth } from '@/core/auth'

vi.mock('@/core/auth', () => ({
  useAuth: vi.fn(),
}))

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

type Person = { access_permission: string | null }

function mockAuth(options: {
  user: User | null
  isLoading: boolean
  person: Person | null
  isProfileLoading: boolean
}) {
  vi.mocked(useAuth).mockReturnValue({
    supabase: {} as never,
    session: (options.user ? { user: options.user } : null) as Session | null,
    user: options.user,
    isLoading: options.isLoading,
    person: options.person as never,
    isProfileLoading: options.isProfileLoading,
    initials: '',
    displayName: '',
    firstName: '',
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updatePassword: vi.fn(),
  })
}

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route
          path="/settings"
          element={
            <RequireSuperAdmin>
              <div data-testid="settings-content">settings</div>
            </RequireSuperAdmin>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
        <Route path="/people" element={<div data-testid="people-landing">people</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const user = { id: 'u1' } as User

describe('RequireSuperAdmin', () => {
  it('redirects a signed-out visitor to /login', () => {
    mockAuth({ user: null, isLoading: false, person: null, isProfileLoading: false })
    renderGuard()
    expect(screen.getByTestId('login-page')).toBeTruthy()
    expect(screen.queryByTestId('settings-content')).toBeNull()
  })

  it('renders nothing while auth is loading (fail closed)', () => {
    mockAuth({ user, isLoading: true, person: null, isProfileLoading: false })
    const { container } = renderGuard()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing while the linked person profile is loading (fail closed)', () => {
    mockAuth({ user, isLoading: false, person: null, isProfileLoading: true })
    const { container } = renderGuard()
    expect(container.innerHTML).toBe('')
  })

  it('redirects a signed-in plain member to the /people landing (no login hop)', () => {
    mockAuth({
      user,
      isLoading: false,
      person: { access_permission: 'member_area' },
      isProfileLoading: false,
    })
    renderGuard()
    expect(screen.getByTestId('people-landing')).toBeTruthy()
    expect(screen.queryByTestId('login-page')).toBeNull()
    expect(screen.queryByTestId('settings-content')).toBeNull()
  })

  it('redirects a signed-in admin to the /people landing (settings are super-admin only)', () => {
    mockAuth({
      user,
      isLoading: false,
      person: { access_permission: 'admin' },
      isProfileLoading: false,
    })
    renderGuard()
    expect(screen.getByTestId('people-landing')).toBeTruthy()
    expect(screen.queryByTestId('login-page')).toBeNull()
  })

  it('renders the settings subtree for a resolved super admin', () => {
    mockAuth({
      user,
      isLoading: false,
      person: { access_permission: 'super_admin' },
      isProfileLoading: false,
    })
    renderGuard()
    expect(screen.getByTestId('settings-content')).toBeTruthy()
    expect(screen.queryByTestId('login-page')).toBeNull()
  })
})
