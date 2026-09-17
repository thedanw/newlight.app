import { forwardRef, type ReactNode } from 'react'
import { Box } from 'styled-system/jsx'

export interface DroppableZoneProps {
  /** Unique identifier for this drop zone */
  zoneId: string
  /** Array of accepted item types (for validation) */
  accepts: string[]
  /** Custom children to render inside the drop zone */
  children?: ReactNode
  /** Optional className */
  className?: string
}

/**
 * DroppableZone - A simple drop zone component.
 * 
 * In v8+, this is a simple presentational component that marks a zone as droppable.
 * The actual droppable logic is handled by the parent SortableList/SortableTree
 * using useSortable and useDroppable hooks.
 * 
 * Usage:
 * ```tsx
 * <DroppableZone zoneId="my-zone" accepts={['field']}>
 *   <div>Drop content here</div>
 * </DroppableZone>
 * ```
 */
export const DroppableZone = forwardRef<HTMLDivElement, DroppableZoneProps>(
  ({ zoneId, accepts, children, className }, ref) => {
    return (
      <Box
        ref={ref}
        data-droppable-zone={zoneId}
        data-accepts={accepts.join(',')}
        className={className}
      >
        {children}
      </Box>
    )
  }
)

DroppableZone.displayName = 'DroppableZone'