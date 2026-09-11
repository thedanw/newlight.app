import { forwardRef } from 'react';
import { IconButton } from '@/core/ui';
import { GripVertical } from 'lucide-react';
import { useDragndropDraggable } from '../hooks/useDragndrop';
import type { DragItem } from '../types';

interface DraggableHandleProps {
  item: DragItem;
  /** Optional custom aria-label */
  'aria-label'?: string;
}

/**
 * DraggableHandle - A Park UI component for drag handles
 * Renders an IconButton with GripVertical icon, ≥44px touch target
 * Forwards ref to the underlying button element
 */
export const DraggableHandle = forwardRef<HTMLButtonElement, DraggableHandleProps>(
  ({ item, 'aria-label': ariaLabel = 'Reorder item', ...props }, ref) => {
    const { handleRef, isDragging } = useDragndropDraggable(item);

    // Combine refs
    const combinedRef = (element: HTMLButtonElement | null) => {
      if (typeof ref === 'function') ref(element);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = element;
      handleRef(element);
    };

    return (
      <IconButton
        ref={combinedRef}
        aria-label={ariaLabel}
        boxSize="11" // 44px
        cursor={isDragging ? 'grabbing' : 'grab'}
        variant="plain"
        data-testid="draggable-handle"
        style={{ touchAction: 'none' }}
        {...props}
      >
        <GripVertical size="20" aria-hidden="true" />
      </IconButton>
    );
  }
);

DraggableHandle.displayName = 'DraggableHandle';