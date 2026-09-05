'use client'
import { useState } from 'react'
import { Accordion, Card, Heading, Icon, Text } from '@/core/ui'
import { Box, Grid, HStack, Stack } from 'styled-system/jsx'
import { type TocCategory } from './toc'
import { DEMOS } from './demos'

/* ---------------------------------------------------------------------------
   SubpageTemplate — Batch 7: renders one category page from the TOC.
   Header = icon tile + title + description. Then a Card grid with one Card
   per component (name + shipped badge + description + live demo from
   `DEMOS`). When a category has `group` fields (Forms, Navigation) the cards
   are wrapped in an Accordion with one section per group so long pages stay
   scannable. Falls back to a single flat grid for ungrouped categories.
--------------------------------------------------------------------------- */

function ComponentCard({ name, description }: { name: string; description: string }) {
  return (
    <Card.Root id={`component-${name}`}>
      <Card.Header>
        <Heading textStyle="md">{name}</Heading>
        <Text textStyle="sm" color="fg.muted">
          {description}
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap="4" minH="10">
          {DEMOS[name] ?? (
            <Text textStyle="xs" color="fg.muted">
              Demo pending.
            </Text>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

export function SubpageTemplate({
  category,
  anchorComponent,
}: {
  category: TocCategory
  /** Deep-linked component name — its accordion group opens automatically. */
  anchorComponent?: string
}) {
  const CategoryIcon = category.icon
  const groups = [...new Set(category.components.map((component) => component.group).filter(Boolean))] as string[]
  const ungroupedComponents = category.components.filter((c) => !c.group)

  return (
    <Stack gap="8">
      <HStack gap="4" alignItems="center">
        <Box
          boxSize="12"
          borderRadius="l2"
          bg="colorPalette.subtle.bg"
          color="colorPalette.subtle.fg"
          display="grid"
          placeItems="center"
        >
          <Icon size="lg">
            <CategoryIcon />
          </Icon>
        </Box>
        <Stack gap="1">
          <Heading textStyle="2xl">{category.name}</Heading>
          <Text color="fg.muted" textStyle="sm">
            {category.description}
          </Text>
        </Stack>
      </HStack>

      {ungroupedComponents.length > 0 && (
        <Grid columns={{ base: 1, sm: 2, xl: 3 }} gap="6">
          {ungroupedComponents.map((component) => (
            <ComponentCard key={component.name} {...component} />
          ))}
        </Grid>
      )}

      {groups.length > 0 && (
        <AccordionSections category={category} groups={groups} anchorComponent={anchorComponent} />
      )}
    </Stack>
  )
}

function AccordionSections({
  category,
  groups,
  anchorComponent,
}: {
  category: TocCategory
  groups: string[]
  anchorComponent?: string
}) {
  // Controlled so a deep link can force its group open: default to the first
  // group (existing behavior) plus the anchored component's group.
  const anchorGroup = anchorComponent
    ? category.components.find((component) => component.name === anchorComponent)?.group
    : undefined
  const [value, setValue] = useState<string[]>(() => {
    const initial = groups[0] ? [groups[0]] : []
    return anchorGroup && !initial.includes(anchorGroup) ? [...initial, anchorGroup] : initial
  })

  return (
    <Accordion.Root value={value} onValueChange={(details) => setValue(details.value ?? [])}>
      {groups.map((group) => {
        const components = category.components.filter((component) => component.group === group)
        return (
          <Accordion.Item key={group} value={group}>
            <Accordion.ItemTrigger>
              <Heading textStyle="md" flex="1">
                {group}
              </Heading>
              <Text textStyle="xs" color="fg.muted">
                {components.length}
              </Text>
              <Accordion.ItemIndicator>⌄</Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Grid columns={{ base: 1, sm: 2, xl: 3 }} gap="6" pt="4">
                  {components.map((component) => (
                    <ComponentCard key={component.name} {...component} />
                  ))}
                </Grid>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        )
      })}
    </Accordion.Root>
  )
}
