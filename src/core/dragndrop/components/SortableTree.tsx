import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import type { DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/react';
import type { DragDropManager } from '@dnd-kit/dom';
import { move } from '@dnd-kit/helpers';
import { VStack } from 'styled-system/jsx';
import { createDefaultSensors } from '../sensors';
import {
  buildTree,
  flattenTree,
  getDescendants,
  getDragDepth,
  getProjection,
  type FlattenedTreeNode,
} from '../utils/tree';
import { TreeNode } from './TreeNode';
import type { TreeNode as TreeNodeType } from '../types';
import type { TreeNodeRenderRow } from './TreeNode';

export interface SortableTreeProps<TData = unknown> {
  /** The nested tree data */
  tree: TreeNodeType<TData>[];
  /** Callback fired when the tree is reordered */
  onReorder: (tree: TreeNodeType<TData>[]) => void;
  /** Optional render prop for custom node content */
  renderNode?: (node: TreeNodeType<TData>, depth: number) => ReactNode;
  /** Optional render prop for a fully custom row (replaces default layout) */
  renderRow?: TreeNodeRenderRow;
  /** Optional gap between nodes */
  gap?: string;
  /** Indentation width per depth level in px */
  indentation?: number;
}

const DEFAULT_INDENTATION = 24;

/**
 * SortableTree - A hierarchical tree with drag-and-drop reordering and nesting.
 *
 * Follows the official dnd-kit tree example:
 * - Flattens the tree into a single sortable group
 * - On drag start, removes the dragged node's descendants from the flat list
 *   (so dragging a parent drags its whole subtree)
 * - On drag move/over, computes the projected depth from the horizontal drag
 *   offset so items can be nested under other items
 * - On drag end, rebuilds the nested tree and calls `onReorder`
 *
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
  const [flattenedItems, setFlattenedItems] = useState<FlattenedTreeNode<TData>[]>(() =>
    flattenTree(tree)
  );
  const initialDepth = useRef(0);
  const sourceChildren = useRef<FlattenedTreeNode<TData>[]>([]);

  // Keep internal flattened state in sync when the tree prop changes externally.
  useEffect(() => {
    setFlattenedItems(flattenTree(tree));
  }, [tree]);

  // Track expanded state per node ID (default: all expanded)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const walk = (nodes: TreeNodeType<TData>[]) => {
      for (const node of nodes) {
        initial[node.id] = true;
        if (node.children) walk(node.children);
      }
    };
    walk(tree);
    return initial;
  });

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Build a lookup of node id -> flattened item for O(1) ancestor lookups.
  const itemById = useMemo(() => {
    const map = new Map<string, FlattenedTreeNode<TData>>();
    for (const item of flattenedItems) map.set(item.id, item);
    return map;
  }, [flattenedItems]);

  // Map node id -> flat list index. The docs (use-sortable.md) define `index` as
  // "position in the list", and the `move` helper relies on `source.index` matching
  // the item's position in `flattenedItems`. Using the flat index (rather than the
  // visible index) keeps that invariant even when some nodes are collapsed.
  const flatIndexById = useMemo(() => {
    const map = new Map<string, number>();
    flattenedItems.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [flattenedItems]);

  // Filter out nodes under any collapsed ancestor.
  //
  // The walk is cycle-safe: `getProjection` can transiently produce a
  // self-referential parentId (parentId === item.id) while dragging a parent over
  // the item directly below it with a horizontal offset. Without the visited set,
  // that state would make this loop spin forever and hard-freeze the browser.
  const visibleItems = useMemo(() => {
    return flattenedItems.filter((item) => {
      if (item.parentId === null) return true;
      const visited = new Set<string>();
      let parentId: string | null = item.parentId;
      while (parentId !== null && !visited.has(parentId)) {
        visited.add(parentId);
        if (!(expanded[parentId] ?? true)) return false;
        parentId = itemById.get(parentId)?.parentId ?? null;
      }
      return true;
    });
  }, [flattenedItems, expanded, itemById]);

  // --- Drag lifecycle (official dnd-kit tree pattern) ---

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { source } = event.operation;
      if (!source) return;

      const item = flattenedItems.find(({ id }) => id === source.id);
      if (!item) return;

      initialDepth.current = item.depth;

      setFlattenedItems((items) => {
        sourceChildren.current = [];
        const descendants = getDescendants(items, source.id);
        return items.filter((item) => {
          if (descendants.has(item.id)) {
            sourceChildren.current = [...sourceChildren.current, item];
            return false;
          }
          return true;
        });
      });
    },
    [flattenedItems]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent, manager: DragDropManager) => {
      if (event.defaultPrevented) return;
      const { source, target } = event.operation;
      if (!source || !target) return;

      const offsetLeft = manager.dragOperation.transform.x;
      const dragDepth = getDragDepth(offsetLeft, indentation);
      const projectedDepth = initialDepth.current + dragDepth;

      const { depth, parentId } = getProjection(flattenedItems, source.id, projectedDepth);

      if (source.data?.depth !== depth || source.data?.parentId !== parentId) {
        setFlattenedItems((items) =>
          items.map((item) =>
            item.id === source.id ? { ...item, depth, parentId } : item
          )
        );
      }
    },
    [flattenedItems, indentation]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent, manager: DragDropManager) => {
      const { source, target } = event.operation;
      event.preventDefault();

      if (source && target && source.id !== target.id) {
        setFlattenedItems((items) => {
          const offsetLeft = manager.dragOperation.transform.x;
          const dragDepth = getDragDepth(offsetLeft, indentation);
          const projectedDepth = initialDepth.current + dragDepth;

          const { depth, parentId } = getProjection(items, target.id, projectedDepth);

          // Guard: when the dragged item is the item directly above the target,
          // `getProjection` can return the source's own id as its parent (a
          // self-parent). That transient state is harmless in the official flat
          // example but would corrupt the tree here (and previously made the
          // visibleItems walk loop forever). Skip the update; the next drag
          // move/over event recomputes a valid projection.
          if (parentId === source.id) {
            return items;
          }

          const sortedItems = move(items, event);
          return sortedItems.map((item) =>
            item.id === source.id ? { ...item, depth, parentId } : item
          );
        });
      }
    },
    [indentation]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) {
        return setFlattenedItems(flattenTree(tree));
      }

      const updatedTree = buildTree([...flattenedItems, ...sourceChildren.current]);
      setFlattenedItems(flattenTree(updatedTree));
      onReorder(updatedTree);
    },
    [flattenedItems, sourceChildren, tree, onReorder]
  );

  const sensors = useMemo(() => createDefaultSensors(), []);

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
          const label = String(source?.data?.label ?? source?.id ?? '');
          const childCount = sourceChildren.current.length;
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
              <span style={{ fontSize: 'var(--font-sizes-sm)', fontWeight: 500 }}>{label}</span>
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