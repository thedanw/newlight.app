'use client'
import { useState } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'
import { Box, Grid, HStack, Stack } from 'styled-system/jsx'
import { tocCategories } from '../toc'
import {
  AbsoluteCenter,
  Badge,
  Button,
  Card,
  Field,
  Heading,
  Icon,
  IconButton,
  Input,
  Loader,
  Spinner,
  Table,
  Tabs,
  Text,
  Tooltip,
} from '@/core/ui'

/* ---------------------------------------------------------------------------
   Dashboard — the TOC hub (temp-styleguide #2/#19/#25): per-category Cards +
   a full Table index, toolPanel search/filter (#11/#32/#36), featured strip
   (#28), native Dialog/Drawer overlay demos (#9) and a loading/feedback
   strip (#24).
--------------------------------------------------------------------------- */

export type DashboardProps = {
  /** Push the category page onto the panel stack. */
  onOpenCategory: (categoryId: string) => void
  /** Push the category page and scroll to a component's card anchor. */
  onOpenComponent: (categoryId: string, component: string) => void
  onOpenOverlay: (kind: 'dialog' | 'drawer') => void
}

export function Dashboard({ onOpenCategory, onOpenComponent, onOpenOverlay }: DashboardProps) {
  const [filter, setFilter] = useState('')
  const [toolPanelOpen, setToolPanelOpen] = useState(false)

  const normalized = filter.trim().toLowerCase()
  const matches = (component: { name: string; description: string }) =>
    component.name.toLowerCase().includes(normalized) || component.description.toLowerCase().includes(normalized)

  const filteredCategories = tocCategories
    .map((category) => ({ ...category, components: category.components.filter(matches) }))
    .filter((category) => category.components.length > 0)

  const allComponents = tocCategories.flatMap((category) =>
    category.components
      .filter(matches)
      .map((component) => ({ ...component, category: category.name, categoryId: category.id })),
  )

  return (
    <Stack gap="8">

      {/* Page header + toolPanel toggle */}
      <HStack justify="space-between" alignItems="flex-start">
        <Stack gap="1">
          <Heading textStyle="2xl">Component catalog</Heading>
          <Text color="fg.muted" textStyle="sm">
            Every Park UI component, findable in ≤2 taps.
          </Text>
        </Stack>
        <Tooltip content={toolPanelOpen ? 'Hide filter panel' : 'Filter components'}>
          <IconButton
            variant={toolPanelOpen ? 'solid' : 'outline'}
            colorPalette="gray"
            aria-label="Toggle filter panel"
            onClick={() => setToolPanelOpen((open) => !open)}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      </HStack>

      {/* toolPanel — in-flow search/filter, pushes content down (decision #41) */}
      {toolPanelOpen && (
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="l2"
          bg="gray.surface.bg"
          p="4"
        >
          <Field.Root>
            <Field.Label>Find a component</Field.Label>
            <HStack gap="2">
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search by name or description…"
                aria-label="Search components"
              />
              <IconButton
                variant="outline"
                colorPalette="gray"
                aria-label="Clear search"
                disabled={!filter}
                onClick={() => setFilter('')}
              >
                <XIcon />
              </IconButton>
            </HStack>
            <Field.HelperText>
              Live-filters the category cards and the full table below.
            </Field.HelperText>
          </Field.Root>
        </Box>
      )}

      {/* TOC — categories / full table views */}
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
                      <Heading textStyle="lg"
                        >{category.name}</Heading>
                      <Text textStyle="sm" color="fg.muted">
                          {category.description}
                      </Text>
                    </Card.Header>
                    <Card.Body>
                      {/* Component links */}
                      <Stack gap="1" mt="4" pt="3" borderTopWidth="1px" borderColor="border">
                        {category.components.map((component) => (
                          <Text
                            key={component.name}
                            textStyle="sm"
                            color="colorPalette.outline.fg"
                            cursor="pointer"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() => onOpenComponent(category.id, component.name)}
                          >
                            {component.name}
                          </Text>
                        ))}
                      </Stack>
                    </Card.Body>
                    <Card.Footer>
                      <Button size="sm" onClick={() => onOpenCategory(category.id)}>
                        Open
                      </Button>
                    </Card.Footer>
                  </Card.Root>
                )
              })}
            </Grid>
          ) : (
            <Box position="relative" minH="40">
              <AbsoluteCenter>
                <Text textStyle="sm" color="fg.muted">
                  No components match “{filter}”.
                </Text>
              </AbsoluteCenter>
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
                    key={`${component.category}-${component.name}`}
                    cursor="pointer"
                    onClick={() => onOpenComponent(component.categoryId, component.name)}
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
          Native Park UI Dialog and Drawer, opened from the shell.
        </Text>
        <HStack gap="2" flexWrap="wrap">
          <Button onClick={() => onOpenOverlay('dialog')}>Open Dialog</Button>
          <Button variant="outline" onClick={() => onOpenOverlay('drawer')}>
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
  )
}


