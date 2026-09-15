import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { move } from '@dnd-kit/helpers';
import { flattenTree, buildTree, getDescendants, getDragDepth, getProjection, type FlattenedTreeNode } from '../utils/tree';
import { createDefaultSensors } from '../sensors';
import type { TreeNode as TreeNodeType } from '../types';
import type { DragStartEvent, DragMoveEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/react';
import type { DragDropManager } from '@dnd-kit/abstract';

interface UseSortableTreeNodeOptions<TData = unknown> {
  /** The tree node */
  node: TreeNodeType<TData>;
  /** The flat index within the sortable group */
  index: number;
  /** Current depth in tree */
  depth: number;
  /** Parent node ID (null for root) */
  parentId: string | null;
  /** Whether the node has children */
  hasChildren: boolean;
  /** Whether the node is expanded */
  isExpanded: boolean;
  /** Callback to toggle expand/collapse */
  onToggle: (id: string) => void;
  /** Optional custom render node */
  renderNode?: (node: TreeNodeType<TData>, depth: number) => React.ReactNode;
  /** Optional custom render row (replaces entire row layout) */
  renderRow?: (node: TreeNodeType<TData>, depth: number, helpers: TreeNodeRowHelpers) => React.ReactNode;
  /** Indentation per depth level in px */
  indentation?: number;
}

/** Helpers passed to custom renderRow */
export interface TreeNodeRowHelpers {
  /** Ref to attach to the drag handle element */
  handleRef: (el: HTMLElement | null) => void;
  /** Whether this row is currently being dragged */
  isDragging: boolean;
  /** Whether this row is the drag source */
  isDragSource: boolean;
  /** Whether the node is expanded */
  isExpanded: boolean;
  /** Whether the node has children */
  hasChildren: boolean;
  /** Toggle expand/collapse for the node */
  onToggle: (id: string) => void;
}

interface UseSortableTreeOptions<TData = unknown> {
  /** The nested tree data */
  tree: TreeNodeType<TData>[];
  /** Callback fired when tree is reordered */
  onReorder: (tree: TreeNodeType<TData>[]) => void;
  /** Optional custom render node */
  renderNode?: (node: TreeNodeType<TData>, depth: number) => React.ReactNode;
  /** Optional custom render row */
  renderRow?: (node: TreeNodeType<TData>, depth: number, helpers: TreeNodeRowHelpers) => React.ReactNode;
  /** Indentation per depth level in px */
  indentation?: number;
  /** Gap between nodes */
  gap?: string;
}

/**
 * Hook for sortable tree functionality using dnd-kit v8+ hooks directly.
 * 
 * This replaces the old SortableTree wrapper component. Consumers should:
 * 1. Call this hook to get tree state and render helpers
 * 2. Render a DragDropProvider wrapping the tree
 * 3. Map over visibleItems to render TreeNode components
 * 
 * Usage:
 * ```tsx
 * const { visibleItems, flatIndexById, handleDragStart, handleDragMove, handleDragOver, handleDragEnd, sensors, handleToggle } = useSortableTree({ tree, onReorder });
 * 
 * return (
 *   <DragDropProvider sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
 *     <VStack gap={gap}>
 *       {visibleItems.map(item => (
 *         <TreeNode key={item.id} node={item} index={flatIndexById.get(item.id)!} ... />
 *       ))}
 *     </VStack>
 *     <DragOverlay dropAnimation={null}>{({ source }) => ...}</DragOverlay>
 *   </DragDropProvider>
 * );
 * ```
 */
export function useSortableTree<TData = unknown>({
  tree,
  onReorder,
  renderNode,
  renderRow,
  indentation = 24,
  gap = '0',
}: UseSortableTreeOptions<TData>) {
  // Tree flattening logic (kept from v2 - pure functions, unchanged)
  const [flattenedItems, setFlattenedItems] = React.useState<FlattenedTreeNode<TData>[]>(() =>
    flattenTree(tree)
  );
  const initialDepth = React.useRef(0);
  const sourceChildren = React.useRef<FlattenedTreeNode<TData>[]>([]);

  // Sync with external tree changes
  React.useEffect(() => {
    setFlattenedItems(flattenTree(tree));
  }, [tree]);

  // Expanded state
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
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

  const handleToggle = React.useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Item lookup
  const itemById = React.useMemo(() => {
    const map = new Map<string, FlattenedTreeNode<TData>>();
    for (const item of flattenedItems) map.set(item.id, item);
    return map;
  }, [flattenedItems]);

  // Flat index by ID
  const flatIndexById = React.useMemo(() => {
    const map = new Map<string, number>();
    flattenedItems.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [flattenedItems]);

  // Visible items (filtered by expanded state)
  const visibleItems = React.useMemo(() => {
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

  // Sensors (use createDefaultSensors for v2/v8 compatibility)
  const sensors = createDefaultSensors();

  // Drag lifecycle
  const handleDragStart = React.useCallback((event: DragStartEvent) => {
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
  }, [flattenedItems]);

  const handleDragMove = React.useCallback((event: DragMoveEvent, manager: DragDropManager) => {
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
  }, [flattenedItems, indentation]);

  const handleDragOver = React.useCallback((event: DragOverEvent, manager: DragDropManager) => {
    const { source, target } = event.operation;
    event.preventDefault();

    if (source && target && source.id !== target.id) {
      setFlattenedItems((items) => {
        const offsetLeft = manager.dragOperation.transform.x;
        const dragDepth = getDragDepth(offsetLeft, indentation);
        const projectedDepth = initialDepth.current + dragDepth;

        const { depth, parentId } = getProjection(items, target.id, projectedDepth);

        if (parentId === source.id) {
          return items;
        }

        const sortedItems = move(items, event);
        return sortedItems.map((item) =>
          item.id === source.id ? { ...item, depth, parentId } : item
        );
      });
    }
  }, [indentation]);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    if (event.canceled) {
      return setFlattenedItems(flattenTree(tree));
    }

    const updatedTree = buildTree([...flattenedItems, ...sourceChildren.current]);
    setFlattenedItems(flattenTree(updatedTree));
    onReorder(updatedTree);
  }, [flattenedItems, sourceChildren, tree, onReorder]);

  return {
    visibleItems,
    flatIndexById,
    expanded,
    handleToggle,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
  };
}