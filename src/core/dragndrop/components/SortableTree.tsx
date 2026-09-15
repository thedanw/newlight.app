import { useMemo, type ReactNode } from 'react';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { VStack } from 'styled-system/jsx';
import { useSortableTree, type UseSortableTreeOptions } from '../hooks/useSortableTree';
import { TreeNode } from './TreeNode';
import type { TreeNode as TreeNodeType } from '../types';
import type { TreeNodeRenderRow } from './TreeNode';

export interface SortableTreeProps<TData = unknown> extends UseSortableTreeOptions<TData> {}

const DEFAULT_INDENTATION = 24;

/**
 * SortableTree - A hierarchical tree with drag-and-drop reordering and nesting.
 * 
 * Uses the `useSortableTree` hook (dnd-kit v8+ pattern) for all tree logic.
 * Each tree renders its own `DragDropProvider`, isolating its drag context from
 * other SortableTree instances and the app-level provider.
 */
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
  } = useSortableTree<TData>({
    tree,
    onReorder,
    renderNode,
    renderRow,
    indentation,
    gap,
  });

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <VStack gap={gap} alignItems="stretch" width="full">
        {visibleItems.map((item) => (
          <TreeNode
            key={item.id}
            node={item}
            depth={item.depth}
            index={flatIndexById.get(item.id) ?? 0}
            parentId={item.parentId}
            hasChildren={!!(item.children && item.children.length > 0)}
            isExpanded={expanded[item.id] ?? true}
            onToggle={handleToggle}
            renderNode={renderNode}
            renderRow={renderRow}
          />
        ))}
      </VStack>
      <DragOverlay dropAnimation={null}>
        {(source) => {
          // Get child count from the source data (passed via useSortableTree)
          const childCount = source?.data?.childCount ?? 0;
          return (
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
              <span style={{ fontSize: 'var(--font-sizes-sm)', fontWeight: 500 }}>{String(source?.data?.label ?? source?.id ?? '')}</span>
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
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}