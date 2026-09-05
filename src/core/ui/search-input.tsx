import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Icon } from './icon'
import { IconButton } from './icon-button'
import { Input } from './input'
import { InputGroup } from './input-group'
import { Text } from './text'

export type SearchInputProps<T> = {
  /** Module-provided search query. Receives the trimmed input value. */
  search: (term: string) => Promise<T>
  /** Called with null when the term is cleared, or with the resolved results. */
  onResults: (results: T | null) => void
  /** Called while a search request is in flight. */
  onSearching: (searching: boolean) => void
  placeholder?: string
  ariaLabel?: string
  /** Debounce delay in milliseconds. Defaults to 300. */
  debounceMs?: number
}

export function SearchInput<T>({
  search,
  onResults,
  onSearching,
  placeholder = 'Search',
  ariaLabel = 'Search',
  debounceMs = 300,
}: SearchInputProps<T>) {
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
      search(term)
        .then((results) => {
          onResults(results)
          setError(null)
        })
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Search failed'))
        .finally(() => onSearching(false))
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [value, search, onResults, onSearching, debounceMs])

  return (
    <InputGroup
      width="full"
      endElement={
        <IconButton variant="plain" size="sm">
          <Icon><Search /></Icon>
        </IconButton>
      }
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        bg="white"
        color="fg.default"
        width="full"
      />
      {error && <Text color="fg.default">{error}</Text>}
    </InputGroup>
  )
}