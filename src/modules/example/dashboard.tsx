import { useCallback, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, CloseButton, Dialog, Drawer, Heading, Icon, Loader, Page, SearchInput, Spinner, Table, Tabs, Text } from '@/core/ui'
import { Box, Grid, HStack, Stack } from 'styled-system/jsx'
import { exampleManifest } from './manifest'
import { tocCategories, type TocCategory, type TocComponent } from './pages/toc'

/* ---------------------------------------------------------------------------
   ExampleDashboardPage — module entry point at /example.

   Replaces the temporary styleguide shell (temp-styleguide #38). Uses the
   standard Page layout pattern from the boilerplate template.
 -------------------------------------------------------------------------- */

const normalizeQuery = (filter: string) => filter.trim().toLowerCase()
const matchesComponent = (component: { name: string; description: string }, query: string) =>
  component.name.toLowerCase().includes(query) ||
  component.description.toLowerCase().includes(query)

/** Flattened catalog row — a component carrying its category context for search results. */
type CatalogComponent = TocComponent & {
  category: string
  categoryId: string
}

const flattenCatalog = (): CatalogComponent[] =>
  tocCategories.flatMap((category) =>
    category.components.map((component) => ({
      ...component,
      category: category.name,
      categoryId: category.id,
    })),
  )

// SearchInput's `search` prop is async; the catalog is small and in-memory, so
// wrap the synchronous filter in a resolved promise.
const searchCatalog = (term: string): Promise<CatalogComponent[]> => {
  const query = normalizeQuery(term)
  return Promise.resolve(flattenCatalog().filter((component) => matchesComponent(component, query)))
}

/** Re-group flat search matches back into TocCategory objects for the cards view. */
const groupMatchesByCategory = (matches: CatalogComponent[]): TocCategory[] => {
  const grouped = new Map<string, TocCategory>()
  for (const match of matches) {
    const category = tocCategories.find((candidate) => candidate.id === match.categoryId)
    if (!category) continue
    const existing = grouped.get(category.id)
    if (existing) {
      existing.components.push(match)
    } else {
      grouped.set(category.id, { ...category, components: [match] })
    }
  }
  return [...grouped.values()]
}

