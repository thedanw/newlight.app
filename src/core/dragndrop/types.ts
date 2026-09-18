import type { SensorConstructor, UniqueIdentifier } from '@dnd-kit/abstract';
import type { KeyboardSensorOptions, PointerSensorOptions } from '@dnd-kit/dom';

/**
 * Core drag-and-drop types for the application.
 */

export interface DragItem {
  /** Unique identifier for the draggable item. */
  id: UniqueIdentifier;
  /** Human-readable label for accessibility. */
  label: string;
  /** Optional data payload. */
  data?: Record<string, unknown>;
  /** Whether the item is currently disabled. */
  disabled?: boolean;
}

/**
 * A node in a hierarchical tree structure.
 * Used by flattenTree, reorderTree, TreeNode, and SortableTree.
 */
export interface TreeNode<TData = unknown> {
  /** Unique identifier for the node */
  id: string;
  /** Human-readable label */
  label: string;
  /** Child nodes */
  children?: TreeNode<TData>[];
  /** Optional data payload */
  data?: TData;
}

/**
 * A collection of drag-and-drop items (used by the plugin system).
 */
export interface DndCollection {
  /** Unique identifier for the collection. */
  id: UniqueIdentifier;
  /** Human-readable label. */
  label: string;
  /** Items in the collection. */
  items: DragItem[];
  /** Whether the collection is currently active. */
  isActive?: boolean;
}

/**
 * A flattened tree item with depth/path metadata.
 * Produced by flattenTree for use in a single sortable group.
 */
export interface SortableTreeItem<TData = unknown> {
  /** Unique identifier for the node */
  id: string;
  /** Human-readable label */
  label: string;
  /** Depth in the tree (0 = root) */
  depth: number;
  /** Path of ancestor IDs from root to this node */
  path: string[];
  /** Parent node ID (null for root) */
  parentId: string | null;
  /** Optional data payload */
  data?: TData;
}

export interface DropZone {
  /** Unique identifier for the drop zone. */
  id: UniqueIdentifier;
  /** Accepted item types or IDs. */
  accepts: UniqueIdentifier[];
  /** Whether the zone is currently active. */
  isActive?: boolean;
}

export interface DragDropSensorConfig {
  /** Pointer sensor options (mouse, touch, pen). */
  pointer?: PointerSensorOptions;
  /** Keyboard sensor options. */
  keyboard?: KeyboardSensorOptions;
  /** Custom sensors. */
  custom?: SensorConstructor[];
}