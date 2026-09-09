import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { Button, Card, Field, Input, Reorder, Text } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
import { useJourneySettings } from '../lib/settings-hooks'
import {
  createJourneyCategory,
  createJourneyStage,
  createJourneyTrack,
  deleteJourneyStage,
  deleteJourneyTrack,
  saveJourneyCategory,
  saveJourneyStage,
  saveJourneyTrack,
} from '../lib/queries'
import {
  buildRows,
  deriveAssignments,
  gridCategoryId,
  gridTrackId,
} from '../lib/journey-grid-helpers'
import type { JourneyStage, JourneyTrack, JourneyTrackCategory } from '../lib/types'

const STAGE_COL_MIN = 120
const STAGE_COL_GAP = 4

/** Auto-generate a slug from a human-readable label (e.g. "Not Started" → "not-started") */
function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function JourneySettingsManager() {
  const { data, loading, error } = useJourneySettings()
  const [message, setMessage] = useState<string | null>(null)
  const [newTrackName, setNewTrackName] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newStageLabel, setNewStageLabel] = useState('')

  const originalRef = useRef(data)
  const [localTracks, setLocalTracks] = useState<JourneyTrack[]>([])
  const [localCategories, setLocalCategories] = useState<JourneyTrackCategory[]>([])
  const [localStages, setLocalStages] = useState<JourneyStage[]>([])
  const [rowOrder, setRowOrder] = useState<string[]>([])
  const [stageOrder, setStageOrder] = useState<string[]>([])

  // Track which stage is being edited (slug/label inline edit) and the draft values
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState('')
  const [editLabel, setEditLabel] = useState('')

  const columnDragRef = useRef<{ draggedId: string; startOrder: string[] } | null>(null)

  // Sync local state when data loads
  useEffect(() => {
    if (!data) return
    originalRef.current = data
    setLocalTracks(data.tracks)
    setLocalCategories(data.categories)
    setLocalStages(data.stages)
    const rows = buildRows(data.tracks, data.categories)
    setRowOrder(rows.map((r) => r.id))
    setStageOrder(
      data.stages
        .map((s) => s.id)
        .sort((a, b) => (data.stages.find((s) => s.id === a)?.sort_order ?? 0) - (data.stages.find((s) => s.id === b)?.sort_order ?? 0)),
    )
  }, [data])

  const rows = useMemo(() => {
    const categoriesById = new Map(localCategories.map((c) => [c.id, c]))
    const ordered: { id: string; type: 'category' | 'track'; label: string }[] = []
    for (const rowId of rowOrder) {
      if (rowId.startsWith('category:')) {
        const catId = rowId.slice('category:'.length)
        const cat = categoriesById.get(catId)
        if (cat) ordered.push({ id: rowId, type: 'category', label: cat.name })
      } else {
        const trackId = rowId.slice('track:'.length)
        const track = localTracks.find((t) => t.id === trackId)
        if (track) ordered.push({ id: rowId, type: 'track', label: track.name })
      }
    }
    return ordered
  }, [rowOrder, localTracks, localCategories])

  const stageMap = useMemo(() => {
    const map = new Map<string, JourneyStage>()
    for (const s of localStages) map.set(s.id, s)
    return map
  }, [localStages])

  // Stages ordered by stageOrder (draggable column order)
  const orderedStages = useMemo(() => {
    return stageOrder
      .map((id) => stageMap.get(id))
      .filter((stage): stage is JourneyStage => Boolean(stage))
  }, [stageOrder, stageMap])

  // Handlers
  const handleAddTrack = useCallback(async () => {
    if (!newTrackName.trim() || !data) return
    const saved = await createJourneyTrack(newTrackName.trim(), null, localTracks.length)
    setLocalTracks((cur) => [...cur, saved])
    setRowOrder((cur) => [...cur, gridTrackId(saved.id)])
    setNewTrackName('')
    setMessage('Track added.')
  }, [newTrackName, localTracks, data])

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim() || !data) return
    const saved = await createJourneyCategory(newCategoryName.trim(), null, localCategories.length)
    setLocalCategories((cur) => [...cur, saved])
    setRowOrder((cur) => [...cur, gridCategoryId(saved.id)])
    setNewCategoryName('')
    setMessage('Category added.')
  }, [newCategoryName, localCategories, data])

  const handleAddStage = useCallback(async () => {
    if (!newStageLabel.trim() || !data) return
    const slug = slugify(newStageLabel)
    if (!slug) return
    const saved = await createJourneyStage(slug, newStageLabel.trim(), localStages.length)
    setLocalStages((cur) => [...cur, saved])
    setStageOrder((cur) => [...cur, saved.id])
    setNewStageLabel('')
    setMessage('Stage added.')
  }, [newStageLabel, localStages, data])

  const handleDeleteTrack = useCallback(async (trackId: string) => {
    if (!data) return
    const target = prompt('Migration target track ID (leave blank to cancel):')
    if (!target) return
    try {
      await deleteJourneyTrack(trackId, target)
      setLocalTracks((cur) => cur.filter((t) => t.id !== trackId))
      setRowOrder((cur) => cur.filter((id) => id !== gridTrackId(trackId)))
      setMessage('Track deleted.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete track.')
    }
  }, [data])

  const handleDeleteStage = useCallback(async (stageId: string) => {
    if (!data) return
    try {
      await deleteJourneyStage(stageId)
      setLocalStages((cur) => cur.filter((s) => s.id !== stageId))
      setStageOrder((cur) => cur.filter((s) => s !== stageId))
      setMessage('Stage deleted.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete stage.')
    }
  }, [data])

  const handleEditStage = useCallback((stage: JourneyStage) => {
    setEditingStageId(stage.id)
    setEditSlug(stage.slug)
    setEditLabel(stage.label)
  }, [])

  const handleSaveEditStage = useCallback(async (stageId: string) => {
    const stage = localStages.find((s) => s.id === stageId)
    if (!stage || !editSlug.trim() || !editLabel.trim()) return
    try {
      await saveJourneyStage({ ...stage, slug: editSlug.trim(), label: editLabel.trim() })
      setLocalStages((cur) => cur.map((s) => (s.id === stageId ? { ...s, slug: editSlug.trim(), label: editLabel.trim() } : s)))
      setMessage('Stage updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update stage.')
    }
    setEditingStageId(null)
  }, [editSlug, editLabel, localStages])

  const handleSave = useCallback(async () => {
    setMessage(null)
    try {
      const derived = deriveAssignments(rows, localTracks, localCategories)
      const categoryPromises = derived.categories.map((cat) => saveJourneyCategory(cat))
      const trackPromises = derived.tracks.map((track) => saveJourneyTrack({ id: track.id, name: track.name, category_id: track.category_id, sort_order: track.sort_order }))
      const stagePromises = orderedStages.map((s, i) => saveJourneyStage({ ...s, sort_order: i }))
      await Promise.all([...categoryPromises, ...trackPromises, ...stagePromises])
      if (data) {
        originalRef.current = { ...data, tracks: derived.tracks, categories: derived.categories, stages: orderedStages }
      }
      setMessage('Saved.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to save.')
    }
  }, [rowOrder, localTracks, localCategories, localStages, data])

  const handleCancel = useCallback(() => {
    if (data) {
      setLocalTracks(data.tracks)
      setLocalCategories(data.categories)
      setLocalStages(data.stages)
      const rows = buildRows(data.tracks, data.categories)
      setRowOrder(rows.map((r) => r.id))
      setStageOrder(
        data.stages
          .map((s) => s.id)
          .sort((a, b) => (data.stages.find((s) => s.id === a)?.sort_order ?? 0) - (data.stages.find((s) => s.id === b)?.sort_order ?? 0)),
      )
    }
    setMessage(null)
    setNewTrackName('')
    setNewCategoryName('')
    setNewStageLabel('')
    setEditingStageId(null)
    setEditSlug('')
    setEditLabel('')
  }, [data])

  const isDirty =
    JSON.stringify(localTracks) !== JSON.stringify(data?.tracks ?? []) ||
    JSON.stringify(localCategories) !== JSON.stringify(data?.categories ?? []) ||
    JSON.stringify(localStages) !== JSON.stringify(data?.stages ?? []) ||
     JSON.stringify(rowOrder) !== JSON.stringify(buildRows(localTracks, localCategories).map((r) => r.id)) ||
     JSON.stringify(stageOrder) !== JSON.stringify(data?.stages.map((s) => s.id).sort((a, b) => (data!.stages.find((s) => s.id === a)!.sort_order) - (data!.stages.find((s) => s.id === b)!.sort_order)) ?? [])

  // Column drag handler
  const bindColumnDrag = useDrag(({ active: _active, movement: [_mx], down, first, last, target }) => {
    if (first) {
      const header = (target as HTMLElement | null)?.closest('[data-stage-id]')
      if (!header) return
      const stageId = header.getAttribute('data-stage-id')
      if (!stageId) return
      columnDragRef.current = {
        draggedId: stageId,
        startOrder: stageOrder,
      }
    }
    if (!down || !columnDragRef.current) return
    const pointerX = (target as HTMLElement).getBoundingClientRect().left
    const headers = Array.from(document.querySelectorAll('[data-stage-id]'))
    const draggedIdx = columnDragRef.current.startOrder.indexOf(columnDragRef.current.draggedId)
    if (draggedIdx === -1) return
    let insertIdx = draggedIdx
    headers.forEach((h, i) => {
      const rect = h.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      if (pointerX > mid) insertIdx = i
    })
    if (insertIdx !== draggedIdx) {
      const next = [...columnDragRef.current.startOrder]
      next.splice(draggedIdx, 1)
      next.splice(insertIdx, 0, columnDragRef.current.draggedId)
      columnDragRef.current.startOrder = next
      setStageOrder(next)
    }
    if (last) {
      columnDragRef.current = null
    }
  })

  if (loading) return <Text>Loading journey settings...</Text>
  if (error || !data) return <Text>{error?.message ?? 'Unable to load journey settings.'}</Text>

  // Shared grid column template — every row (header + <Reorder.Item>)
  // must use the same columns so cells align vertically.
  const gridColumns = `32px minmax(180px, 1fr) repeat(${orderedStages.length}, minmax(${STAGE_COL_MIN}px, 1fr)) 48px`

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Journey grid</Card.Title>
      </Card.Header>
      <Card.Body>
        <Stack gap="4">
          {message && <Text>{message}</Text>}

          {/* Add buttons */}
          <HStack gap="2" flexWrap="wrap">
            <Field.Root flex="1" minWidth="160px">
              <Field.Label>New track</Field.Label>
              <HStack>
                <Input value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} placeholder="Track name" />
                <Button type="button" onClick={handleAddTrack}>Add</Button>
              </HStack>
            </Field.Root>
            <Field.Root flex="1" minWidth="160px">
              <Field.Label>New category</Field.Label>
              <HStack>
                <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" />
                <Button type="button" onClick={handleAddCategory}>Add</Button>
              </HStack>
            </Field.Root>
            <Field.Root flex="1" minWidth="160px">
              <Field.Label>New stage</Field.Label>
              <HStack>
                <Input value={newStageLabel} onChange={(e) => setNewStageLabel(e.target.value)} placeholder="Stage label" />
                <Button type="button" onClick={handleAddStage}>Add</Button>
              </HStack>
            </Field.Root>
          </HStack>

          {/* Grid */}
          <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: gridColumns,
                gap: STAGE_COL_GAP,
                alignItems: 'center',
                minWidth: 'max-content',
              }}
            >
              {/* Header row */}
              <div />
              <div style={{ fontWeight: 600 }}>Track / Category</div>
              {orderedStages.map((stage) => (
                <div
                  key={stage.id}
                  data-stage-id={stage.id}
                  style={{
                    fontWeight: 600,
                    textAlign: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    touchAction: 'none',
                    padding: '8px 4px',
                    borderBottom: '2px solid var(--color-border, #e5e7eb)',
                  }}
                  {...bindColumnDrag()}
                >
                  <HStack gap="1" justifyContent="center">
                    {editingStageId === stage.id ? (
                      <>
                        <Input
                          size="xs"
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          placeholder="slug"
                          style={{ width: 'auto', minWidth: '80px' }}
                        />
                        <Input
                          size="xs"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="Label"
                          style={{ width: 'auto', minWidth: '80px' }}
                        />
                        <Button size="xs" variant="plain" onClick={() => handleSaveEditStage(stage.id)}>Save</Button>
                        <Button size="xs" variant="plain" onClick={() => setEditingStageId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <span>{stage.label || stage.slug}</span>
                        <Button size="xs" variant="plain" onClick={() => handleEditStage(stage)}>Edit</Button>
                        <Button size="xs" variant="plain" onClick={() => handleDeleteStage(stage.id)}>×</Button>
                      </>
                    )}
                  </HStack>
                </div>
              ))}
              <div /> {/* header placeholder for actions column */}

              {/* Rows */}
              <Reorder.Root
                values={rowOrder}
                onReorder={setRowOrder}
                style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}
              >
                {rows.map((row) => {
                  if (row.type === 'category') {
                    return (
                      <Reorder.Item
                        key={row.id}
                        value={row.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: gridColumns,
                          gap: STAGE_COL_GAP,
                          alignItems: 'center',
                          fontWeight: 600,
                          borderTop: '2px solid var(--color-border, #e5e7eb)',
                          color: '#6b7280',
                        }}
                      >
                        <div style={{ padding: '8px 4px 0' }} />
                        <div style={{ gridColumn: '2 / -1' }}>{row.label}</div>
                      </Reorder.Item>
                    )
                  }
                  const trackId = row.id.slice('track:'.length)
                  const track = localTracks.find((t) => t.id === trackId)!
                  return (
                    <Reorder.Item
                      key={row.id}
                      value={row.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: gridColumns,
                        gap: STAGE_COL_GAP,
                        alignItems: 'center',
                      }}
                    >
                      <Reorder.Handle style={{ cursor: 'grab', padding: '4px' }} />
                      <div style={{ padding: '4px' }}>{track.name}</div>
                      {orderedStages.map((stage) => (
                        <div key={stage.id} style={{ textAlign: 'center', padding: '4px' }}>
                          {stageMap.get(stage.id)?.label || stage.slug}
                        </div>
                      ))}
                      <div style={{ justifyContent: 'flex-end' }}>
                        <Button size="xs" variant="plain" onClick={() => handleDeleteTrack(track.id)}>Delete</Button>
                      </div>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Root>
            </div>
          </div>

          {/* Save / Cancel */}
          <HStack gap="3" justifyContent="flex-end">
            <Button variant="outline" onClick={handleCancel} disabled={!isDirty}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isDirty}>Save</Button>
          </HStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