export default function ExampleDashboardPage() {
  const navigate = useNavigate()
  const [demoDialogOpen, setDemoDialogOpen] = useState(false)
  const [demoDrawerOpen, setDemoDrawerOpen] = useState(false)
  const [results, setResults] = useState<CatalogComponent[] | null>(null)
  const [, setSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleResults = useCallback((next: CatalogComponent[] | null) => {
    if (next === null) setSearchTerm('')
    setResults(next)
  }, [])
  const handleSearching = useCallback((value: boolean) => setSearching(value), [])
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    return searchCatalog(term)
  }, [])

  const filteredCategories = results === null ? tocCategories : groupMatchesByCategory(results)
  const allComponents = results === null ? flattenCatalog() : results

  const openCategory = (categoryId: string) => navigate(`/example/category/${categoryId}`)
  const openComponent = (categoryId: string) => navigate(`/example/category/${categoryId}`)

  return (
    <Page.Main>
      <Page.HeaderTop style={{ '--module-number': exampleManifest.number } as CSSProperties} />
      <Page.Header
        style={{ '--module-number': exampleManifest.number } as CSSProperties}>
        <Page.Heading level={0} icon={exampleManifest.icon} title={exampleManifest.name} />
      </Page.Header>
      <Page.HeaderBottom
        style={{ '--module-number': exampleManifest.number } as CSSProperties}
      >
        <Stack gap="3" maxW="3xl">
          <Text textStyle="sm">
            Every Park UI component, findable in ≤2 taps.
          </Text>
          <SearchInput
            search={handleSearch}
            onResults={handleResults}
            onSearching={handleSearching}
            placeholder="Search ui components…"
            ariaLabel="Search components"
          />
        </Stack>
      </Page.HeaderBottom>

      <Page.Body>
        
          <Heading textStyle="lg">Component catalog</Heading>
          This app uses Park UI components for its own UI. The catalog below shows all components, grouped by category, with a search input to filter them.
          <Button onClick={() => navigate('https://park-ui.com/docs/introduction')}>Park UI Docs</Button>
        <Stack gap="8">
          {/* Category cards grid + table index */}
          <Tabs.Root defaultValue="categories">
            <Tabs.List>
              <Tabs.Trigger value="categories">Categories</Tabs.Trigger>
              <Tabs.Trigger value="table">All components ({allComponents.length})</Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>

            <Tabs.Content value="categories">
              {filteredCategories.length > 0 ? (
                <Grid gap="4" columns={{ base: 1, md: 2, xl: 3 }}>
                  {filteredCategories.map((category) => {
                    const CategoryIcon = category.icon
                    return (
                      <Card.Root key={category.id}>
                        <Card.Header paddingBottom="0" gap="2">
                          <HStack justify="space-between" alignItems="flex-start">
                            <Box
                              boxSize="10"
                              borderRadius="l2"
                              bg="colorPalette.subtle.bg"
                              color="colorPalette.subtle.fg"
                              display="grid"
                              placeItems="center"
                            >
                              <Icon size="md">
                                <CategoryIcon />
                              </Icon>
                            </Box>
                            <Badge>{category.components.length}</Badge>
                          </HStack>
                          <Heading textStyle="lg">{category.name}</Heading>
                          <Text textStyle="sm" color="fg.muted">
                            {category.description}
                          </Text>
                        </Card.Header>
                        <Card.Body>
                          <Stack gap="1" mt="4" pt="3" borderTopWidth="1px" borderColor="border">
                            {category.components.map((component) => (
                              <Text
                                key={component.name}
                                textStyle="sm"
                                color="colorPalette.outline.fg"
                                cursor="pointer"
                                _hover={{ textDecoration: 'underline' }}
                                onClick={() => openComponent(category.id)}
                              >
                                {component.name}
                              </Text>
                            ))}
                          </Stack>
                        </Card.Body>
                        <Card.Footer>
                          <Button size="sm" onClick={() => openCategory(category.id)}>
                            Open
                          </Button>
                        </Card.Footer>
                      </Card.Root>
                    )
                  })}
                </Grid>
              ) : (
                <Box minH="40" display="flex" alignItems="center" justifyContent="center">
                  <Text textStyle="sm" color="fg.muted">
                    No components match "{searchTerm}".
                  </Text>
                </Box>
              )}
            </Tabs.Content>

            <Tabs.Content value="table">
              <Box overflowX="auto" borderWidth="1px" borderColor="border" borderRadius="l2">
                <Table.Root interactive>
                  <Table.Head>
                    <Table.Row>
                      <Table.Header>Component</Table.Header>
                      <Table.Header>Category</Table.Header>
                      <Table.Header>Description</Table.Header>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {allComponents.map((component) => (
                      <Table.Row
                        key={`${component.categoryId}-${component.name}`}
                        cursor="pointer"
                        onClick={() => openComponent(component.categoryId)}
                      >
                        <Table.Cell fontWeight="semibold">{component.name}</Table.Cell>
                        <Table.Cell>{component.category}</Table.Cell>
                        <Table.Cell whiteSpace="normal">{component.description}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Tabs.Content>
          </Tabs.Root>

          <Box borderTopWidth="1px" borderColor="border" />

          {/* Native Park UI overlay demos — Dialog + Drawer */}
          <Stack gap="3">
            <Heading textStyle="md">Overlay demos</Heading>
            <Text textStyle="sm" color="fg.muted">
              Native Park UI Dialog and Drawer, opened from the dashboard.
            </Text>
            <HStack gap="2" flexWrap="wrap">
              <Button onClick={() => setDemoDialogOpen(true)}>Open Dialog</Button>
              <Button variant="outline" onClick={() => setDemoDrawerOpen(true)}>
                Open Drawer
              </Button>
            </HStack>
          </Stack>

          {/* Loading / feedback strip */}
          <Stack gap="3">
            <Heading textStyle="md">Loading & feedback</Heading>
            <Text textStyle="sm" color="fg.muted">
              Inline loaders and spinners — real app states, not isolated boxes.
            </Text>
            <HStack gap="6" flexWrap="wrap">
              <Loader text="Loading…" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" color="colorPalette.solid.bg" />
              <Button loading>Save changes</Button>
            </HStack>
          </Stack>
        </Stack>
      </Page.Body>

      {/* Dialog demo */}
      <Dialog.Root open={demoDialogOpen} onOpenChange={(details) => setDemoDialogOpen(details.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Dialog.Title>Dialog demo</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text color="fg.muted" textStyle="sm">
                A native Park UI Dialog opened from the dashboard.
              </Text>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Drawer demo */}
      <Drawer.Root open={demoDrawerOpen} onOpenChange={(details) => setDemoDrawerOpen(details.open)}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger asChild>
              <CloseButton />
            </Drawer.CloseTrigger>
            <Drawer.Header>
              <Drawer.Title>Drawer demo</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <Text color="fg.muted" textStyle="sm">
                A native Park UI Drawer opened from the dashboard.
              </Text>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Page.Main>
  )
}
