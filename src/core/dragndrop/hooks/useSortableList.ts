import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { move } from '@dnd-kit/helpers';
import {
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Sensors,
} from '@dnd-kit/dom';
import type { DragItem } from '../types';

export interface UseSortableListOptions {
  /** Ordered items rendered by the caller. */
  items: DragItem[];
  /** Commit the final order when a drag completes. */
  onReorder: (items: DragItem[]) => void;
}

export interface UseSortableListReturn {
  /** Locally previewed order while a drag is active. */
  items: DragItem[];
  /** Sensors for DragDropProvider. */
  sensors: Sensors;
  /** Flat-list lifecycle callback. */
  handleDragStart: (event: DragStartEvent) => void;
  /** Flat-list lifecycle callback. */
  handleDragMove: (event: DragMoveEvent) => void;
  /** Optimistically update the preview as the source crosses items. */
  handleDragOver: (event: DragOverEvent) => void;
  /** Reset on cancellation or commit the final order. */
  handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * State and lifecycle helper for one flat sortable list.
 *
 * Sortable registration stays in the item component because `useSortable` must
 * run in the render phase. This hook only manages preview state and commits the
 * final order through the caller-controlled `items` prop.
 */
export function useSortableList({
  items,
  onReorder,
}: UseSortableListOptions): UseSortableListReturn {
  const [previewItems, setPreviewItems] = useState<DragItem[]>(items);
  const previewItemsRef = useRef(items);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
    previewItemsRef.current = items;
    setPreviewItems(items);
  }, [items]);

  const sensors = useMemo<Sensors>(() => [
    PointerSensor.configure({
      activationConstraints: (event, _source) => {
        if (event.pointerType === 'mouse') {
          return [new PointerActivationConstraints.Distance({ value: 5 })];
        }

        return [
          new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 }),
        ];
      },
    }),
    KeyboardSensor.configure({
      keyboardCodes: {
        start: ['Space', 'Enter'],
        cancel: ['Escape'],
        end: ['Space', 'Enter', 'Tab'],
        up: ['ArrowUp'],
        down: ['ArrowDown'],
        left: ['ArrowLeft'],
        right: ['ArrowRight'],
      },
    }),
  ], []);

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // Flat-list projection is handled by the native sortable implementation.
  }, []);

  const handleDragMove = useCallback((_event: DragMoveEvent) => {
    // Projection, if needed, belongs in the tree-specific hook.
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (event.operation.canceled) return;

    const current = previewItemsRef.current;
    const nextItems = move(current, event);

    if (nextItems !== current) {
      previewItemsRef.current = nextItems;
      setPreviewItems(nextItems);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (event.canceled || !event.operation.target) {
      const authoritativeItems = itemsRef.current;
      previewItemsRef.current = authoritativeItems;
      setPreviewItems(authoritativeItems);
      return;
    }

    const current = previewItemsRef.current;
    const nextItems = move(current, event);

    if (nextItems === current) return;

    previewItemsRef.current = nextItems;
    setPreviewItems(nextItems);
    onReorder(nextItems);
  }, [onReorder]);

  return {
    items: previewItems,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
  };
}