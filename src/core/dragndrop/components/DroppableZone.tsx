import { forwardRef } from 'react';
import { Box } from 'styled-system/jsx';
import { useDragndropDroppable } from '../hooks/useDragndrop';

interface DroppableZoneProps {
  /** Unique identifier for this drop zone */
  zoneId: string;
  /** Array of item types this zone accepts (empty = all) */
  accepts?: string[];
  /** Children to render inside the drop zone */
  children?: React.ReactNode;
  /** Optional custom className */
  className?: string;
}

/**
 * DroppableZone - A drop target zone for draggable items
 * Provides visual feedback when items are dragged over it
 * 
 * Usage:
 * <DroppableZone zoneId="my-zone" accepts={['person', 'group']}>
 *   Drop items here
 * </DroppableZone>
 */
export const DroppableZone = forwardRef<HTMLDivElement, DroppableZoneProps>(
  ({ zoneId, accepts = [], children, className = '', ...props }, ref) => {
    const { ref: dropRef, isOver, canDrop } = useDragndropDroppable(zoneId, accepts);

    // Combine refs
    const combinedRef = (element: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(element);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
      dropRef(element);
    };

    return (
      <Box
        ref={combinedRef}
        className={className}
        data-droppable-zone={zoneId}
        data-drop-target={isOver ? 'true' : 'false'}
        data-can-drop={canDrop ? 'true' : 'false'}
        data-accepts={accepts.join(',')}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

DroppableZone.displayName = 'DroppableZone';