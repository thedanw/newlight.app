import { useCallback, useEffect, useRef, useState } from 'react'
import {
  orderedCollectionService,
  type OrderedCollectionDefinition,
} from './ordered-collection'

export interface UseOrderedCollectionOptions {
  definition: OrderedCollectionDefinition
  /** Loads the current ordered ids (e.g. `SELECT id ... ORDER BY sort_order`). */
  load: () => Promise<string[]>
  /**
   * Persists an ordering. Defaults to `orderedCollectionService.persist`
   * bound to `definition`; pass a custom function for non-`sort_order`
   * persistence (e.g. a JSON config blob).
   */
  persist?: (orderedIds: string[]) => Promise<boolean>
}

export interface UseOrderedCollectionResult {
  /** Current ordered ids (optimistically updated). */
  items: string[]
  /** Apply a new ordering locally (marks the collection dirty). */
  reorder: (next: string[]) => void
  /** Whether local order differs from the last loaded/saved order. */
  isDirty: boolean
  /** Persist the current order; rolls back to the last saved order on failure. */
  save: () => Promise<boolean>
  /** Discard local changes and restore the last saved order. */
  reset: () => void
  error: string | null
}

export function useOrderedCollection({
  definition,
  load,
  persist,
}: UseOrderedCollectionOptions): UseOrderedCollectionResult {
  const [items, setItems] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs keep callbacks stable and avoid stale closures / effect re-runs.
  const loadRef = useRef(load)
  loadRef.current = load
  const persistRef = useRef(persist)
  persistRef.current = persist
  const itemsRef = useRef(items)
  itemsRef.current = items
  const originalRef = useRef<string[]>([])

  useEffect(() => {
    let cancelled = false
    loadRef.current()
      .then((initial) => {
        if (cancelled) return
        originalRef.current = initial
        setItems(initial)
        setIsDirty(false)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reorder = useCallback((next: string[]) => {
    setItems(next)
    setIsDirty(true)
  }, [])

  const save = useCallback(async () => {
    const persistFn =
      persistRef.current ?? ((ids: string[]) => orderedCollectionService.persist(definition, ids))
    try {
      const ok = await persistFn(itemsRef.current)
      if (ok) {
        originalRef.current = itemsRef.current
        setIsDirty(false)
        setError(null)
        return true
      }
      setItems(originalRef.current)
      setIsDirty(false)
      setError('Failed to save order')
      return false
    } catch (err) {
      setItems(originalRef.current)
      setIsDirty(false)
      setError(err instanceof Error ? err.message : String(err))
      return false
    }
  }, [definition])

  const reset = useCallback(() => {
    setItems(originalRef.current)
    setIsDirty(false)
    setError(null)
  }, [])

  return { items, reorder, isDirty, save, reset, error }
}