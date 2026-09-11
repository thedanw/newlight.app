/**
 * Utility functions for drag-and-drop operations
 */

// Tree utilities
export { flattenTree, type FlattenedTreeNode, type FlattenTreeResult } from './flattenTree';
export { reorderTree } from './reorderTree';
export { cssKeyframes } from './cssKeyframes';

/**
 * Get transform style for draggable element
 */
export function getTransformStyle(transform: { x: number; y: number } | null) {
  if (!transform) return {};
  return {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  };
}

/**
 * Get transition style for draggable element
 */
export function getTransitionStyle(transition: string | null) {
  if (!transition) return {};
  return {
    transition,
  };
}

/**
 * Check if an item can be dropped in a zone
 */
export function canDropInZone(itemType: string, zoneAccepts: string[]): boolean {
  if (zoneAccepts.length === 0) return true;
  return zoneAccepts.includes(itemType);
}

/**
 * Generate unique ID for drag items
 */
export function generateDragId(prefix = 'drag'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sort items by drag order
 */
export function sortByDragOrder<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string | null
): T[] {
  if (!overId) return items;

  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1) return items;

  const newItems = [...items];
  const [removed] = newItems.splice(activeIndex, 1);
  newItems.splice(overIndex, 0, removed);

  return newItems;
}

/**
 * Get drag direction (vertical/horizontal)
 */
export function getDragDirection(
  start: { x: number; y: number },
  end: { x: number; y: number }
): 'vertical' | 'horizontal' | 'none' {
  const deltaX = Math.abs(end.x - start.x);
  const deltaY = Math.abs(end.y - start.y);

  if (deltaX > deltaY && deltaX > 5) return 'horizontal';
  if (deltaY > deltaX && deltaY > 5) return 'vertical';
  return 'none';
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function for drag events
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}