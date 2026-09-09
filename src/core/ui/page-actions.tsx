'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * Actions a routed page can register with the shell-owned action footer.
 * The footer is visible only while `isDirty` is true.
 */
export type PageActions = {
  /** Discard changes and leave the form. */
  cancel: () => void
  /** Persist changes. May be async. */
  apply: () => Promise<void> | void
  /** True while `apply` is in flight — disables both buttons. */
  isSaving: boolean
  /** True when the form has unsaved edits — drives footer visibility. */
  isDirty: boolean
  /** Label for the apply button. Defaults to "Save". */
  applyLabel?: string
}

interface PageActionsContextValue {
  actions: PageActions | null
  /**
   * Register the active page's actions. Returns a cleanup that clears them,
   * so a route unmount never leaves a stale footer on the next route.
   */
  register: (actions: PageActions) => () => void
}

const PageActionsContext = createContext<PageActionsContextValue | null>(null)

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<PageActions | null>(null)

  const register = useCallback((next: PageActions) => {
    setActions(next)
    return () => {
      // Only clear if this registration is still the active one — a re-register
      // (e.g. on isDirty change) must not be wiped by an older cleanup.
      setActions((current) => (current === next ? null : current))
    }
  }, [])

  const value = useMemo(() => ({ actions, register }), [actions, register])

  return <PageActionsContext.Provider value={value}>{children}</PageActionsContext.Provider>
}

export function usePageActions(): PageActionsContextValue {
  const context = useContext(PageActionsContext)
  if (!context) {
    throw new Error('usePageActions must be used within a PageActionsProvider')
  }
  return context
}

/**
 * Register a page's actions with the shell footer.
 *
 * Keeps the latest callbacks in a ref so the effect never re-runs on unstable
 * function references — otherwise `register` → provider re-render → page
 * re-render → new function → re-register would loop forever. Re-registers
 * only when `isSaving`/`isDirty` change so the footer's visibility and
 * disabled state stay current.
 */
export function useRegisterPageActions(actions: PageActions, enabled = true) {
  const { register } = usePageActions()
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    if (!enabled) return
    return register({
      cancel: () => actionsRef.current.cancel(),
      apply: () => actionsRef.current.apply(),
      isSaving: actionsRef.current.isSaving,
      isDirty: actionsRef.current.isDirty,
      applyLabel: actionsRef.current.applyLabel,
    })
    // `actions` is intentionally omitted: only the primitive flags below drive
    // re-registration; the callbacks are read fresh from the ref each run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, enabled, actions.isSaving, actions.isDirty, actions.applyLabel])
}