import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, MailIcon, Plus, SlidersHorizontal, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Dialog, Input, Page, Pagination, SearchInput, Text } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
import { peopleManifest } from '../../manifest'
import type { PeopleListOptions, Person, PersonPublic, PersonWithJourney } from '../../lib/types'
import { useCurrentOperatorPermission, usePeopleList } from '../../lib/hooks'
import { useAuth } from '@/core/auth'
import { PeopleFilters } from './Filters'
import { PeopleTable } from './Table'
import { createSavedList, searchPeople } from '../../lib/queries'
import { SavedListSidebar } from './SavedListSidebar'

const PAGE_SIZE = 50
const MODULE_NUMBER_STYLE = { '--module-number': peopleManifest.number } as CSSProperties

export default function PeopleDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isPublic = !user
  const [filters, setFilters] = useState<PeopleListOptions>({ limit: PAGE_SIZE, offset: 0 })
  const [searchResults, setSearchResults] = useState<Person[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [savedListName, setSavedListName] = useState('')
  const [savedListRefreshKey, setSavedListRefreshKey] = useState(0)
  const page = Math.floor((filters.offset ?? 0) / PAGE_SIZE) + 1
  // Queries only the table the current mode exposes (people_public for visitors).
  const listQuery = usePeopleList(filters, isPublic)
  const operatorPermission = useCurrentOperatorPermission()
  const canCreatePerson = operatorPermission.data === 'admin' || operatorPermission.data === 'super_admin' || operatorPermission.data === 'team_leaders'
  const canEmailPeople = operatorPermission.data === 'admin' || operatorPermission.data === 'super_admin'

  const handleFiltersChange = useCallback((nextFilters: PeopleListOptions) => {
    setFilters({ ...nextFilters, limit: PAGE_SIZE, offset: 0 })
  }, [])
  const handleSearchResults = useCallback((people: Person[] | null) => setSearchResults(people), [])
  const handleSearching = useCallback((value: boolean) => setSearching(value), [])
  const visiblePeople = useMemo<(PersonWithJourney | PersonPublic)[]>(
    () => searchResults?.map((person) => ({ ...person, household: null })) ?? listQuery.data ?? [],
    [searchResults, listQuery.data],
  )
  const hasNextPage = !searchResults && !isPublic && visiblePeople.length === PAGE_SIZE

  const setPage = (nextPage: number) => {
    setFilters((current) => ({ ...current, offset: (nextPage - 1) * PAGE_SIZE }))
  }

  return (
    <Page.Main>
      <Page.HeaderTop style={MODULE_NUMBER_STYLE} />
      <Page.Header style={MODULE_NUMBER_STYLE}>
        <Page.Heading level={0} icon={Users} title="People" />
      </Page.Header>
      <Page.HeaderBottom style={MODULE_NUMBER_STYLE}>
        <Stack gap="3" maxW="3xl">
          <Text textStyle="sm">
            Find people by name, preferred name, email, tag, or phone number.
          </Text>
          <SearchInput
            search={searchPeople}
            onResults={handleSearchResults}
            onSearching={handleSearching}
            placeholder="Search people"
            ariaLabel="Search people"
          />
          <HStack gap="2">
            {canCreatePerson && (
              <Button variant="surface" onClick={() => navigate('/people/new')}>
                <Plus />
                New person
              </Button>
            )}
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="surface">
                  <SlidersHorizontal />
                  Filter/Lists
                </Button>
              </Dialog.Trigger>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content css={{ color: 'var(--colors-fg-default)' }}>
                  <Dialog.Title>Filters & Lists</Dialog.Title>
                  <Dialog.Body>
                    <PeopleFilters filters={filters} onChange={handleFiltersChange} />
                    <SavedListSidebar
                      onLoad={(conditions) => setFilters({ ...conditions, limit: PAGE_SIZE, offset: 0 })}
                      refreshKey={savedListRefreshKey}
                    />
                  </Dialog.Body>
                  <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>
          </HStack>
        </Stack>
       </Page.HeaderBottom>

      {canEmailPeople && visiblePeople.length > 0 && (
        <HStack justifyContent="flex-end" paddingX="4" paddingBottom="2">
          <Button variant="surface" onClick={() => navigate('/people/email')}>
            <MailIcon />
            Email People
          </Button>
        </HStack>
      )}

      <Page.Body>
        <Dialog.Root>
          <Dialog.Trigger asChild><Button>Save current filters</Button></Dialog.Trigger>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>Save list</Dialog.Title>
              <Dialog.Body>
                <Input value={savedListName} onChange={(event) => setSavedListName(event.target.value)} placeholder="List name" />
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger onClick={() => {
                  void createSavedList(savedListName, filters)
                  setSavedListName('')
                  setSavedListRefreshKey((key) => key + 1)
                }}>Save</Dialog.ActionTrigger>
                <Dialog.CloseTrigger>Cancel</Dialog.CloseTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
        {listQuery.error && !searchResults && <Text color="fg.default">{listQuery.error.message}</Text>}
        {searching && <Text color="fg.muted">Searching...</Text>}
        <PeopleTable people={visiblePeople} loading={listQuery.loading && !searchResults} isPublic={isPublic} />
        {!searchResults && (
          <Pagination.Root key={page} count={hasNextPage ? (page + 1) * PAGE_SIZE : page * PAGE_SIZE} pageSize={PAGE_SIZE} defaultPage={page} onPageChange={(details) => setPage(details.page)}>
            <Pagination.PrevTrigger><ChevronLeft /></Pagination.PrevTrigger>
            <Pagination.Items render={(item) => <Pagination.Item type="page" value={item.value} />} />
            <Pagination.NextTrigger><ChevronRight /></Pagination.NextTrigger>
          </Pagination.Root>
        )}
      </Page.Body>
    </Page.Main>
  )
}
