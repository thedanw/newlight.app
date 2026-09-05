import { useMemo } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Card, Field, Select } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import type { PeopleListOptions } from '../lib/types'
import { useTags } from '../lib/hooks'

type PeopleFiltersProps = {
  filters: PeopleListOptions
  onChange: (filters: PeopleListOptions) => void
}

export function PeopleFilters({ filters, onChange }: PeopleFiltersProps) {
  const tags = useTags()

  const demographicCollection = useMemo(() => createListCollection({
    items: [
      { label: 'All', value: '' },
      { label: 'Adults', value: 'adult' },
      { label: 'Youth', value: 'youth' },
      { label: 'Children', value: 'child' },
    ]
  }), [])

  const tagCollection = useMemo(() => createListCollection({
    items: [{ label: 'All tags', value: '' }, ...(tags.data ?? []).map((tag) => ({ label: tag.name, value: tag.id }))]
  }), [tags.data])

  const accessCollection = useMemo(() => createListCollection({
    items: [
      { label: 'All', value: '' },
      { label: 'Public', value: 'public' },
      { label: 'Member area', value: 'member_area' },
      { label: 'Team leaders', value: 'team_leaders' },
      { label: 'Admin', value: 'admin' },
    ]
  }), [])

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Filter people</Card.Title>
      </Card.Header>
      <Card.Body>
        <Stack gap="4">
          <Field.Root>
            <Field.Label>Demographic</Field.Label>
            <Select.Root collection={demographicCollection} value={[filters.demographic ?? '']} onValueChange={(details) => onChange({ ...filters, demographic: details.value[0] ? details.value[0] as NonNullable<PeopleListOptions['demographic']> : undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="All" /><Select.Indicator /></Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {demographicCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>
          <Field.Root>
            <Field.Label>Tag</Field.Label>
            <Select.Root collection={tagCollection} value={[filters.tagId ?? '']} onValueChange={(details) => onChange({ ...filters, tagId: details.value[0] || undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="All tags" /><Select.Indicator /></Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {tagCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>
          <Field.Root>
            <Field.Label>Access</Field.Label>
            <Select.Root collection={accessCollection} value={[filters.accessPermission ?? '']} onValueChange={(details) => onChange({ ...filters, accessPermission: details.value[0] ? details.value[0] as NonNullable<PeopleListOptions['accessPermission']> : undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="All" /><Select.Indicator /></Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {accessCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
