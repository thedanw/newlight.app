import { useMemo } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Card, Field, Select } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import type { JourneyStage, PeopleListOptions } from '../lib/types'
import { useTags, useJourneyTracks, useJourneyStages } from '../lib/hooks'

type PeopleFiltersProps = {
  filters: PeopleListOptions
  onChange: (filters: PeopleListOptions) => void
}

export function PeopleFilters({ filters, onChange }: PeopleFiltersProps) {
  const tags = useTags()
  const tracks = useJourneyTracks()
  const stages = useJourneyStages()

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

  const trackCollection = useMemo(() => createListCollection({
    items: [{ label: 'All tracks', value: '' }, ...(tracks.data ?? []).map((track) => ({ label: track.name, value: track.id }))]
  }), [tracks.data])

  const stageCollection = useMemo(() => createListCollection({
    items: [{ label: 'All stages', value: '' }, ...(stages.data ?? []).map((stage: JourneyStage) => ({ label: stage.label, value: stage.slug }))]
  }), [stages.data])

  return (
        <Stack gap="4" width="full">
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
            <Field.Label>Journey track</Field.Label>
            <Select.Root collection={trackCollection} value={[filters.journeyTrackId ?? '']} onValueChange={(details) => onChange({ ...filters, journeyTrackId: details.value[0] || undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="All tracks" /><Select.Indicator /></Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {trackCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>
          <Field.Root>
            <Field.Label>Journey stage</Field.Label>
            <Select.Root collection={stageCollection} value={[filters.journeyStage ?? '']} onValueChange={(details) => onChange({ ...filters, journeyStage: details.value[0] || undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="All stages" /><Select.Indicator /></Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {stageCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
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
  )
}
