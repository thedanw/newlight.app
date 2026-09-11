import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import { Box } from 'styled-system/jsx';
import { DraggableHandle } from './DraggableHandle';
import { useDragndropDraggable } from '../hooks/useDragndrop';
import type { DragItem } from '../types';

interface DraggableItemRootProps {
  item: DragItem;
  children: React.ReactNode;
  /** Optional custom className */
  className?: string;
}

interface DraggableItemHandleProps {
  item: DragItem;
  /** Optional custom aria-label */
  'aria-label'?: string;
}

interface DraggableItemPreviewProps {
  item: DragItem;
  children: React.ReactNode;
}

interface DraggableItemProps {
  item: DragItem;
  children: React.ReactNode;
}

/**
 * DraggableItem.Root - The main draggable container
 * Wraps content and provides drag functionality
 */
export const DraggableItemRoot = forwardRef<HTMLDivElement, DraggableItemRootProps>(
  ({ item, children, className = '', ...props }, ref) => {
    const { ref: dragRef, isDragging, isDragSource } = useDragndropDraggable(item);

    // Combine refs
    const combinedRef = (element: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(element);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
      dragRef(element);
    };

    return (
      <Box
        ref={combinedRef}
        className={className}
        data-draggable-item={item.id}
        data-dragging={isDragging ? 'true' : 'false'}
        data-drag-source={isDragSource ? 'true' : 'false'}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

DraggableItemRoot.displayName = 'DraggableItemRoot';

/**
 * DraggableItem.Handle - The drag handle (uses DraggableHandle internally)
 */
export const DraggableItemHandle = forwardRef<HTMLButtonElement, DraggableItemHandleProps>(
  ({ item, 'aria-label': ariaLabel = 'Reorder item', ...props }, ref) => {
    return (
      <DraggableHandle
        ref={ref}
        item={item}
        aria-label={ariaLabel}
        {...props}
      />
    );
  }
);

DraggableItemHandle.displayName = 'DraggableItemHandle';

/**
 * DraggableItem.Preview - The preview shown while dragging
 * Renders in the DragOverlay
 */
export const DraggableItemPreview = ({ item, children }: DraggableItemPreviewProps) => {
  return (
    <Box
      data-drag-preview={item.id}
      boxShadow="lg"
      bg="bg.default"
      borderWidth="1px"
      borderColor="border.emphasis"
      rounded="md"
      p="3"
      minW="44px"
      minH="44px"
    >
      {children}
    </Box>
  );
};

DraggableItemPreview.displayName = 'DraggableItemPreview';

/**
 * DraggableItem - Compound component wrapper
 * Usage:
 * <DraggableItem item={item}>
 *   <DraggableItem.Handle item={item} />
 *   <DraggableItem.Root item={item}>Content</DraggableItem.Root>
 *   <DraggableItem.Preview item={item}>Preview</DraggableItem.Preview>
 * </DraggableItem>
 */
export const DraggableItem = forwardRef<HTMLDivElement, DraggableItemProps>(
  ({ item, children }, ref) => {
    const { ref: dragRef, isDragging, isDragSource } = useDragndropDraggable(item);

    // Combine refs
    const combinedRef = (element: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(element);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
      dragRef(element);
    };

    return (
      <Box
        ref={combinedRef}
        data-draggable-item={item.id}
        data-dragging={isDragging ? 'true' : 'false'}
        data-drag-source={isDragSource ? 'true' : 'false'}
      >
        {children}
      </Box>
    );
  }
) as ForwardRefExoticComponent<DraggableItemProps & RefAttributes<HTMLDivElement>> & {
  Root: typeof DraggableItemRoot;
  Handle: typeof DraggableItemHandle;
  Preview: typeof DraggableItemPreview;
};

DraggableItem.displayName = 'DraggableItem';

// Attach sub-components for compound component pattern
DraggableItem.Root = DraggableItemRoot;
DraggableItem.Handle = DraggableItemHandle;
DraggableItem.Preview = DraggableItemPreview;