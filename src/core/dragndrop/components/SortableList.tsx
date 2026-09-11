import { forwardRef, useState } from 'react';
import { Box, VStack } from 'styled-system/jsx';
import { useSortable } from '@dnd-kit/react/sortable';
import { useDragndropDraggable } from '../hooks/useDragndrop';
import type { DragItem } from '../types';

interface SortableListProps {
  /** Array of items to make sortable */
  items: DragItem[];
  /** Callback fired when items are reordered */
  onReorder: (items: DragItem[]) => void;
  /** Optional custom renderer for each item */
  renderItem?: (item: DragItem, index: number, isDragging: boolean) => React.ReactNode;
  /** Optional custom className */
  className?: string;
  /** Optional gap between items */
  gap?: string;
}

interface SortableItemProps {
  item: DragItem;
  index: number;
  renderItem?: (item: DragItem, index: number, isDragging: boolean) => React.ReactNode;
}

/**
 * SortableItem - Individual sortable item within a SortableList
 */
const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(
  ({ item, index, renderItem }, ref) => {
    const { ref: itemRef, isDragging, isDragSource } = useDragndropDraggable(item);
    const { ref: sortableRef, isDragging: sortableDragging, isDragSource: sortableSource } = useSortable({ 
      id: item.id,
      index,
    });

    // Combine refs: forwardRef + draggable ref + sortable ref
    const combinedRef = (element: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(element);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
      itemRef(element);
      sortableRef(element);
    };

    const mergedDragging = isDragging || sortableDragging;
    const mergedDragSource = isDragSource || sortableSource;

    return (
      <Box
        ref={combinedRef}
        data-draggable-item={item.id}
        data-dragging={mergedDragging ? 'true' : 'false'}
        data-drag-source={mergedDragSource ? 'true' : 'false'}
        role="listitem"
      >
        {renderItem ? renderItem(item, index, mergedDragging) : item.label}
      </Box>
    );
  }
);

SortableItem.displayName = 'SortableItem';

/**
 * SortableList - A sortable list component using @dnd-kit
 * Provides drag-and-drop reordering with keyboard accessibility
 * 
 * Usage:
 * <SortableList 
 *   items={items} 
 *   onReorder={setItems}
 *   renderItem={(item, index, isDragging) => (
 *     <DraggableItem item={item}>
 *       <DraggableItem.Handle item={item} />
 *       {item.label}
 *     </DraggableItem>
 *   )}
 * />
 */
export const SortableList = forwardRef<HTMLDivElement, SortableListProps>(
  ({ items, onReorder, renderItem, className = '', gap = '2', ...props }, ref) => {
    // Handle reorder - we need to track items locally to compute new order
    const [localItems, setLocalItems] = useState(items);
    
    // Sync local items with props
    if (localItems.length !== items.length || localItems.some((item, i) => item.id !== items[i].id)) {
      setLocalItems(items);
    }

    return (
      <Box
        ref={ref}
        className={className}
        data-sortable-list
        {...props}
      >
        <VStack gap={gap} role="list" aria-label="Sortable list">
          {localItems.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              renderItem={renderItem}
            />
          ))}
        </VStack>
      </Box>
    );
  }
);

SortableList.displayName = 'SortableList';