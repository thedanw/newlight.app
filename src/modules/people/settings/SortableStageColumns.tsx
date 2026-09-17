import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { DndContext as DragDropProvider, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useSortable, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { createDefaultSensors } from '@/core/dragndrop/sensors'
import type { JourneyStage } from '../lib/types'

/** Helpers passed to a custom `renderColumn` so callers can attach the drag
 * handle and react to drag state while keeping the sortable wiring inside
 * `SortableStageColumns`.
 */
export interface StageColumnHelpers {
  /** Ref to attach to the caller's drag handle element */
  handleRef: (el: HTMLElement | null) => void
  /** Whether this column is currently being dragged */
  isDragging: boolean
}

export interface SortableStageColumnsProps {
  /** Stages in display order */
  stages: JourneyStage[]
  /** Callback fired when stages are reordered (sort_order reassigned by position) */
  onReorder: (stages: JourneyStage[]) => void
  /** Optional render prop for custom column content (owns the drag handle via helpers) */
  renderColumn?: (stage: JourneyStage, helpers: StageColumnHelpers) => ReactNode
  /** Gap between columns in px */
  gap?: number
  /** Minimum column width in px */
  minWidth?: number
}

const DEFAULT_MIN_WIDTH = 120
const DEFAULT_GAP = 4

function StageColumn({
  stage,
  index,
  renderColumn,
  minWidth,
}: {
  stage: JourneyStage
  index: number
  renderColumn?: SortableStageColumnsProps['renderColumn']
  minWidth: number
}) {
  const { isDragging, attributes, listeners, setNodeRef, setActivatorNodeRef } = useSortable({
    id: stage.id,
    index,
    data: { label: stage.label ?? stage.slug },
  })

  return (
    <div
       ref={setNodeRef}
       data-stage-column={stage.id}
       aria-hidden={false}
      style={{
        flex: '1 1 0',
        minWidth,
        textAlign: 'center',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      {renderColumn ? (
        renderColumn(stage, { handleRef: setActivatorNodeRef, isDragging })
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <button
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
            aria-label={`Reorder ${stage.label ?? stage.slug}`}
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
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
          >
            <GripVertical size={16} />
          </button>
          <span style={{ userSelect: 'none', padding: '4px 8px' }}>{stage.label || stage.slug}</span>
        </div>
      )}
    </div>
  )
}

/**
 * SortableStageColumns - Horizontal sortable for journey stage columns.
 *
 * Owns its own `DragDropProvider` (isolating its drag context from the app-level
 * provider and any SortableTree instance) and uses `useSortable` per column with
 * `move()` on drag end. Columns keep the grid's `flex: 1 1 0; minWidth` layout so
 * header cells stay aligned with the row cells below.
 */
export function SortableStageColumns({
  stages,
  onReorder,
  renderColumn,
  gap = DEFAULT_GAP,
  minWidth = DEFAULT_MIN_WIDTH,
}: SortableStageColumnsProps) {
  const sensors = useMemo(() => createDefaultSensors(), [])
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeStage = activeId ? stages.find((s) => s.id === activeId) : null
  const activeLabel = String(activeStage?.label ?? activeStage?.slug ?? '')

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active?.id ?? null)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      if (event.canceled || !event.active || !event.over) return
      const sourceIndex = stages.findIndex((s) => s.id === event.active.id)
      const targetIndex = stages.findIndex((s) => s.id === event.over?.id)
      if (sourceIndex < 0 || targetIndex < 0) return
      const reordered = arrayMove(stages, sourceIndex, targetIndex)
      onReorder(reordered.map((s, i) => ({ ...s, sort_order: i })))
    },
    [stages, onReorder],
  )

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onBeforeDragStart={() => {
        // Blur any focused element before the drag starts so the source can be
        // marked aria-hidden without React 19's "focused descendant" warning.
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }}
    >
      <SortableContext items={stages.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'row', gap, alignItems: 'center' }}>
          {stages.map((stage, index) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              index={index}
              renderColumn={renderColumn}
              minWidth={minWidth}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeId && activeStage ? (
          <div
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radii-l2)',
              background: 'var(--colors-bg-surface)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              fontSize: 'var(--font-sizes-sm)',
              fontWeight: 500,
            }}
          >
            {activeLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DragDropProvider>
  )
}