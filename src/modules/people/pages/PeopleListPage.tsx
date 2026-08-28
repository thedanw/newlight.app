import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Dialog, Heading, Icon, Input, PageHeader, Pagination, Text } from '@/core/ui'
import type { PeopleListOptions, Person, PersonWithJourney } from '../lib/types'
import { usePeopleList } from '../lib/hooks'
import { PeopleFilters } from '../components/PeopleFilters'
import { PeopleSearch } from '../components/PeopleSearch'
import { PeopleTable } from '../components/PeopleTable'
import { createSavedList } from '../lib/queries'
import { SavedListSidebar } from '../components/SavedListSidebar'

const PAGE_SIZE = 50

export default function PeopleListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<PeopleListOptions>({ limit: PAGE_SIZE, offset: 0 })
  const [searchResults, setSearchResults] = useState<Person[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [savedListName, setSavedListName] = useState('')
  const [savedListRefreshKey, setSavedListRefreshKey] = useState(0)
  const page = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1
  const peopleQuery = usePeopleList(filters)

  const handleFiltersChange = useCallback((nextFilters: PeopleListOptions) => {
    setFilters({ ...nextFilters, limit: PAGE_SIZE, offset: 0 })
  }, [])
  const handleSearchResults = useCallback((people: Person[] | null) => setSearchResults(people), [])
  const handleSearching = useCallback((value: boolean) => setSearching(value), [])
  const visiblePeople: PersonWithJourney[] = searchResults
    ? searchResults.map((person) => ({ ...person, household: null }))
    : peopleQuery.data ?? []
  const hasNextPage = !searchResults && visiblePeople.length === PAGE_SIZE

  const setPage = (nextPage: number) => {
    setFilters((current) => ({ ...current, offset: (nextPage - 1) * PAGE_SIZE }))
  }

  return (
    <>
      <PageHeader>
        <Heading>People</Heading>
        <Button onClick={() => navigate('/people/new')}>
          <Icon><Plus /></Icon>
          New person
        </Button>
        <Button onClick={() => setSearchResults(null)}>
          <Icon><Search /></Icon>
          Directory
        </Button>
      </PageHeader>
      <main>
        <PeopleSearch onResults={handleSearchResults} onSearching={handleSearching} />
        <PeopleFilters filters={filters} onChange={handleFiltersChange} />
        <SavedListSidebar onLoad={(conditions) => setFilters({ ...conditions, limit: PAGE_SIZE, offset: 0 })} refreshKey={savedListRefreshKey} />
        <Dialog.Root>
          <Dialog.Trigger asChild><Button>Save current filters</Button></Dialog.Trigger>
          <Dialog.Backdrop /><Dialog.Positioner><Dialog.Content><Dialog.Title>Save list</Dialog.Title><Dialog.Body><Input value={savedListName} onChange={(event) => setSavedListName(event.target.value)} placeholder="List name" /></Dialog.Body><Dialog.Footer><Dialog.ActionTrigger onClick={() => { void createSavedList(savedListName, filters); setSavedListName(''); setSavedListRefreshKey((key) => key + 1) }}>Save</Dialog.ActionTrigger><Dialog.CloseTrigger>Cancel</Dialog.CloseTrigger></Dialog.Footer></Dialog.Content></Dialog.Positioner>
        </Dialog.Root>
        {peopleQuery.error && !searchResults && <Text color="fg.default">{peopleQuery.error.message}</Text>}
        {searching && <Text color="fg.muted">Searching...</Text>}
        <PeopleTable people={visiblePeople} loading={peopleQuery.loading && !searchResults} />
        {!searchResults && (
          <Pagination.Root key={page} count={hasNextPage ? (page + 1) * PAGE_SIZE : page * PAGE_SIZE} pageSize={PAGE_SIZE} defaultPage={page} onPageChange={(details) => setPage(details.page)}>
            <Pagination.PrevTrigger><ChevronLeft /></Pagination.PrevTrigger>
            <Pagination.Items render={(item) => <Pagination.Item type="page" value={item.value} />} />
            <Pagination.NextTrigger><ChevronRight /></Pagination.NextTrigger>
          </Pagination.Root>
        )}
      </main>
    </>
  )
}
