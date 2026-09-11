import { useCallback, useId, useMemo, useState, type ReactNode } from 'react';
import { VStack } from 'styled-system/jsx';
import { flattenTree, type FlattenedTreeNode } from '../utils/flattenTree';
import { reorderTree } from '../utils/reorderTree';
import { TreeNode } from './TreeNode';
import type { TreeNode as TreeNodeType } from '../types';

export interface SortableTreeProps<TData = unknown> {
  /** The nested tree data */
  tree: TreeNodeType<TData>[];
  /** Callback fired when the tree is reordered */
  onReorder: (tree: TreeNodeType<TData>[]) => void;
  /** Optional render prop for custom node content */
  renderNode?: (node: TreeNodeType<TData>, depth: number) => ReactNode;
  /** Optional gap between nodes */
  gap?: string;
}

/**
 * SortableTree - A hierarchical tree with drag-and-drop reordering.
 * Flattens the tree into a single sortable group (per dnd-kit docs pattern),
 * filters rows by expanded state, and calls onReorder with the new nested tree.
 */
export function SortableTree<TData = unknown>({
  tree,
  onReorder,
  renderNode,
  gap = '0',
}: SortableTreeProps<TData>) {
  // Unique sortable group per tree instance — prevents cross-tree reordering
  // when multiple SortableTree components share the same DragDropProvider.
  const group = useId();

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

  // Build a lookup of node -> hasChildren from the original tree
  const hasChildrenMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const walk = (nodes: TreeNodeType<TData>[]) => {
      for (const node of nodes) {
        map[node.id] = !!(node.children && node.children.length > 0);
        if (node.children) walk(node.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  // Build a lookup of node -> original node (with children) for renderNode
  const nodeMap = useMemo(() => {
    const map: Record<string, TreeNodeType<TData>> = {};
    const walk = (nodes: TreeNodeType<TData>[]) => {
      for (const node of nodes) {
        map[node.id] = node;
        if (node.children) walk(node.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  // Flatten, then filter out nodes under any collapsed ancestor
  const visibleItems = useMemo(() => {
    const { items } = flattenTree(tree);
    return items.filter((item) => {
      // Always show root nodes
      if (item.parentId === null) return true;
      // Show node only if ALL its ancestors are expanded.
      // `path` includes the node itself, so check every entry but the last.
      return item.path.slice(0, -1).every((ancestorId) => expanded[ancestorId] ?? true);
    });
  }, [tree, expanded]);

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleDragEnd = useCallback(
    (event: { active: { id: string }; over: { id: string } | null }) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const next = reorderTree(tree, active.id, over.id);
      onReorder(next as TreeNodeType<TData>[]);
    },
    [tree, onReorder]
  );

  return (
    <VStack gap={gap} alignItems="stretch" width="full">
      {visibleItems.map((item: FlattenedTreeNode<TreeNodeType<TData>>, index) => (
        <TreeNode
          key={item.id}
          node={(nodeMap[item.id] ?? item) as TreeNodeType<TData>}
          depth={item.depth}
          index={index}
          group={group}
          hasChildren={hasChildrenMap[item.id] ?? false}
          isExpanded={expanded[item.id] ?? true}
          onToggle={handleToggle}
          onDragEnd={handleDragEnd}
          renderNode={renderNode as ((node: { id: string; label: string; children?: Array<{ id: string; label: string; children?: unknown[] }>; data?: unknown }, depth: number) => ReactNode) | undefined}
        />
      ))}
    </VStack>
  );
}