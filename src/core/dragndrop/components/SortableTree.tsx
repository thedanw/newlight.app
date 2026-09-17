import React from 'react';
import { DndContext as DragDropProvider, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { VStack } from 'styled-system/jsx';
import { useSortableTree, type UseSortableTreeOptions } from '../hooks/useSortableTree';
import { TreeNode } from './TreeNode';
import { getDescendants } from '../utils/tree';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

export interface SortableTreeProps<TData = unknown> extends UseSortableTreeOptions<TData> {}

const DEFAULT_INDENTATION = 24;

export function SortableTree<TData = unknown>({
  tree,
  onReorder,
  renderNode,
  renderRow,
  gap = '0',
  indentation = DEFAULT_INDENTATION,
}: SortableTreeProps<TData>) {
  const {
    visibleItems,
    flatIndexById,
    expanded,
    handleToggle,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    flattenedItems,
  } = useSortableTree<TData>({
    tree,
    onReorder,
    indentation,
  });

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const handleDragStartCb = React.useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active?.id ?? null);
      handleDragStart(event);
    },
    [handleDragStart]
  );

  const handleDragEndCb = React.useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      handleDragEnd(event);
    },
    [handleDragEnd]
  );

  const getChildCount = React.useCallback((nodeId: string) => {
    return getDescendants(flattenedItems, nodeId).size;
  }, [flattenedItems]);

  const activeNode = activeId ? visibleItems.find((i) => i.id === activeId) : null;
  const childCount = activeNode ? getChildCount(activeNode.id) : 0;
  const activeLabel = activeNode?.data?.label ?? activeNode?.id ?? '';

  // Items array for SortableContext — list of IDs in current flattened order
  const sortableItemIds = React.useMemo(
    () => visibleItems.map((item) => String(item.id)),
    [visibleItems]
  );

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStartCb}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEndCb}
    >
      <SortableContext items={sortableItemIds} strategy={verticalListSortingStrategy}>
        <VStack gap={gap} alignItems="stretch" width="full">
          {visibleItems.map((item, visibleIndex) => (
            <TreeNode
              key={item.id}
              node={item}
              depth={item.depth}
              index={visibleIndex}
              parentId={item.parentId}
              hasChildren={!!(item.children && item.children.length > 0)}
              isExpanded={expanded[item.id] ?? true}
              onToggle={handleToggle}
              renderNode={renderNode}
              renderRow={renderRow}
            />
          ))}
        </VStack>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeId && activeNode ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radii-l2)',
              background: 'var(--colors-bg-surface)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span style={{ fontSize: 'var(--font-sizes-sm)', fontWeight: 500 }}>{String(activeLabel)}</span>
            {childCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  borderRadius: 'var(--radii-full)',
                  background: 'var(--colors-accent-default)',
                  color: 'var(--colors-accent-fg)',
                  fontSize: 'var(--font-sizes-xs)',
                  fontWeight: 600,
                }}
              >
                {childCount}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DragDropProvider>
  );
}
