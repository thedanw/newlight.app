import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, screen, cleanup } from '@testing-library/react'
import { JourneySettingsManager } from '../JourneySettingsManager'

// Capture the drag lifecycle handlers passed to each DragDropProvider.
// SortableTree's provider has onDragStart; SortableStageColumns' does not.
const { captured } = vi.hoisted(() => ({
  captured: [] as Array<Record<string, (...args: any[]) => void>>,
}))

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragMove, onDragOver, onDragEnd }: any) => {
    const handlers: Record<string, (...args: any[]) => void> = {}
    if (onDragStart) handlers.onDragStart = onDragStart
    if (onDragMove) handlers.onDragMove = onDragMove
    if (onDragOver) handlers.onDragOver = onDragOver
    if (onDragEnd) handlers.onDragEnd = onDragEnd
    captured.push(handlers)
    return <div data-testid="dnd-provider">{children}</div>
  },
  DragOverlay: ({ children }: any) => {
    const content = typeof children === 'function' ? children(null) : children
    return <div data-testid="drag-overlay">{content}</div>
  },
}))

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn(() => ({
    sortable: {},
    isDragging: false,
    isDropping: false,
    isDragSource: false,
    isDropTarget: false,
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    setActivatorNodeRef: vi.fn(),
    handleRef: vi.fn(),
    ref: vi.fn(),
    sourceRef: vi.fn(),
    targetRef: vi.fn(),
  })),
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  arrayMove: vi.fn((items: any[], source: number, target: number) => {
    const next = [...items]
    const [moved] = next.splice(source, 1)
    next.splice(target, 0, moved)
    return next
  }),
  verticalListSortingStrategy: vi.fn(),
  horizontalListSortingStrategy: vi.fn(),
}))

vi.mock('@/core/dragndrop/sensors', () => ({
  createDefaultSensors: vi.fn(() => []),
  createPointerSensorOptions: vi.fn(() => ({})),
  createKeyboardSensorOptions: vi.fn(() => ({})),
}))

vi.mock('../../lib/settings-hooks', () => ({
  useJourneySettings: vi.fn(),
}))

vi.mock('../../lib/queries', () => ({
  createJourneyTrack: vi.fn(),
  createJourneyCategory: vi.fn(),
  createJourneyStage: vi.fn(),
  deleteJourneyStage: vi.fn(),
  deleteJourneyTrack: vi.fn(),
  saveJourneyCategory: vi.fn(),
  saveJourneyStage: vi.fn(),
  saveJourneyTrack: vi.fn(),
}))

import { useJourneySettings } from '../../lib/settings-hooks'
import { saveJourneyCategory, saveJourneyTrack, saveJourneyStage } from '../../lib/queries'
import type { JourneyStage, JourneyTrack, JourneyTrackCategory } from '../../lib/types'

const track = (id: string, name: string, categoryId: string | null, sortOrder: number): JourneyTrack => ({
  id, name, category_id: categoryId, sort_order: sortOrder, elvanto_location_id: null, follow_elvanto: false, deleted_at: null,
})
const category = (id: string, name: string, sortOrder: number, parentId: string | null = null): JourneyTrackCategory => ({
  id, name, parent_id: parentId, sort_order: sortOrder,
})
const stage = (id: string, slug: string, label: string, sortOrder: number, isTerminal = false): JourneyStage => ({
  id, slug, label, color: null, sort_order: sortOrder, is_terminal: isTerminal,
})

const data = {
  tracks: [track('t1', 'Sundays', 'c1', 0), track('t2', 'Youth', null, 0)],
  categories: [category('c1', 'Location', 0)],
  stages: [stage('s1', 'not-started', 'Not Started', 0), stage('s2', 'done', 'Done', 1, true)],
}

const renderManager = () => {
  vi.mocked(useJourneySettings).mockReturnValue({ data, loading: false, error: null })
  return render(<JourneySettingsManager />)
}

