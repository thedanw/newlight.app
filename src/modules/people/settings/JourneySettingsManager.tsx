import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CheckIcon, TrashIcon, PencilIcon, XIcon, PlusIcon, GripVertical, ChevronDown, SaveIcon } from 'lucide-react'
import { Button, Field, IconButton, Input, Popover, Text } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
import { useJourneySettings } from '../lib/settings-hooks'
import {
  createJourneyCategory,
  createJourneyStage,
  createJourneyTrack,
  deleteJourneyCategory,
  deleteJourneyStage,
  deleteJourneyTrack,
  saveJourneyCategory,
  saveJourneyStage,
  saveJourneyTrack,
} from '../lib/queries'
import { buildRows } from '../lib/journey-grid-helpers'
import type { JourneyStage, JourneyTrack, JourneyTrackCategory } from '../lib/types'
import { SortableTree } from '@/core/dragndrop/components/SortableTree'
import { tracksAndCategoriesToTree, treeToJourneyData } from '../lib/journey-tree-helpers'
import { SortableStageColumns } from './SortableStageColumns'

const STAGE_COL_MIN = 120
const STAGE_COL_GAP = 4

/**
 * Heading-style text that lives outside a heading tag (grid header cells,
 * category rows) must NOT hand-roll heading font CSS. Consume the shell
 * heading vars so BrandForm's bold/uppercase/accent knobs re-theme the grid
 * exactly like a real heading (ui-ux design rule).
 */
