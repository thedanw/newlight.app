import type { UniqueIdentifier } from '@dnd-kit/abstract';
import type { TreeNode } from '../types';

/**
 * A flattened tree node with parent/depth/index metadata.
 * Produced by flattenTree for use in a single sortable group.
 *
 * Each node keeps its original `children` array so callers can still
 * determine whether a node has children (e.g. for expand/collapse toggles).
 */
export interface FlattenedTreeNode<TData = unknown> extends TreeNode<TData> {
  /** Parent node ID (null for root) */
  parentId: string | null;
  /** Depth in the tree (0 = root) */
  depth: number;
  /** Index within the flattened list */
  index: number;
}

/**
 * Flatten a nested tree into a flat array with `parentId`/`depth`/`index` metadata.
 *
 * This is the official dnd-kit tree pattern: a single flat sortable group whose
 * rows carry their depth and parent so the container can compute nesting from
 * the horizontal drag offset.
 *
 * @param items - The nested tree nodes to flatten
 * @param parentId - Parent ID of the current level (internal recursion)
 * @param depth - Depth of the current level (internal recursion)
 */
export function flattenTree<TData = unknown>(
  items: TreeNode<TData>[],
  parentId: string | null = null,
  depth = 0
): FlattenedTreeNode<TData>[] {
  return items.reduce<FlattenedTreeNode<TData>[]>((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flattenTree(item.children ?? [], item.id, depth + 1),
    ];
  }, []);
}

/**
 * Rebuild a nested tree from a flattened list.
 *
 * Nodes whose `parentId` is null (or whose parent is missing) become roots.
 * The original `children` arrays are discarded and rebuilt from the flat order.
 *
 * @param flattenedItems - The flattened items to rebuild into a tree
 */
export function buildTree<TData = unknown>(
  flattenedItems: FlattenedTreeNode<TData>[]
): TreeNode<TData>[] {
  const nodes = new Map<string, TreeNode<TData>>();
  const roots: TreeNode<TData>[] = [];

  // Strip flattened-specific properties (parentId/depth/index) and the original
  // children arrays so the tree is rebuilt cleanly from the flat order. Empty
  // children arrays are omitted to match the TreeNode input format.
  const items = flattenedItems.map(
    ({ parentId: _p, depth: _d, index: _i, children: _c, ...rest }) => ({
      ...rest,
    })
  );

  // First pass: create all nodes in the map
  for (const item of items) {
    nodes.set(item.id, { ...item });
  }

  // Second pass: link children to parents
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const parentId = flattenedItems[i].parentId;

    if (parentId === null) {
      roots.push(nodes.get(item.id)!);
    } else {
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(nodes.get(item.id)!);
      } else {
        // Orphan: promote to root
        roots.push(nodes.get(item.id)!);
      }
    }
  }

  return roots;
}

/**
 * Compute the drag depth from the horizontal offset of the drag operation.
 *
 * @param offset - The horizontal drag offset in pixels
 * @param indentationWidth - The indentation width per depth level
 */
export function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

/**
 * Compute the projected depth and parent for a dragged item relative to a target.
 *
 * Clamps the projected depth to valid bounds (can't nest deeper than the
 * previous sibling + 1, can't go shallower than the next sibling) and derives
 * the parent ID from the surrounding items.
 *
 * @param items - The flattened items (without the dragged item's descendants)
 * @param targetId - The ID of the item currently being hovered
 * @param projectedDepth - The raw depth derived from the horizontal offset
 */
export function getProjection<TData = unknown>(
  items: FlattenedTreeNode<TData>[],
  targetId: UniqueIdentifier,
  projectedDepth: number
) {
  const targetItemIndex = items.findIndex(({ id }) => id === targetId);
  const previousItem = items[targetItemIndex - 1];
  const targetItem = items[targetItemIndex];
  const nextItem = items[targetItemIndex + 1];
  const maxDepth = getMaxDepth(targetItem, previousItem);
  const minDepth = getMinDepth(nextItem);
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = items
      .slice(0, targetItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth<TData = unknown>(
  targetItem: FlattenedTreeNode<TData> | undefined,
  previousItem: FlattenedTreeNode<TData> | undefined
) {
  if (!previousItem) return 0;

  return Math.min((targetItem?.depth ?? 0) + 1, previousItem.depth + 1);
}

function getMinDepth<TData = unknown>(nextItem: FlattenedTreeNode<TData> | undefined) {
  return nextItem ? nextItem.depth : 0;
}

/**
 * Get the set of all descendant IDs of a node (recursive).
 *
 * Used during drag start to remove the dragged node's entire subtree from the
 * flattened list so it can be re-attached on drop.
 *
 * @param items - The flattened items
 * @param parentId - The ID of the node whose descendants to collect
 */
export function getDescendants<TData = unknown>(
  items: FlattenedTreeNode<TData>[],
  parentId: UniqueIdentifier
): Set<UniqueIdentifier> {
  const directChildren = items.filter((item) => item.parentId === parentId);

  return directChildren.reduce((descendants, child) => {
    return new Set([
      ...descendants,
      child.id,
      ...getDescendants(items, child.id),
    ]);
  }, new Set<UniqueIdentifier>());
}