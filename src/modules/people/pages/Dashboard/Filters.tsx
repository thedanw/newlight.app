import { useMemo } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Field, Select } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import type { JourneyStage, PeopleListOptions } from '../../lib/types'
import { useJourneyTracks, useJourneyStages } from '../../lib/hooks'

type PeopleFiltersProps = {
  filters: PeopleListOptions
  onChange: (filters: PeopleListOptions) => void
}

export function PeopleFilters({ filters, onChange }: PeopleFiltersProps) {
  const tracks = useJourneyTracks()
  const stages = useJourneyStages()

  const demographicCollection = useMemo(() => createListCollection({
    items: [
      { label: 'Adults', value: 'adult' },
      { label: 'Youth', value: 'youth' },
      { label: 'Children', value: 'child' },
    ]
  }), [])

  const accessCollection = useMemo(() => createListCollection({
    items: [
      { label: 'Public', value: 'public' },
      { label: 'Member area', value: 'member_area' },
      { label: 'Team leaders', value: 'team_leaders' },
      { label: 'Admin', value: 'admin' },
    ]
  }), [])

  const trackCollection = useMemo(() => createListCollection({
    items: [...(tracks.data ?? []).map((track) => ({ label: track.name, value: track.id }))]
  }), [tracks.data])

  const stageCollection = useMemo(() => createListCollection({
    items: [...(stages.data ?? []).map((stage: JourneyStage) => ({ label: stage.label, value: stage.id }))]
  }), [stages.data])

  return (
        <Stack width="full">
          <Field.Root>
            <Field.Label>Demographic</Field.Label>
            <Select.Root multiple collection={demographicCollection} value={filters.demographic ? [filters.demographic] : []} onValueChange={(details) => onChange({ ...filters, demographic: (details.value[0] as NonNullable<PeopleListOptions['demographic']>) || undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="Select..." /><Select.Indicator /></Select.Trigger>
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
            <Select.Root multiple collection={trackCollection} value={filters.journeyTrackId ? [filters.journeyTrackId] : []} onValueChange={(details) => onChange({ ...filters, journeyTrackId: (details.value[0] as string) || undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="Select..." /><Select.Indicator /></Select.Trigger>
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
            <Select.Root multiple collection={stageCollection} value={filters.journeyStage ? [filters.journeyStage] : []} onValueChange={(details) => onChange({ ...filters, journeyStage: (details.value[0] as string) || undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="Select..." /><Select.Indicator /></Select.Trigger>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {stageCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Field.Root>

          <Field.Root>
            <Field.Label>Access</Field.Label>
            <Select.Root multiple collection={accessCollection} value={filters.accessPermission ? [filters.accessPermission] : []} onValueChange={(details) => onChange({ ...filters, accessPermission: (details.value[0] as NonNullable<PeopleListOptions['accessPermission']>) || undefined })}>
              <Select.Control>
                <Select.Trigger><Select.ValueText placeholder="Select..." /><Select.Indicator /></Select.Trigger>
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
