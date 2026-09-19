import React from 'react';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { VStack } from 'styled-system/jsx';
import { useSortableTree, type UseSortableTreeOptions } from '../hooks/useSortableTree';
import { TreeNode } from './TreeNode';
import { getDescendants } from '../utils/tree';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/abstract';

export interface SortableTreeProps<TData = unknown> extends UseSortableTreeOptions<TData> {
  group?: string | number;
}

const DEFAULT_INDENTATION = 24;

export function SortableTree<TData = unknown>({
  tree,
  onReorder,
  renderNode,
  renderRow,
  gap = '0',
  indentation = DEFAULT_INDENTATION,
  group = 'sortable-tree',
}: SortableTreeProps<TData>) {
  const {
    visibleItems,
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

  const [activeId, setActiveId] = React.useState<string | number | null>(null);

  const handleDragStartCb = React.useCallback(
    (event: DragStartEvent) => {
      const sid = event.operation?.source?.id;
      setActiveId(sid != null ? sid : null);
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

  const getChildCount = React.useCallback((nodeId: string | number) => {
    return getDescendants(flattenedItems, String(nodeId)).size;
  }, [flattenedItems]);

  const activeNode = activeId != null ? visibleItems.find((i) => i.id === activeId) : null;
  const childCount = activeNode ? getChildCount(activeNode.id) : 0;
  const activeLabel = (activeNode?.data as { label?: string } | undefined)?.label ?? (activeNode ? String(activeNode.id) : '');

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStartCb}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEndCb}
    >
      <VStack gap={gap} alignItems="stretch" width="full">
        {visibleItems.map((item, visibleIndex) => (
          <TreeNode
            key={String(item.id)}
            node={item}
            depth={item.depth}
            index={visibleIndex}
            parentId={item.parentId}
            group={group}
            hasChildren={!!(item.children && item.children.length > 0)}
            isExpanded={expanded[item.id] ?? true}
            onToggle={handleToggle}
            renderNode={renderNode}
            renderRow={renderRow}
          />
        ))}
      </VStack>
      <DragOverlay dropAnimation={null}>
        {activeId != null && activeNode ? (
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
