'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import {
  Accordion,
  Card,
  Heading,
  Icon,
  Page,
  Text,
} from '@/core/ui'
import { Box, Grid, HStack, Stack } from 'styled-system/jsx'
import { exampleManifest } from '../manifest'
import { tocCategories, type TocCategory } from './toc'
import { DEMOS } from './demos'

/* ---------------------------------------------------------------------------
   CategoryPage — consolidated subpage replacing Category.tsx + SubpageTemplate.tsx.
   Self-contained: Page.Main > Page.Header (level 2) + Page.Body.
   Reads categoryId from React Router params or accepts it as a prop.
   Uses useNavigate for navigation (not hash state).
-------------------------------------------------------------------------- */

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

function AccordionSections({
  category,
  anchorComponent,
}: {
  category: TocCategory
  anchorComponent?: string
}) {
  const groups = useMemo(
    () =>
      [
        ...new Set(
          category.components.map((component) => component.group).filter(Boolean),
        ),
      ] as string[],
    [category],
  )

  const anchorGroup = anchorComponent
    ? category.components.find((component) => component.name === anchorComponent)?.group
    : undefined

  const initial = groups[0] ? [groups[0]] : []
  const initialValue =
    anchorGroup && !initial.includes(anchorGroup) ? [...initial, anchorGroup] : initial

  const [value, setValue] = useState<string[]>(() => initialValue)

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

export default function CategoryPage({
  categoryId: propCategoryId,
  anchorComponent,
}: {
  categoryId?: string
  anchorComponent?: string
}) {
  const { categoryId: paramCategoryId } = useParams<{ categoryId: string }>()
  const categoryId = propCategoryId ?? paramCategoryId
  const category = categoryId ? tocCategories.find((c) => c.id === categoryId) : undefined

  // Scroll to deep-linked anchor component after render
  useEffect(() => {
    if (!anchorComponent) return
    const el = document.getElementById(`component-${anchorComponent}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [anchorComponent])

  if (!category) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': exampleManifest.number } as CSSProperties}>
          <Page.Heading level={2} icon={exampleManifest.icon} title="Not found" />
        </Page.Header>
        <Page.Body>
          <Text>Category not found.</Text>
        </Page.Body>
      </Page.Main>
    )
  }

  const CategoryIcon = category.icon
  const ungroupedComponents = category.components.filter((c) => !c.group)
  const groups = useMemo(
    () =>
      [
        ...new Set(category.components.map((c) => c.group).filter(Boolean)),
      ] as string[],
    [category],
  )

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': exampleManifest.number } as CSSProperties}>
        <Page.Heading level={2} icon={category.icon} title={category.name} />
      </Page.Header>
      <Page.Body>
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
            <AccordionSections category={category} anchorComponent={anchorComponent} />
          )}
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
