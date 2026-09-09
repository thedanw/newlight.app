import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import type { Person, PersonPublic, JourneyStage, JourneyTrack, JourneyTrackCategory } from '../../../lib/types'
import { Badge, Button, Table, Text } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
import { useJourneyCategories, useJourneyStages, useJourneyTracks } from '../../../lib/hooks'
import { updatePersonJourney, writePeopleAudit } from '../../../lib/queries'
import { ProfileSection } from '../ProfileSection'

export type JourneySectionHandle = {
  save: () => Promise<void>
}

export type JourneySectionProps = {
  person: Person | PersonPublic
  canEdit?: boolean
  defaultEdit?: boolean
}

function resolveCategoryPath(
  categoryId: string | null | undefined,
  categoryById: Map<string, JourneyTrackCategory>,
): string {
  if (!categoryId) return ''
  const parts: string[] = []
  let current: JourneyTrackCategory | undefined = categoryById.get(categoryId)
  while (current) {
    parts.unshift(current.name)
    current = current.parent_id ? categoryById.get(current.parent_id) : undefined
  }
  return parts.join(' / ')
}

export const JourneySection = forwardRef<JourneySectionHandle, JourneySectionProps>(
  ({ person, canEdit = false, defaultEdit = false }, ref) => {
    const tracksQuery = useJourneyTracks()
    const stagesQuery = useJourneyStages()
    const categoriesQuery = useJourneyCategories()

    const tracks: JourneyTrack[] = tracksQuery.data ?? []
    const stages: JourneyStage[] = stagesQuery.data ?? []

    const categoryById = useMemo(() => {
      const map = new Map<string, JourneyTrackCategory>()
      for (const cat of categoriesQuery.data ?? []) map.set(cat.id, cat)
      return map
    }, [categoriesQuery.data])

    const groups = useMemo(() => {
      const sorted = [...tracks].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
      )
      const grouped = new Map<string, JourneyTrack[]>()
      const orderedCats: string[] = []
      const uncategorized: JourneyTrack[] = []
      for (const track of sorted) {
        const path = resolveCategoryPath(track.category_id, categoryById)
        if (path) {
          if (!grouped.has(path)) {
            grouped.set(path, [])
            orderedCats.push(path)
          }
          grouped.get(path)!.push(track)
        } else {
          uncategorized.push(track)
        }
      }
      const result: { category: string; tracks: JourneyTrack[] }[] = []
      for (const path of orderedCats) result.push({ category: path, tracks: grouped.get(path)! })
      if (uncategorized.length) result.push({ category: '', tracks: uncategorized })
      return result
    }, [tracks, categoryById])

    const allRows = useMemo(
      () =>
        groups.flatMap((group) => {
          const rows: Array<{ type: 'category'; key: string; label: string } | { type: 'track'; key: string; track: JourneyTrack }> = []
          if (group.category) rows.push({ type: 'category', key: `cat-${group.category}`, label: group.category })
          for (const track of group.tracks) rows.push({ type: 'track', key: track.id, track })
          return rows
        }),
      [groups],
    )

    const [isEditing, setIsEditing] = useState(defaultEdit)
    const [journey, setJourney] = useState<Record<string, string>>(() => ({
      ...((person as Person).journey ?? {}),
    }))

    const hasUnsavedChanges = JSON.stringify(journey) !== JSON.stringify((person as Person).journey ?? {})

    const handleStageChange = (trackId: string, stageId: string) => {
      setJourney((current) => ({ ...current, [trackId]: stageId }))
    }

    const handleSave = async () => {
      if (!hasUnsavedChanges) return
      await updatePersonJourney(person.id, journey)
      await writePeopleAudit(person.id, 'journey_track', (person as Person).journey ?? {}, journey)
    }

    useImperativeHandle(ref, () => ({ save: handleSave }))

    const loading = tracksQuery.loading || stagesQuery.loading || categoriesQuery.loading
    const interactive = canEdit && isEditing

    return (
      <ProfileSection title="Journey">
        {loading ? (
          <Text color="fg.muted">Loading journey tracks…</Text>
        ) : groups.length === 0 ? (
          <Text color="fg.muted">No journey tracks configured.</Text>
        ) : (
          <Stack gap="4">
            <Table.Root striped>
              <Table.Head>
                <Table.Row>
                  <Table.Header>Track</Table.Header>
                  {stages.map((stage) => (
                    <Table.Header key={stage.id} style={{ textAlign: 'center' }}>
                      {stage.label || stage.slug}
                    </Table.Header>
                  ))}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {allRows.map((row) => {
                  if (row.type === 'category') {
                    return (
                      <Table.Row key={row.key}>
                        <Table.Cell colSpan={1 + stages.length} style={{ fontWeight: 600, color: '#6b7280' }}>
                          {row.label}
                        </Table.Cell>
                      </Table.Row>
                    )
                  }
                  const track = row.track
                  const currentStage = journey[track.id]
                  return (
                    <Table.Row key={row.key}>
                      <Table.Cell>{track.name}</Table.Cell>
                      {stages.map((stage) => (
                        <Table.Cell key={stage.id} style={{ textAlign: 'center' }}>
                          {interactive ? (
                            <HStack justifyContent="center">
                              <input
                                type="radio"
                                name={`journey-${track.id}`}
                                value={stage.id}
                                checked={currentStage === stage.id}
                                onChange={() => handleStageChange(track.id, stage.id)}
                                aria-label={`${track.name} — ${stage.label || stage.slug}`}
                                style={{ cursor: 'pointer' }}
                              />
                            </HStack>
                          ) : currentStage === stage.id ? (
                            <Badge
                              colorPalette="gray"
                              style={stage.color ? { backgroundColor: stage.color, color: '#ffffff' } : undefined}
                            >
                              {stage.label || stage.slug}
                            </Badge>
                          ) : null}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table.Root>
            {canEdit && !isEditing && (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit journey
              </Button>
            )}
          </Stack>
        )}
      </ProfileSection>
    )
  },
)
