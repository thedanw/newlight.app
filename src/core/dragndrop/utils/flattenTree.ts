import type { TreeNode } from '../types';

export interface FlattenedTreeNode<T extends TreeNode = TreeNode> {
  id: string;
  label: string;
  depth: number;
  path: string[];
  parentId: string | null;
  data?: T['data'];
}

export interface FlattenTreeResult<T extends TreeNode = TreeNode> {
  items: FlattenedTreeNode<T>[];
  itemMap: Map<string, FlattenedTreeNode<T>>;
}

/**
 * Flattens a nested tree structure into a flat array with depth and path information.
 * Returns both the flat array and a Map for O(1) lookups.
 * 
 * @param tree - The nested tree to flatten
 * @returns Object containing items array and itemMap
 */
export function flattenTree<T extends TreeNode = TreeNode>(
  tree: T[],
  parentId: string | null = null,
  depth: number = 0,
  path: string[] = []
): FlattenTreeResult<T> {
  const items: FlattenedTreeNode<T>[] = [];
  const itemMap = new Map<string, FlattenedTreeNode<T>>();

  function traverse(nodes: TreeNode[], currentParentId: string | null, currentDepth: number, currentPath: string[]) {
    for (const node of nodes) {
      const newPath = [...currentPath, node.id];
      const flattened: FlattenedTreeNode<T> = {
        id: node.id,
        label: node.label,
        depth: currentDepth,
        path: newPath,
        parentId: currentParentId,
        data: node.data as T['data'],
      };

      items.push(flattened);
      itemMap.set(node.id, flattened);

      if (node.children && node.children.length > 0) {
        traverse(node.children, node.id, currentDepth + 1, newPath);
      }
    }
  }

  traverse(tree, parentId, depth, path);

  return { items, itemMap };
}