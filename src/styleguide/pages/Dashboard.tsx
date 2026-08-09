'use client'
import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, SlidersHorizontalIcon, SparklesIcon, XIcon } from 'lucide-react'
import { css } from 'styled-system/css'
import { Box, Grid, HStack, Stack } from 'styled-system/jsx'
import { tocCategories, type TocCategory } from '../toc'
import { Input } from '../Input'
import { type SlidePanelVariant } from '../SlidePanel'
import {
  AbsoluteCenter,
  Avatar,
  Badge,
  Button,
  Card,
  Carousel,
  Field,
  Heading,
  Icon,
  IconButton,
  Loader,
  Separator,
  Spinner,
  Tabs,
  Text,
  Tooltip,
} from '@/core/ui'

/* ---------------------------------------------------------------------------
   Dashboard — the TOC hub (temp-styleguide #2/#19/#25): per-category Cards +
   a full Table index, toolPanel search/filter (#11/#32/#36), featured strip
   (#28), SlidePanel variant trio (#9) and a loading/feedback strip (#24).
--------------------------------------------------------------------------- */

export type DashboardProps = {
  onOpenCategory: (category: TocCategory) => void
  onOpenSlideDemo: (variant: SlidePanelVariant) => void
}

const FEATURED = [
  {
    name: 'Button',
    blurb: 'Primary action trigger',
    node: <Button size="sm">Primary action</Button>,
  },
  {
    name: 'Badge',
    blurb: 'Status chip',
    node: <Badge colorPalette="green">Ready</Badge>,
  },
  {
    name: 'Avatar',
    blurb: 'Identities & initials',
    node: (
      <Avatar.Root size="sm">
        <Avatar.Fallback name="Ada Lovelace" />
      </Avatar.Root>
    ),
  },
  {
    name: 'Heading',
    blurb: 'Section titles',
    node: <Heading textStyle="xl">Heading level</Heading>,
  },
]

export function Dashboard({ onOpenCategory, onOpenSlideDemo }: DashboardProps) {
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
      .map((component) => ({ ...component, category: category.name })),
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
            <SlidersHorizontalIcon />
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

      {/* Featured strip (Carousel) */}
      <Stack gap="3">
        <HStack gap="2" color="fg.muted">
          <SparklesIcon size={16} />
          <Heading textStyle="md">Featured components</Heading>
        </HStack>
        <Carousel.Root slideCount={FEATURED.length} slidesPerPage={1} loop>
          <Carousel.ItemGroup>
            {FEATURED.map((feature, index) => (
              <Carousel.Item key={feature.name} index={index}>
                <Card.Root variant="elevated" h="full">
                  <Card.Body>
                    <Stack gap="3">
                      <Heading textStyle="md">{feature.name}</Heading>
                      <Text textStyle="sm" color="fg.muted">
                        {feature.blurb}
                      </Text>
                      <Box py="2">{feature.node}</Box>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              </Carousel.Item>
            ))}
          </Carousel.ItemGroup>
          <Carousel.Control>
            <Carousel.PrevTrigger aria-label="Previous slide">
              <ChevronLeftIcon />
            </Carousel.PrevTrigger>
            <Carousel.IndicatorGroup />
            <Carousel.NextTrigger aria-label="Next slide">
              <ChevronRightIcon />
            </Carousel.NextTrigger>
          </Carousel.Control>
        </Carousel.Root>
      </Stack>

      {/* TOC — categories / full table views */}
      <Tabs.Root defaultValue="categories">
        <Tabs.List>
          <Tabs.Trigger value="categories">Categories</Tabs.Trigger>
          <Tabs.Trigger value="table">All components ({allComponents.length})</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="categories">
          {filteredCategories.length > 0 ? (
            <Grid gap="4" gridTemplateColumns={{ base: '1', md: '2', xl: '3' }}>
              {filteredCategories.map((category) => {
                const CategoryIcon = category.icon
                return (
                  <Card.Root key={category.id}>
                    <Card.Body>
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
                      <Stack gap="1" mt="4">
                        <Heading textStyle="lg">{category.name}</Heading>
                        <Text textStyle="sm" color="fg.muted">
                          {category.description}
                        </Text>
                      </Stack>
                    </Card.Body>
                    <Card.Footer>
                      <Button size="sm" onClick={() => onOpenCategory(category)}>
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
            <table className={css({ width: '100%', borderCollapse: 'collapse' })}>
              <thead>
                <tr className={css({ textAlign: 'left', color: 'fg.muted' })}>
                  <th className={thCss}>Component</th>
                  <th className={thCss}>Category</th>
                  <th className={thCss}>Description</th>
                  <th className={thCss}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allComponents.map((component) => (
                  <tr
                    key={`${component.category}-${component.name}`}
                    className={css({ borderTop: '1px solid var(--colors-border)' })}
                  >
                    <td className={tdCss({ fontWeight: 'semibold' })}>{component.name}</td>
                    <td className={tdCss()}>
                      <Badge size="sm" colorPalette="gray">
                        {component.category}
                      </Badge>
                    </td>
                    <td className={tdCss({ color: 'fg.muted', textStyle: 'sm' })}>
                      {component.description}
                    </td>
                    <td className={tdCss()}>
                      <Badge size="sm" colorPalette={component.shipped ? 'green' : 'gray'}>
                        {component.shipped ? 'shipped' : 'pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Tabs.Content>
      </Tabs.Root>

      <Separator />

      {/* SlidePanel variant trio */}
      <Stack gap="3">
        <Heading textStyle="md">SlidePanel variants</Heading>
        <Text textStyle="sm" color="fg.muted">
          The overlay-shell trio used for dialogs, drill-down and focus modes.
        </Text>
        <HStack gap="2" flexWrap="wrap">
          <Button onClick={() => onOpenSlideDemo('normal')}>Normal</Button>
          <Button variant="outline" onClick={() => onOpenSlideDemo('fullscreen')}>
            Fullscreen
          </Button>
          <Button variant="subtle" onClick={() => onOpenSlideDemo('immersive')}>
            Immersive
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

const thCss = css({ px: '4', py: '3', textStyle: 'sm', fontWeight: 'medium' })
const tdCss = (extra?: Parameters<typeof css>[0]) =>
  css({ px: '4', py: '3', textAlign: 'left', verticalAlign: 'top', ...extra })