// The component re-renders after its data-loading effect, so the DragDropProvider
// handlers are captured multiple times. Always use the MOST RECENT capture so the
// handlers reference the populated state (stageOrder / flattenedItems).
// Tree provider (SortableTree) has onDragStart; stage provider also has onDragStart now.
// Distinguish by presence of onDragOver (tree has it for depth projection, stage does not).
const treeHandlers = () => [...captured].reverse().find((h) => h.onDragOver)!
const stageHandlers = () => [...captured].reverse().find((h) => !h.onDragOver)!

describe('JourneySettingsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    captured.length = 0
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the dnd grid with tree rows and stage columns', () => {
    const { container } = renderManager()
    expect(container.querySelector('[data-tree-node="category:c1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tree-node="track:t1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-tree-node="track:t2"]')).toBeInTheDocument()
    expect(container.querySelector('[data-stage-column="s1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-stage-column="s2"]')).toBeInTheDocument()
  })

  it('reorders stage columns on drag end', () => {
    const { container } = renderManager()
    const handlers = stageHandlers()
    act(() => {
      handlers.onDragStart({ active: { id: 's1' } })
    })
    act(() => {
      handlers.onDragEnd({
        canceled: false,
        active: { id: 's1', index: 0 },
        over: { id: 's2', index: 1 },
      })
    })
    const columns = container.querySelectorAll('[data-stage-column]')
    expect(columns[0]).toHaveAttribute('data-stage-column', 's2')
    expect(columns[1]).toHaveAttribute('data-stage-column', 's1')
  })

  it('nests a track under a category on tree drag', () => {
    const { container } = renderManager()

    // Start dragging root track:t2 (flat index 2)
    act(() => {
      treeHandlers().onDragStart({ active: { id: 'track:t2' } })
    })
    // Drag over track:t1 with a horizontal offset → projected depth 1 → parent c1.
    // Re-fetch the handler each step: the SortableTree re-renders after every
    // state update, so the latest handler carries the updated flattenedItems.
    act(() => {
      treeHandlers().onDragOver({
        active: { id: 'track:t2', index: 2 },
        over: { id: 'track:t1', index: 1 },
        transform: { x: 24 },
      })
    })
    // End the drag — rebuilds the tree and fires onReorder
    act(() => {
      treeHandlers().onDragEnd({ canceled: false })
    })

    // track:t2 is now nested under category:c1 → visible order: c1, t2, t1
    const nodes = container.querySelectorAll('[data-tree-node]')
    expect(nodes[0]).toHaveAttribute('data-tree-node', 'category:c1')
    expect(nodes[1]).toHaveAttribute('data-tree-node', 'track:t2')
    expect(nodes[2]).toHaveAttribute('data-tree-node', 'track:t1')
  })

  it('saves tracks/categories/stages with tree-derived assignments', async () => {
    renderManager()

    // Nest track:t2 under category:c1 so the save payload reflects the tree
    act(() => {
      treeHandlers().onDragStart({ active: { id: 'track:t2' } })
    })
    act(() => {
      treeHandlers().onDragOver({
        active: { id: 'track:t2', index: 2 },
        over: { id: 'track:t1', index: 1 },
        transform: { x: 24 },
      })
    })
    act(() => {
      treeHandlers().onDragEnd({ canceled: false })
    })

    // Save is now enabled (isDirty). The main Save button has text content
    // "Save"; the popover IconButtons only carry aria-label="Save", so query by
    // text to disambiguate.
    const saveBtn = screen.getByText('Save').closest('button')!
    expect(saveBtn).not.toBeDisabled()
    await act(async () => {
      saveBtn.click()
    })

    expect(saveJourneyCategory).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', parent_id: null, sort_order: 0 }),
    )
    const t1Call = vi.mocked(saveJourneyTrack).mock.calls.find((c) => c[0].id === 't1')
    const t2Call = vi.mocked(saveJourneyTrack).mock.calls.find((c) => c[0].id === 't2')
    // After the drag, track:t2 sits before track:t1 inside category:c1
    expect(t1Call![0]).toEqual(expect.objectContaining({ id: 't1', category_id: 'c1', sort_order: 1 }))
    expect(t2Call![0]).toEqual(expect.objectContaining({ id: 't2', category_id: 'c1', sort_order: 0 }))
    expect(saveJourneyStage).toHaveBeenCalledTimes(2)
  })
})