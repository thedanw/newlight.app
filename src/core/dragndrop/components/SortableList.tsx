import { forwardRef, type ReactNode } from 'react';
import { Box, VStack } from 'styled-system/jsx';
import { useSortableList, type UseSortableListReturn } from '../hooks/useSortableList';
import type { DragItem } from '../types';

interface SortableListProps {
  /** Array of items to make sortable */
  items: DragItem[];
  /** Callback fired when items are reordered */
  onReorder: (items: DragItem[]) => void;
  /** Optional custom renderer for each item */
  renderItem?: (item: DragItem, index: number, isDragging: boolean) => ReactNode;
  /** Optional custom className */
  className?: string;
  /** Optional gap between items */
  gap?: string;
}

/**
 * SortableList - A sortable list component using dnd-kit v8+ hooks.
 * 
 * Uses the `useSortableList` hook which provides a `getItemProps` function
 * returning refs and drag state for each item. This replaces the old
 * `renderItem` prop pattern that caused parser bugs.
 * 
 * Usage:
 * ```tsx
 * <SortableList 
 *   items={items} 
 *   onReorder={setItems}
 *   renderItem={(item, index, isDragging) => (
 *     <div>Custom rendering</div>
 *   )}
 * />
 * ```
 */
export const SortableList = forwardRef<HTMLDivElement, SortableListProps>(
  ({ items, onReorder, renderItem, className = '', gap = '2', ...props }, ref) => {
    const list = useSortableList({ items, onReorder }) as UseSortableListReturn;

    return (
      <Box
        ref={ref}
        className={className}
        data-sortable-list
        {...props}
      >
        <VStack gap={gap} role="list" aria-label="Sortable list">
          {list.items.map((item, index) => {
            const { ref: itemRef, handleRef, isDragging, isDragSource } = list.getItemProps(item, index);
            return (
              <Box
                key={item.id}
                ref={itemRef}
                data-draggable-item={item.id}
                data-dragging={isDragging ? 'true' : 'false'}
                data-drag-source={isDragSource ? 'true' : 'false'}
                role="listitem"
              >
                {renderItem
                  ? renderItem(item, index, isDragging)
                  : (
                    <>
                      <button
                        ref={handleRef}
                        type="button"
                        aria-label="Reorder item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '44px',
                          height: '44px',
                          flexShrink: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          touchAction: 'none',
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="9" cy="5" r="1" />
                          <circle cx="9" cy="12" r="1" />
                          <circle cx="9" cy="19" r="1" />
                          <circle cx="15" cy="5" r="1" />
                          <circle cx="15" cy="12" r="1" />
                          <circle cx="15" cy="19" r="1" />
                        </svg>
                      </button>
                      <span>{item.label}</span>
                    </>
                  )}
              </Box>
            );
          })}
        </VStack>
      </Box>
    );
  }
);

SortableList.displayName = 'SortableList';