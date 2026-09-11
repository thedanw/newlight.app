import { useCallback } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useDragDropMonitor } from '@dnd-kit/react';
import type { DragEndEvent } from '@dnd-kit/react';

export interface UseSortableTreeParams {
  id: string;
  depth: number;
  parentId?: string | null;
  /** The index of the node within its flattened sortable group */
  index?: number;
  /** Sortable group — isolates this tree's items from other SortableTree instances */
  group?: string | number;
  /** Callback invoked when a drag operation ends for this node */
  onDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => void;
}

/**
 * Hook for sortable tree nodes
 * Extends useSortable with depth, parentId, and drag-end wiring via useDragDropMonitor.
 * Only the dragged node fires onDragEnd (source.id filter).
 */
export function useSortableTree(params: UseSortableTreeParams) {
  const { id, depth, parentId, index = 0, group, onDragEnd } = params;

  const sortable = useSortable({
    id,
    index,
    group,
    data: {
      depth,
      parentId,
    },
  });

  // Wire onDragEnd to the actual drag-end lifecycle event.
  // Only this node fires when source.id matches — avoids N redundant calls.
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { operation, canceled } = event;
      if (canceled) return;
      const source = operation.source;
      if (!source || source.id !== id) return;
      const target = operation.target;
      onDragEnd({
        active: { id: String(source.id) },
        over: target ? { id: String(target.id) } : null,
      });
    },
    [id, onDragEnd],
  );

  useDragDropMonitor({ onDragEnd: handleDragEnd });

  return {
    ...sortable,
    depth,
    parentId,
  };
}