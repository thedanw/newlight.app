import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSensor, useSensors } from '@dnd-kit/react';
import { PointerSensor, KeyboardSensor } from '@dnd-kit/dom';
import { move } from '@dnd-kit/sortable';
import type { DragItem } from '../types';
import type { DragStartEvent, DragMoveEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/react';
import type { DragDropManager } from '@dnd-kit/abstract';

interface UseSortableListOptions {
  /** Array of items to make sortable */
  items: DragItem[];
  /** Callback fired when items are reordered */
  onReorder: (items: DragItem[]) => void;
  /** Optional gap between items */
  gap?: string;
}

/** Return type for the hook */
export interface UseSortableListReturn {
  /** The items (synced with props) */
  items: DragItem[];
  /** Sensors for DragDropProvider */
  sensors: ReturnType<typeof useSensors>;
  /** Drag start handler */
  handleDragStart: (event: DragStartEvent) => void;
  /** Drag move handler */
  handleDragMove: (event: DragMoveEvent, manager: DragDropManager) => void;
  /** Drag over handler */
  handleDragOver: (event: DragOverEvent, manager: DragDropManager) => void;
  /** Drag end handler */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Render prop for each item - returns an object with ref, handleRef, isDragging, isDragSource */
  getItemProps: (item: DragItem, index: number) => {
    ref: (el: HTMLElement | null) => void;
    handleRef: (el: HTMLElement | null) => void;
    isDragging: boolean;
    isDragSource: boolean;
  };
}

/**
 * Hook for sortable flat list functionality using dnd-kit v8+ hooks directly.
 * 
 * This replaces the old SortableList wrapper component. Consumers should:
 * 1. Call this hook to get item props and handlers
 * 2. Render a DragDropProvider wrapping the list
 * 3. Map over items and use getItemProps to get refs and state
 * 
 * Usage:
 * ```tsx
 * const { items, sensors, handleDragStart, handleDragMove, handleDragOver, handleDragEnd, getItemProps } = useSortableList({ items, onReorder });
 * 
 * return (
 *   <DragDropProvider sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
 *     <VStack gap={gap} role="list">
 *       {items.map((item, index) => {
 *         const { ref, handleRef, isDragging, isDragSource } = getItemProps(item, index);
 *         return (
 *           <Box key={item.id} ref={ref} role="listitem" ...>
 *             <button ref={handleRef}>☰</button>
 *             {item.label}
 *           </Box>
 *         );
 *       })}
 *     </VStack>
 *   </DragDropProvider>
 * );
 * ```
 */
export function useSortableList({
  items,
  onReorder,
}: UseSortableListOptions): UseSortableListReturn {
  // Local items state (synced with props)
  const [localItems, setLocalItems] = React.useState(items);

  // Sync with external changes
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Sensors (v8+ pattern)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag lifecycle handlers
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    // No special handling needed for flat lists
  }, []);

  const handleDragMove = React.useCallback((event: DragMoveEvent, manager: DragDropManager) => {
    // No special handling needed for flat lists
  }, []);

  const handleDragOver = React.useCallback((event: DragOverEvent, manager: DragDropManager) => {
    event.preventDefault();
    const { source, target } = event.operation;
    if (source && target && source.id !== target.id) {
      setLocalItems((items) => move(items, event));
    }
  }, []);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    if (!event.canceled) {
      onReorder(localItems);
    }
  }, [localItems, onReorder]);

  // Get item props for rendering
  const getItemProps = React.useCallback((item: DragItem, index: number) => {
    const { ref, handleRef, isDragging, isDragSource } = useSortable({
      id: item.id,
      index,
      data: { label: item.label, ...item.data },
    });

    return { ref, handleRef, isDragging, isDragSource };
  }, []);

  return {
    items: localItems,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    getItemProps,
  };
}