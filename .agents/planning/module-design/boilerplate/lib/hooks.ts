import { useEffect, useState } from 'react'
import { get<Entities> } from './queries'
import type { <Entity> } from './types'

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

function useAsyncQuery<T>(query: () => Promise<T>, key: string): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    query()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (active) setState({ data: null, loading: false, error: error instanceof Error ? error : new Error(String(error)) })
      })
    return () => {
      active = false
    }
  }, [key])

  return state
}

export function use<Entities>(options: { limit?: number; offset?: number } = {}): AsyncState<<Entity>[]> {
  return useAsyncQuery(() => get<Entities>(options), JSON.stringify(options))
}
