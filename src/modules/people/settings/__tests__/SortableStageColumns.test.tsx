import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { SortableStageColumns } from '../SortableStageColumns'
import type { JourneyStage } from '../../lib/types'

// Capture the drag lifecycle handlers SortableStageColumns passes to its DragDropProvider
const { capturedHandlers } = vi.hoisted(() => ({
  capturedHandlers: {} as Record<string, (...args: any[]) => void>,
}))

// Mock @dnd-kit/react so DragDropProvider renders children and captures handlers,
// and DragOverlay renders its render-prop output.
vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({ children, onDragEnd }: any) => {
    capturedHandlers.onDragEnd = onDragEnd
    return <div data-testid="stage-dnd-provider">{children}</div>
  },
  DragOverlay: ({ children }: any) => {
    const content = typeof children === 'function' ? children(null) : children
    return <div data-testid="stage-drag-overlay">{content}</div>
  },
}))

// Mock useSortable (used by StageColumn internally)
vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: vi.fn(() => ({
    sortable: {},
    isDragging: false,
    isDropping: false,
    isDragSource: false,
    isDropTarget: false,
    handleRef: vi.fn(),
    ref: vi.fn(),
    sourceRef: vi.fn(),
    targetRef: vi.fn(),
  })),
}))

// Mock move helper — reverse the array to simulate a real reorder so the test
// verifies the reordered stages flow through to onReorder.
vi.mock('@dnd-kit/helpers', () => ({
  move: vi.fn((items: any[]) => [...items].reverse()),
}))

// Mock sensors to avoid real sensor construction in JSDOM
vi.mock('@/core/dragndrop/sensors', () => ({
  createDefaultSensors: vi.fn(() => []),
}))

const stage = (id: string, slug: string, label: string, sortOrder: number, isTerminal = false): JourneyStage => ({
  id, slug, label, color: null, sort_order: sortOrder, is_terminal: isTerminal,
})

const stages = [
  stage('s1', 'not-started', 'Not Started', 0),
  stage('s2', 'in-progress', 'In Progress', 1),
  stage('s3', 'done', 'Done', 2, true),
]

const renderColumns = (props = {}) => {
  return render(<SortableStageColumns stages={stages} onReorder={vi.fn()} {...props} />)
}

describe('SortableStageColumns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all stage columns', () => {
    const { container } = renderColumns()
    expect(container.querySelector('[data-stage-column="s1"]')).toBeInTheDocument()
    expect(container.querySelector('[data-stage-column="s2"]')).toBeInTheDocument()
    expect(container.querySelector('[data-stage-column="s3"]')).toBeInTheDocument()
  })

  it('preserves flex layout on each column', () => {
    const { container } = renderColumns()
    const col = container.querySelector('[data-stage-column="s1"]')
    expect(col).toHaveStyle({ flex: '1 1 0' })
    expect(col).toHaveStyle({ minWidth: '120px' })
  })

  it('renders custom column content via renderColumn', () => {
    const renderColumn = (s: JourneyStage) => <span data-testid="custom-col">{s.label}</span>
    const { container } = renderColumns({ renderColumn })
    expect(container.querySelectorAll('[data-testid="custom-col"]').length).toBe(3)
  })

  it('calls onReorder with reordered stages when drag ends', () => {
    const onReorder = vi.fn()
    renderColumns({ onReorder })

    act(() => {
      capturedHandlers.onDragEnd({ canceled: false })
    })

    expect(onReorder).toHaveBeenCalledTimes(1)
    // move is mocked as reverse → stages flow through reversed with sort_order reassigned
    const reordered = onReorder.mock.calls[0][0]
    expect(reordered.map((s: JourneyStage) => s.id)).toEqual(['s3', 's2', 's1'])
    expect(reordered.map((s: JourneyStage) => s.sort_order)).toEqual([0, 1, 2])
  })

  it('does not call onReorder when drag is canceled', () => {
    const onReorder = vi.fn()
    renderColumns({ onReorder })

    act(() => {
      capturedHandlers.onDragEnd({ canceled: true })
    })

    expect(onReorder).not.toHaveBeenCalled()
  })
})