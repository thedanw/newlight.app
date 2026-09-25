import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DndTreeDemo } from '../dnd-tree'

// Capture the drag lifecycle handlers SortableTree passes to its DragDropProvider
const { capturedHandlers } = vi.hoisted(() => ({
  capturedHandlers: {} as Record<string, (...args: any[]) => void>,
}))

vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({ children, onDragStart, onDragMove, onDragOver, onDragEnd }: any) => {
    capturedHandlers.onDragStart = onDragStart
    capturedHandlers.onDragMove = onDragMove
    capturedHandlers.onDragOver = onDragOver
    capturedHandlers.onDragEnd = onDragEnd
    return <div data-testid="drag-drop-provider">{children}</div>
  },
  DragOverlay: ({ children }: any) => {
    const content = typeof children === 'function' ? children(null) : children
    return <div data-testid="drag-overlay">{content}</div>
  },
}))

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

vi.mock('@/core/dragndrop/sensors', () => ({
  createDefaultSensors: vi.fn(() => []),
  createPointerSensorOptions: vi.fn(() => ({})),
  createKeyboardSensorOptions: vi.fn(() => ({})),
}))

const getNodeIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-tree-node]')).map((el) =>
    el.getAttribute('data-tree-node')
  )

describe('DndTreeDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hierarchical category data with 3+ levels', () => {
    const { container } = render(<DndTreeDemo />)
    const nodes = getNodeIds(container)
    // Level 0
    expect(nodes).toContain('ministries')
    expect(nodes).toContain('operations')
    expect(nodes).toContain('missions')
    // Level 1 (children of expanded Ministries)
    expect(nodes).toContain('children-youth')
    expect(nodes).toContain('worship')
    // Level 2
    expect(nodes).toContain('kindy')
    expect(nodes).toContain('primary')
    expect(nodes).toContain('youth')
    // Labels render
    expect(screen.getAllByText('Ministries').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Kindy').length).toBeGreaterThan(0)
  })

  it('renders the people org chart', () => {
    const { container } = render(<DndTreeDemo />)
    const nodes = getNodeIds(container)
    expect(nodes).toContain('lead-pastor')
    expect(nodes).toContain('ministry-lead')
    expect(nodes).toContain('ops-lead')
    expect(nodes).toContain('children-lead')
    expect(nodes).toContain('worship-lead')
    expect(nodes).toContain('facilities-coord')
    expect(nodes).toContain('finance-admin')
  })

  it('collapses and re-expands a node', () => {
    const { container } = render(<DndTreeDemo />)
    expect(getNodeIds(container)).toContain('children-youth')

    // Collapse Ministries via its specific toggle
    const ministriesToggle = container.querySelector(
      '[data-tree-node="ministries"] [data-testid="tree-toggle"]'
    ) as HTMLButtonElement
    fireEvent.click(ministriesToggle)
    expect(getNodeIds(container)).not.toContain('children-youth')

    // Re-expand
    fireEvent.click(ministriesToggle)
    expect(getNodeIds(container)).toContain('children-youth')
  })
})