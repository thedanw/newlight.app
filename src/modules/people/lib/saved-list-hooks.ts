import { useCallback, useEffect, useState } from 'react'
import { getSavedLists } from './queries'
import type { SavedList } from './types'

export function useSavedLists() {
  const [data, setData] = useState<SavedList[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const refresh = useCallback(() => {
    getSavedLists().then(setData).catch((reason: unknown) => setError(reason instanceof Error ? reason : new Error(String(reason))))
  }, [])
  useEffect(refresh, [refresh])
  return { data, error, loading: !data && !error, refresh }
}