import type { TreeNode } from '../types';

/**
 * Reorders a tree by moving an item to a new position.
 * Returns a new tree (immutable) with the item moved.
 * 
 * @param tree - The tree to reorder
 * @param itemId - The ID of the item to move
 * @param targetId - The ID of the target item (or null for root level)
 * @returns New tree with item moved
 * @throws Error if item or target not found, or if moving to own descendant
 */
export function reorderTree(
  tree: TreeNode[],
  itemId: string,
  targetId: string | null
): TreeNode[] {
  // Deep clone the tree to avoid mutation
  const clonedTree = JSON.parse(JSON.stringify(tree)) as TreeNode[];

  // Find the item and its parent
  const foundItem = findNode(clonedTree, itemId);
  if (!foundItem) {
    throw new Error(`Item not found: ${itemId}`);
  }
  const item = foundItem.node;
  const itemParent = foundItem.parent;

  // Find the target and its parent
  const foundTarget = targetId !== null ? findNode(clonedTree, targetId) : null;
  if (targetId !== null && !foundTarget) {
    throw new Error(`Target not found: ${targetId}`);
  }
  const target = foundTarget?.node ?? null;
  const targetParent = foundTarget?.parent ?? null;

  // Check if moving item to be its own descendant
  if (targetId !== null && isDescendant([item], targetId)) {
    throw new Error('Cannot move item to be its own descendant');
  }

  // Remove item from its current position
  if (itemParent) {
    itemParent.children = itemParent.children?.filter(child => child.id !== itemId) || [];
  } else {
    // Item is at root level
    const rootIndex = clonedTree.findIndex(n => n.id === itemId);
    if (rootIndex !== -1) {
      clonedTree.splice(rootIndex, 1);
    }
  }

  // Insert item at new position
  if (targetId === null) {
    // Move to root level (append to end)
    clonedTree.push(item);
  } else if (targetParent && itemParent && targetParent.id === itemParent.id) {
    // Moving within same parent - insert before target
    const children = targetParent.children || [];
    const insertIndex = children.findIndex(child => child.id === targetId);
    if (insertIndex !== -1) {
      children.splice(insertIndex, 0, item);
    } else {
      children.push(item);
    }
    targetParent.children = children;
  } else if (targetParent) {
    // Target has a parent - insert as sibling of target (child of target's parent)
    const children = targetParent.children || [];
    const insertIndex = children.findIndex(child => child.id === targetId);
    if (insertIndex !== -1) {
      children.splice(insertIndex + 1, 0, item);
    } else {
      children.push(item);
    }
    targetParent.children = children;
  } else if (target) {
    // Target is at root level - insert as child of target
    target.children = target.children || [];
    target.children.push(item);
  }

  return clonedTree;
}

/**
 * Finds a node by ID in a tree, returning the node and its parent.
 */
function findNode(
  nodes: TreeNode[],
  id: string,
  parent: TreeNode | null = null
): { node: TreeNode; parent: TreeNode | null } | null {
  for (const node of nodes) {
    if (node.id === id) {
      return { node, parent };
    }
    if (node.children && node.children.length > 0) {
      const found = findNode(node.children, id, node);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Checks whether a node with the given ID exists within the subtree.
 */
function isDescendant(nodes: TreeNode[], ancestorId: string): boolean {
  for (const node of nodes) {
    if (node.id === ancestorId) return true;
    if (node.children && isDescendant(node.children, ancestorId)) {
      return true;
    }
  }
  return false;
}