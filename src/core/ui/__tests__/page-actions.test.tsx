import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { PageActionsProvider, usePageActions, useRegisterPageActions } from '../page-actions'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function wrapper({ children }: { children: ReactNode }) {
  return <PageActionsProvider>{children}</PageActionsProvider>
}

describe('PageActionsProvider', () => {
  it('throws when usePageActions is used outside the provider', () => {
    expect(() => renderHook(() => usePageActions())).toThrow(
      'usePageActions must be used within a PageActionsProvider',
    )
  })

  it('registers actions and clears them via the returned cleanup', () => {
    const { result } = renderHook(() => usePageActions(), { wrapper })
    const cancel = vi.fn()
    const apply = vi.fn()

    let cleanup: (() => void) | undefined
    act(() => {
      cleanup = result.current.register({ cancel, apply, isSaving: false, isDirty: true })
    })
    expect(result.current.actions).toEqual(expect.objectContaining({ isDirty: true }))

    act(() => {
      cleanup?.()
    })
    expect(result.current.actions).toBeNull()
  })

  it('does not clear a newer registration when an older cleanup runs', () => {
    const { result } = renderHook(() => usePageActions(), { wrapper })
    const first = vi.fn()
    const second = vi.fn()

    let firstCleanup: (() => void) | undefined
    let secondCleanup: (() => void) | undefined
    act(() => {
      firstCleanup = result.current.register({ cancel: first, apply: first, isSaving: false, isDirty: true })
    })
    act(() => {
      secondCleanup = result.current.register({ cancel: second, apply: second, isSaving: false, isDirty: true })
    })
    act(() => {
      firstCleanup?.()
    })
    expect(result.current.actions).toEqual(expect.objectContaining({ cancel: second }))

    act(() => {
      secondCleanup?.()
    })
    expect(result.current.actions).toBeNull()
  })
})

describe('useRegisterPageActions', () => {
  it('registers actions and re-registers when isDirty changes', () => {
    const { result, rerender } = renderHook(
      ({ isDirty }: { isDirty: boolean }) => {
        const { actions } = usePageActions()
        useRegisterPageActions({ cancel: vi.fn(), apply: vi.fn(), isSaving: false, isDirty })
        return actions
      },
      { wrapper, initialProps: { isDirty: false } },
    )
    expect(result.current).toEqual(expect.objectContaining({ isDirty: false }))

    rerender({ isDirty: true })
    expect(result.current).toEqual(expect.objectContaining({ isDirty: true }))
  })

  it('does not register when disabled', () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => {
        const { actions } = usePageActions()
        useRegisterPageActions({ cancel: vi.fn(), apply: vi.fn(), isSaving: false, isDirty: true }, enabled)
        return actions
      },
      { wrapper, initialProps: { enabled: false } },
    )
    expect(result.current).toBeNull()

    rerender({ enabled: true })
    expect(result.current).toEqual(expect.objectContaining({ isDirty: true }))
  })
})