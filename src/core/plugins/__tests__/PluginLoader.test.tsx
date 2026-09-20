import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { PluginLoader } from '../PluginLoader'
import { pluginManager } from '../pluginManager'
import { useAuth } from '@/core/auth'

vi.mock('../pluginManager', () => ({
  pluginManager: {
    init: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    getPlugins: vi.fn(() => []),
    loadAll: vi.fn(),
    unloadAll: vi.fn(),
    isLoaded: vi.fn(() => false),
    enable: vi.fn(),
    disable: vi.fn(),
  },
}))

vi.mock('../PluginAPI', () => ({
  PluginProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="plugin-provider">{children}</div>
  ),
}))

vi.mock('@/core/auth', () => ({
  useAuth: vi.fn(),
}))

const supabase = {} as never
const session = { user: { id: 'u1' } } as Session

beforeEach(() => {
  vi.mocked(pluginManager.getPlugins).mockReturnValue([])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PluginLoader (super-admin RLS era)', () => {
  it('does nothing while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoading: true, session: null } as never)
    render(
      <PluginLoader supabase={supabase}>
        <div data-testid="child" />
      </PluginLoader>,
    )
    expect(pluginManager.init).toHaveBeenCalled()
    expect(pluginManager.loadAll).not.toHaveBeenCalled()
    expect(pluginManager.unloadAll).not.toHaveBeenCalled()
  })

  it('unloads plugins when signed out (fail closed)', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoading: false, session: null } as never)
    render(
      <PluginLoader supabase={supabase}>
        <div data-testid="child" />
      </PluginLoader>,
    )
    expect(pluginManager.unloadAll).toHaveBeenCalled()
    expect(pluginManager.loadAll).not.toHaveBeenCalled()
  })

  it('loads plugins when a session is present (super admin path)', async () => {
    vi.mocked(useAuth).mockReturnValue({ isLoading: false, session } as never)
    render(
      <PluginLoader supabase={supabase}>
        <div data-testid="child" />
      </PluginLoader>,
    )
    await waitFor(() => expect(pluginManager.loadAll).toHaveBeenCalled())
    expect(pluginManager.unloadAll).not.toHaveBeenCalled()
  })

  it('re-loads after login when the session arrives late', async () => {
    vi.mocked(useAuth).mockReturnValue({ isLoading: true, session: null } as never)
    const view = render(
      <PluginLoader supabase={supabase}>
        <div data-testid="child" />
      </PluginLoader>,
    )
    expect(pluginManager.loadAll).not.toHaveBeenCalled()

    // Session arrives (AuthProvider finished restoring / user signed in)
    vi.mocked(useAuth).mockReturnValue({ isLoading: false, session } as never)
    view.rerender(
      <PluginLoader supabase={supabase}>
        <div data-testid="child" />
      </PluginLoader>,
    )
    await waitFor(() => expect(pluginManager.loadAll).toHaveBeenCalled())
  })

  it('renders children bare when no plugins are loaded (signed-out / plain member)', () => {
    vi.mocked(useAuth).mockReturnValue({ isLoading: false, session: null } as never)
    const { getByTestId, queryByTestId } = render(
      <PluginLoader supabase={supabase}>
        <div data-testid="child" />
      </PluginLoader>,
    )
    expect(getByTestId('child')).toBeTruthy()
    expect(queryByTestId('plugin-provider')).toBeNull()
  })

  it('wraps children in one provider per loaded plugin (super admin)', () => {
    vi.mocked(pluginManager.getPlugins).mockReturnValue([
      {
        manifest: { name: 'elvanto-sync', version: '1.0.0' },
        apiContext: {} as never,
        module: {},
      },
    ] as never)
    vi.mocked(useAuth).mockReturnValue({ isLoading: false, session } as never)
    const { getByTestId } = render(
      <PluginLoader supabase={supabase}>
        <div data-testid="child" />
      </PluginLoader>,
    )
    expect(getByTestId('plugin-provider')).toBeTruthy()
    expect(getByTestId('child')).toBeTruthy()
  })
})
