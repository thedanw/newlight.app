import { forwardRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Text } from '@/core/ui';
import { useSortable } from '@dnd-kit/react/sortable';
import type { TreeNode as TreeNodeType } from '../types';

export interface TreeNodeProps<T = unknown> {
  /** The tree node data */
  node: TreeNodeType<T>;
  /** Current depth in the tree (for indentation) */
  depth: number;
  /** The index of the node within its flattened sortable group */
  index: number;
  /** Parent node ID (null for root) */
  parentId: string | null;
  /** Whether the node has children (shows expand/collapse toggle) */
  hasChildren?: boolean;
  /** Whether the node is expanded */
  isExpanded: boolean;
  /** Callback when expand/collapse is toggled */
  onToggle: (id: string) => void;
  /** Optional render prop for custom node content (uses `any` for callback variance) */
  renderNode?: (node: any, depth: number) => ReactNode;
}

/**
 * Tree node row component with drag-and-drop, expand/collapse, and indentation.
 *
 * Uses `useSortable` directly with the node's depth/parentId in its data so the
 * container (`SortableTree`) can compute nesting from the horizontal drag offset.
 * The container handles all drag lifecycle events (descendant handling, depth
 * projection, reorder) — this row is purely presentational.
 */
export const TreeNode = forwardRef<HTMLDivElement, TreeNodeProps>(
  ({ node, depth, index, parentId, hasChildren = false, isExpanded, onToggle, renderNode }, ref) => {
    const {
      isDragging,
      isDragSource,
      ref: sortableRef,
      handleRef,
    } = useSortable({
      id: node.id,
      index,
      data: { depth, parentId, label: node.label },
      alignment: { x: 'start', y: 'center' },
      transition: { idle: true },
    });

    const combinedRef = (el: HTMLDivElement | null) => {
      sortableRef(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    };

    const indentSize = 24; // px per depth level

    return (
      <div
        ref={combinedRef}
        data-tree-node={node.id}
        data-depth={depth}
        aria-hidden={isDragSource}
        style={{
          paddingLeft: `${depth * indentSize}px`,
          opacity: isDragging ? 0.5 : 1,
          transition: 'opacity 150ms ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: '12px',
            paddingRight: '12px',
            borderRadius: 'var(--radii-l2)',
          }}
        >
          {/* Expand/collapse toggle */}
          {hasChildren ? (
            <button
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              type="button"
              data-testid="tree-toggle"
              onClick={() => onToggle(node.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <ChevronDown
                size={16}
                style={{
                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms ease',
                }}
              />
            </button>
          ) : (
            <div style={{ width: '32px', height: '32px', flexShrink: 0 }} />
          )}

          {/* Drag handle */}
          <button
            ref={handleRef}
            aria-label="Reorder item"
            type="button"
            data-testid="tree-handle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              flexShrink: 0,
              border: 'none',
              background: 'transparent',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="5" r="1" />
              <circle cx="9" cy="12" r="1" />
              <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="5" r="1" />
              <circle cx="15" cy="12" r="1" />
              <circle cx="15" cy="19" r="1" />
            </svg>
          </button>

          {/* Node content */}
          {renderNode ? (
            renderNode(node, depth)
          ) : (
            <Text fontSize="sm" fontWeight="medium" color="fg">
              {node.label}
            </Text>
          )}
        </div>
      </div>
    );
  }
);

TreeNode.displayName = 'TreeNode';