const headingCellStyle: CSSProperties = {
  fontFamily: 'var(--heading-font-family, inherit)',
  fontWeight: 'var(--heading-font-weight, 700)',
}

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
  const [stageOrder, setStageOrder] = useState<string[]>([])

  // Track which stage is being edited (label inline edit) and the draft value
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  // Track which track/category is being edited
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editTrackName, setEditTrackName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  // Sync local state when data loads
  useEffect(() => {
    if (!data) return
    originalRef.current = data
    setLocalTracks(data.tracks)
    setLocalCategories(data.categories)
    setLocalStages(data.stages)
    setStageOrder(
      data.stages
        .map((s) => s.id)
        .sort((a, b) => (data.stages.find((s) => s.id === a)?.sort_order ?? 0) - (data.stages.find((s) => s.id === b)?.sort_order ?? 0)),
    )
  }, [data])

  const rows = useMemo(() => buildRows(localTracks, localCategories), [localTracks, localCategories])

  const rowById = useMemo(() => {
    const map = new Map(rows.map((r) => [r.id, r]))
    return map
  }, [rows])

  // Nested tree for SortableTree (source of truth for row order + nesting)
  const treeNodes = useMemo(
    () => tracksAndCategoriesToTree(localTracks, localCategories),
    [localTracks, localCategories],
  )

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
  const handleTreeReorder = useCallback((newTree: Parameters<typeof treeToJourneyData>[0]) => {
    const { tracks, categories } = treeToJourneyData(newTree, localTracks, localCategories)
    setLocalTracks(tracks)
    setLocalCategories(categories)
  }, [localTracks, localCategories])

  const handleStageReorder = useCallback((reorderedStages: JourneyStage[]) => {
    setLocalStages(reorderedStages)
    setStageOrder(reorderedStages.map((s) => s.id))
  }, [])
  const handleAddTrack = useCallback(async () => {
    if (!newTrackName.trim() || !data) return
    const saved = await createJourneyTrack(newTrackName.trim(), null, localTracks.length)
    setLocalTracks((cur) => [...cur, saved])
    setNewTrackName('')
    setMessage('Track added.')
  }, [newTrackName, localTracks, data])

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim() || !data) return
    const saved = await createJourneyCategory(newCategoryName.trim(), null, localCategories.length)
    setLocalCategories((cur) => [...cur, saved])
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

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    if (!data) return
    const target = prompt('Migration target category ID (leave blank to cancel):')
    if (!target) return
    try {
      await deleteJourneyCategory(categoryId, target)
      setLocalCategories((cur) => cur.filter((c) => c.id !== categoryId))
      setMessage('Category deleted.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete category.')
    }
  }, [data])

   const handleEditStage = useCallback((stage: JourneyStage) => {
     setEditingStageId(stage.id)
     setEditLabel(stage.label)
   }, [])
  const handleEditTrack = useCallback((track: JourneyTrack) => {
    setEditingTrackId(track.id)
    setEditTrackName(track.name)
  }, [])

  const handleEditCategory = useCallback((category: JourneyTrackCategory) => {
    setEditingCategoryId(category.id)
    setEditCategoryName(category.name)
  }, [])

  const handleSaveEditTrack = useCallback(async (trackId: string) => {
    const track = localTracks.find((t) => t.id === trackId)
    if (!track || !editTrackName.trim()) return
    try {
      await saveJourneyTrack({ ...track, name: editTrackName.trim() })
      setLocalTracks((cur) => cur.map((t) => (t.id === trackId ? { ...t, name: editTrackName.trim() } : t)))
      setMessage('Track updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update track.')
    }
    setEditingTrackId(null)
  }, [editTrackName, localTracks])

  const handleSaveEditCategory = useCallback(async (categoryId: string) => {
    const category = localCategories.find((c) => c.id === categoryId)
    if (!category || !editCategoryName.trim()) return
    try {
      await saveJourneyCategory({ ...category, name: editCategoryName.trim() })
      setLocalCategories((cur) => cur.map((c) => (c.id === categoryId ? { ...c, name: editCategoryName.trim() } : c)))
      setMessage('Category updated.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update category.')
    }
    setEditingCategoryId(null)
  }, [editCategoryName, localCategories])
   const handleSaveEditStage = useCallback(async (stageId: string) => {
     const stage = localStages.find((s) => s.id === stageId)
     if (!stage || !editLabel.trim()) return
     try {
       await saveJourneyStage({ ...stage, label: editLabel.trim() })
       setLocalStages((cur) => cur.map((s) => (s.id === stageId ? { ...s, label: editLabel.trim() } : s)))
       setMessage('Stage updated.')
     } catch (err) {
       setMessage(err instanceof Error ? err.message : 'Unable to update stage.')
     }
     setEditingStageId(null)
   }, [editLabel, localStages])

  const handleSave = useCallback(async () => {
    setMessage(null)
    try {
      const derived = treeToJourneyData(treeNodes, localTracks, localCategories)
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
  }, [treeNodes, localTracks, localCategories, orderedStages, data])

  const handleCancel = useCallback(() => {
    if (data) {
      setLocalTracks(data.tracks)
      setLocalCategories(data.categories)
      setLocalStages(data.stages)
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
     setEditLabel('')
     setEditingTrackId(null)
     setEditTrackName('')
     setEditingCategoryId(null)
     setEditCategoryName('')
   }, [data])

  const isDirty =
    JSON.stringify(localTracks) !== JSON.stringify(data?.tracks ?? []) ||
    JSON.stringify(localCategories) !== JSON.stringify(data?.categories ?? []) ||
    JSON.stringify(localStages) !== JSON.stringify(data?.stages ?? []) ||
     JSON.stringify(stageOrder) !== JSON.stringify(data?.stages.map((s) => s.id).sort((a, b) => (data!.stages.find((s) => s.id === a)!.sort_order) - (data!.stages.find((s) => s.id === b)!.sort_order)) ?? [])

   if (loading) return <Text>Loading journey settings...</Text>
   if (error || !data) return <Text>{error?.message ?? 'Unable to load journey settings.'}</Text>

   // Shared grid column template — every row (header + <Reorder.Item>)
   // must use the same columns so cells align vertically.
   const gridColumns = `32px minmax(180px, 1fr) repeat(${orderedStages.length}, minmax(${STAGE_COL_MIN}px, 1fr)) 48px`

  return (
        <Stack gap="4">
          {message && <Text>{message}</Text>}

          {/* Add buttons — popover with save/cancel */}
          <HStack gap="2" flexWrap="wrap" justify="end">
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button variant="solid">
                  <HStack gap="1"><PlusIcon size={14} />Track</HStack>
                </Button>
              </Popover.Trigger>
              <Popover.Content style={{ minWidth: '200px' }}>
                <Field.Root>
                  <Field.Label>Track name</Field.Label>
                  <HStack gap="1">
                    <Input
                      value={newTrackName}
                      onChange={(e) => setNewTrackName(e.target.value)}
                      placeholder="Track name"
                    />
                    <IconButton variant="plain" aria-label="Save" onClick={handleAddTrack}>
                      <CheckIcon size={14} />
                    </IconButton>
                    <Popover.CloseTrigger asChild>
                      <IconButton variant="plain" aria-label="Cancel" onClick={() => { setNewTrackName(''); }}>
                        <XIcon size={14} />
                      </IconButton>
                    </Popover.CloseTrigger>
                  </HStack>
                </Field.Root>
              </Popover.Content>
            </Popover.Root>

            <Popover.Root>
              <Popover.Trigger asChild>
                <Button variant="solid">
                  <HStack gap="1"><PlusIcon size={14} />Category</HStack>
                </Button>
              </Popover.Trigger>
              <Popover.Content style={{ minWidth: '200px' }}>
                <Field.Root>
                  <Field.Label>Category name</Field.Label>
                  <HStack gap="1">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                    />
                    <IconButton variant="plain" aria-label="Save" onClick={handleAddCategory}>
                      <CheckIcon size={14} />
                    </IconButton>
                    <Popover.CloseTrigger asChild>
                      <IconButton variant="plain" aria-label="Cancel" onClick={() => { setNewCategoryName(''); }}>
                        <XIcon size={14} />
                      </IconButton>
                    </Popover.CloseTrigger>
                  </HStack>
                </Field.Root>
              </Popover.Content>
            </Popover.Root>

            <Popover.Root>
              <Popover.Trigger asChild>
                <Button variant="solid">
                  <HStack gap="1"><PlusIcon size={14} />Stage</HStack>
                </Button>
              </Popover.Trigger>
              <Popover.Content style={{ minWidth: '200px' }}>
                <Field.Root>
                  <Field.Label>Stage label</Field.Label>
                  <HStack gap="1">
                    <Input
                      value={newStageLabel}
                      onChange={(e) => setNewStageLabel(e.target.value)}
                      placeholder="Stage label"
                    />
                    <IconButton variant="plain" aria-label="Save" onClick={handleAddStage}>
                      <CheckIcon size={14} />
                    </IconButton>
                    <Popover.CloseTrigger asChild>
                      <IconButton variant="plain" aria-label="Cancel" onClick={() => { setNewStageLabel(''); }}>
                        <XIcon size={14} />
                      </IconButton>
                    </Popover.CloseTrigger>
                  </HStack>
                </Field.Root>
              </Popover.Content>
            </Popover.Root>
          </HStack>

{/* Grid */}
           <div style={{ overflowX: 'auto' }}>
              <div
                style={{
                   display: 'grid',
                   gridTemplateColumns: gridColumns,
                   gap: STAGE_COL_GAP,
                   alignItems: 'center',
                   width: '100%',
                 }}
              >
                {/* Header row */}
                <div />
                <div style={headingCellStyle}>Track / Category</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: STAGE_COL_GAP,
                    gridColumn: '3 / -2',
                    alignItems: 'center',
                  }}
                >
                  <SortableStageColumns
                    stages={orderedStages}
                    onReorder={handleStageReorder}
                    gap={STAGE_COL_GAP}
                    minWidth={STAGE_COL_MIN}
                    renderColumn={(stage) => (
                      <div style={{ ...headingCellStyle }}>
                        <HStack gap="1" justifyContent="center" style={{ width: '100%' }}>
                          {editingStageId === stage.id ? (
                            <>
                              <Input
                                size="xs"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                placeholder="Label"
                              />
                              <IconButton size="xs" variant="plain" aria-label="Save stage" onClick={() => handleSaveEditStage(stage.id)}>
                                <SaveIcon size={14} />
                              </IconButton>
                              <IconButton size="xs" variant="plain" aria-label="Delete stage" onClick={() => handleDeleteStage(stage.id)} colorPalette="red">
                                <TrashIcon size={14} />
                              </IconButton>
                              <IconButton size="xs" variant="plain" aria-label="Cancel edit" onClick={() => setEditingStageId(null)}>
                                <XIcon size={14} />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <span style={{ userSelect: 'none', padding: '4px 8px' }}>{stage.label || stage.slug}</span>
                              <IconButton
                                size="xs"
                                variant="plain"
                                aria-label="Edit stage"
                                onClick={() => handleEditStage(stage)}
                              >
                                <PencilIcon size={16} />
                              </IconButton>
                            </>
                          )}
                        </HStack>
                      </div>
                    )}
                  />
                </div>
                <div /> {/* header placeholder for actions column */}

              {/* Rows */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <SortableTree
                    tree={treeNodes}
                    onReorder={handleTreeReorder}
                    gap="0"
                    indentation={24}
                    renderRow={(node, depth, helpers) => {
                      const isCategory = node.data?.kind === 'category'
                      const row = rowById.get(node.id as string)
                      return (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: gridColumns,
                            gap: STAGE_COL_GAP,
                            alignItems: 'center',
                            borderTop: isCategory ? '2px solid var(--colors-border)' : undefined,
                            color: isCategory ? 'var(--colors-fg-muted)' : undefined,
                          }}
                        >
                          {/* Handle column */}
                          <button
                            ref={helpers.handleRef}
                            aria-label={`Reorder ${node.label}`}
                            type="button"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '44px',
                              height: '44px',
                              flexShrink: 0,
                              border: 'none',
                              background: 'transparent',
                              cursor: helpers.isDragging ? 'grabbing' : 'grab',
                              touchAction: 'none',
                            }}
                          >
                            <GripVertical size={16} />
                          </button>

                          {/* Label column */}
                          <div style={{ paddingLeft: depth * 24, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isCategory && helpers.hasChildren ? (
                              <button
                                aria-label={helpers.isExpanded ? 'Collapse' : 'Expand'}
                                type="button"
                                data-testid="tree-toggle"
                                onClick={() => helpers.onToggle(node.id as string)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  flexShrink: 0,
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                              >
                                <ChevronDown
                                  size={16}
                                  style={{
                                    transform: helpers.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                    transition: 'transform 150ms ease',
                                  }}
                                />
                              </button>
                            ) : (
                              <div style={{ width: '32px', height: '32px', flexShrink: 0 }} />
                            )}
                            <span
                              style={{ color: 'var(--colors-color-palette-a8)', fontSize: '2xl', fontFamily: 'ui-monospace', marginRight: '4px', opacity: 0.6 }}
                              suppressContentEditableWarning
                            >
                              {row?.connector ?? ''}
                            </span>
                            {isCategory ? (
                              editingCategoryId === node.id ? (
                                <>
                                  <Input
                                    size="xs"
                                    value={editCategoryName}
                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                    placeholder="Category name"
                                  />
                                  <IconButton size="xs" variant="plain" aria-label="Save category" onClick={() => handleSaveEditCategory(node.id)}>
                                    <SaveIcon size={14} />
                                  </IconButton>
                                  <IconButton size="xs" variant="plain" aria-label="Delete category" onClick={() => handleDeleteCategory(node.id)} colorPalette="red">
                                    <TrashIcon size={14} />
                                  </IconButton>
                                  <IconButton size="xs" variant="plain" aria-label="Cancel edit" onClick={() => setEditingCategoryId(null)}>
                                    <XIcon size={14} />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <span>{node.label}</span>
                                  <IconButton
                                    size="xs"
                                    variant="plain"
                                    aria-label="Edit category"
                                    onClick={() => handleEditCategory(rowById.get(node.id) as JourneyTrackCategory)}
                                  >
                                    <PencilIcon size={16} />
                                  </IconButton>
                                </>
                              )
                            ) : (
                              editingTrackId === node.id ? (
                                <>
                                  <Input
                                    size="xs"
                                    value={editTrackName}
                                    onChange={(e) => setEditTrackName(e.target.value)}
                                    placeholder="Track name"
                                  />
                                  <IconButton size="xs" variant="plain" aria-label="Save track" onClick={() => handleSaveEditTrack((node.id as string).slice('track:'.length))}>
                                    <SaveIcon size={14} />
                                  </IconButton>
                                  <IconButton size="xs" variant="plain" aria-label="Delete track" onClick={() => handleDeleteTrack((node.id as string).slice('track:'.length))} colorPalette="red">
                                    <TrashIcon size={14} />
                                  </IconButton>
                                  <IconButton size="xs" variant="plain" aria-label="Cancel edit" onClick={() => setEditingTrackId(null)}>
                                    <XIcon size={14} />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <span>{node.label}</span>
                                  <IconButton
                                    size="xs"
                                    variant="plain"
                                    aria-label="Edit track"
                                    onClick={() => handleEditTrack(rowById.get(node.id) as JourneyTrack)}
                                  >
                                    <PencilIcon size={16} />
                                  </IconButton>
                                </>
                              )
                            )}
                          </div>

                          {/* Stage cells (track only) */}
                          {!isCategory && orderedStages.map((stage) => (
                            <div key={stage.id} style={{ textAlign: 'center', padding: '4px' }}>
                              {stageMap.get(stage.id)?.label || stage.slug}
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                </div>
            </div>
          </div>

          {/* Save / Cancel */}
          <HStack gap="3" justifyContent="flex-end">
            <Button variant="outline" onClick={handleCancel} disabled={!isDirty}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isDirty}>Save</Button>
          </HStack>
        </Stack>
  )
}
