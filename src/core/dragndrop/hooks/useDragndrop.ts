import { useDraggable } from '@dnd-kit/react';
import { useDroppable } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { DragItem } from '../types';

/**
 * Hook for making an element draggable
 * Returns props to spread on the draggable element
 */
export function useDragndropDraggable(item: DragItem) {
  const { handleRef, ref, isDragging, isDropping, isDragSource } = useDraggable({
    id: item.id,
    data: {
      label: item.label,
      data: item.data,
      disabled: item.disabled,
    },
    disabled: item.disabled,
  });

  return {
    /** Ref to attach to the draggable element */
    ref,
    /** Handle ref for drag handle */
    handleRef,
    /** Whether the item is currently being dragged */
    isDragging,
    /** Whether the item is currently dropping */
    isDropping,
    /** Whether the item is the drag source */
    isDragSource,
    /** Item data */
    item,
  };
}

/**
 * Hook for making an element a drop zone
 */
export function useDragndropDroppable(zoneId: string, accepts: string[] = []) {
  const { ref, isDropTarget } = useDroppable({
    id: zoneId,
    data: { accepts },
  });

  return {
    ref,
    isOver: isDropTarget,
    canDrop: true, // useDroppable doesn't expose canDrop directly
    zoneId,
    accepts,
  };
}

/**
 * Hook for sortable items (lists, grids)
 */
export function useDragndropSortable(item: DragItem, index: number) {
  const { handleRef, ref, sourceRef, targetRef, isDragging, isDropping, isDragSource, isDropTarget } = useSortable({
    id: item.id,
    index,
    data: {
      label: item.label,
      data: item.data,
      disabled: item.disabled,
    },
    disabled: item.disabled,
  });

  return {
    ref,
    handleRef,
    sourceRef,
    targetRef,
    isDragging,
    isDropping,
    isDragSource,
    isDropTarget,
    item,
  };
}