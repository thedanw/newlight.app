import { type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import type { DragItem } from '../types'

export interface SortableItemHelpers {
  /** Ref to attach to the caller's drag handle element. */
  handleRef: (element: Element | null) => void
  /** Whether this item is currently being dragged. */
  isDragging: boolean
  /** Whether this item is the active drag source. */
  isDragSource: boolean
  /** Whether this item is the current drop target. */
  isDropTarget: boolean
}

export interface SortableItemProps {
  item: DragItem
  index: number
  children?: ReactNode | ((helpers: SortableItemHelpers) => ReactNode)
}

export function SortableItem({ item, index, children }: SortableItemProps) {
  const {
    isDragging,
    isDragSource,
    isDropTarget,
    handleRef,
    ref,
  } = useSortable({
    id: item.id,
    index,
    group: 'list',
    type: 'item',
    data: { label: item.label, ...item.data },
  })

  const helpers: SortableItemHelpers = {
    handleRef,
    isDragging,
    isDragSource,
    isDropTarget,
  }

  return (
    <div
      ref={ref}
      data-sortable-id={String(item.id)}
      data-sortable-index={index}
      data-sortable-source={isDragSource ? 'true' : undefined}
      data-sortable-target={isDropTarget ? 'true' : undefined}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {typeof children === 'function' ? (
        children(helpers)
      ) : (
        <>
          <button ref={handleRef} aria-label="Reorder item" type="button">
            ☰
          </button>
          {children ?? <span>{item.label}</span>}
        </>
      )}
    </div>
  )
}
