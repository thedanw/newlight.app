import { useEffect, useState } from 'react'
import { getJourneySettings } from './queries'
import type { JourneyStage, JourneyTrack, JourneyTrackCategory } from './types'

export function useJourneySettings() {
  const [data, setData] = useState<{ tracks: JourneyTrack[]; categories: JourneyTrackCategory[]; stages: JourneyStage[] } | null>(null)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => { getJourneySettings().then(setData).catch((reason: unknown) => setError(reason instanceof Error ? reason : new Error(String(reason)))) }, [])
  return { data, error, loading: !data && !error }
}