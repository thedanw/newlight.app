import { useEffect, useState } from 'react'
import { Input, Text } from '@/core/ui'
import { searchPeople } from '../lib/queries'
import type { Person } from '../lib/types'

type PeopleSearchProps = {
  onResults: (people: Person[] | null) => void
  onSearching: (searching: boolean) => void
}

export function PeopleSearch({ onResults, onSearching }: PeopleSearchProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const term = value.trim()
    if (!term) {
      onResults(null)
      setError(null)
      return
    }
    const timer = window.setTimeout(() => {
      onSearching(true)
      searchPeople(term)
        .then((people) => {
          onResults(people)
          setError(null)
        })
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Search failed'))
        .finally(() => onSearching(false))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [value, onResults, onSearching])

  return (
    <div>
      <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search people" aria-label="Search people" />
      {error && <Text color="fg.default">{error}</Text>}
    </div>
  )
}
