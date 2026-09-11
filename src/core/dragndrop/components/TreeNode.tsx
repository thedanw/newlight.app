import { forwardRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Text } from '@/core/ui';
import { useSortableTree } from '../hooks/useSortableTree';

export interface TreeNodeProps<T = unknown> {
  /** The tree node data */
  node: {
    id: string;
    label: string;
    children?: Array<{ id: string; label: string; children?: unknown[] }>;
    data?: T;
  };
  /** Current depth in the tree (for indentation) */
  depth: number;
  /** The index of the node within its flattened sortable group */
  index?: number;
  /** Sortable group — isolates this tree's items from other SortableTree instances */
  group?: string | number;
  /** Whether the node has children (shows expand/collapse toggle) */
  hasChildren?: boolean;
  /** Whether the node is expanded */
  isExpanded: boolean;
  /** Callback when expand/collapse is toggled */
  onToggle: (id: string) => void;
  /** Callback when drag ends */
  onDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => void;
  /** Optional render prop for custom node content */
  renderNode?: (node: TreeNodeProps['node'], depth: number) => ReactNode;
}

/**
 * Tree node row component with drag-and-drop, expand/collapse, and indentation.
 * This is the non-recursive row; SortableTree renders flattened rows and
 * manages expanded state to include/exclude children.
 */
export const TreeNode = forwardRef<HTMLDivElement, TreeNodeProps>(
  ({ node, depth, index, group, hasChildren = false, isExpanded, onToggle, onDragEnd, renderNode }, ref) => {
    const {
      isDragging,
      ref: sortableRef,
      handleRef,
    } = useSortableTree({
      id: node.id,
      depth,
      index,
      group,
      onDragEnd,
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
            borderRadius: 'l2',
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