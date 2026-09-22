import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session, User } from '@supabase/supabase-js'
import { RequireAuth } from '../RequireAuth'
import { useAuth } from '@/core/auth'

vi.mock('@/core/auth', () => ({
  useAuth: vi.fn(),
}))

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

function mockAuth(options: { user: User | null; isLoading: boolean }) {
  vi.mocked(useAuth).mockReturnValue({
    supabase: {} as never,
    session: (options.user ? { user: options.user } : null) as Session | null,
    user: options.user,
    isLoading: options.isLoading,
    person: null,
    isProfileLoading: false,
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

function renderGuard(initialPath = '/people/abc') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/people/abc"
          element={
            <RequireAuth>
              <div data-testid="protected-content">protected</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const user = { id: 'u1' } as User

describe('RequireAuth', () => {
  it('renders nothing while the session is restoring (fail closed)', () => {
    mockAuth({ user: null, isLoading: true })
    const { container } = renderGuard()
    expect(container.innerHTML).toBe('')
  })

  it('redirects a signed-out visitor to /login', () => {
    mockAuth({ user: null, isLoading: false })
    renderGuard()
    expect(screen.getByTestId('login-page')).toBeTruthy()
    expect(screen.queryByTestId('protected-content')).toBeNull()
  })

  it('renders the protected subtree for a signed-in user', () => {
    mockAuth({ user, isLoading: false })
    renderGuard()
    expect(screen.getByTestId('protected-content')).toBeTruthy()
    expect(screen.queryByTestId('login-page')).toBeNull()
  })
})
