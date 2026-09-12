import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { TreeNode } from '../TreeNode';

// Mock useSortable (used by TreeNode internally)
vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: vi.fn(),
}));

import { useSortable } from '@dnd-kit/react/sortable';
const mockUseSortable = vi.mocked(useSortable);

const defaultProps = {
  node: { id: '1', label: 'Test Node', children: [] },
  depth: 0,
  index: 0,
  parentId: null as string | null,
  isExpanded: true,
  onToggle: vi.fn(),
};

const renderTreeNode = (props = {}) => {
  return render(<TreeNode {...defaultProps} {...props} />);
};

describe('TreeNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSortable.mockReturnValue({
      sortable: {},
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      isDropTarget: false,
      handleRef: vi.fn(),
      ref: vi.fn(),
      sourceRef: vi.fn(),
      targetRef: vi.fn(),
    } as unknown as ReturnType<typeof useSortable>);
  });

  it('renders node label', () => {
    const { container } = renderTreeNode();
    const node = container.querySelector('[data-tree-node="1"]');
    expect(node).toBeInTheDocument();
    expect(node!.textContent).toContain('Test Node');
  });

  it('renders drag handle', () => {
    const { container } = renderTreeNode();
    const handle = container.querySelector('button[aria-label="Reorder item"]');
    expect(handle).toBeInTheDocument();
  });

  it('applies depth-based indentation', () => {
    const { container } = renderTreeNode({ depth: 2 });
    const node = container.querySelector('[data-tree-node="1"]');
    expect(node).toHaveAttribute('data-depth', '2');
    expect(node).toHaveStyle({ paddingLeft: '48px' }); // 24px * depth
  });

  it('shows expand/collapse toggle when node has children', () => {
    const { container } = renderTreeNode({
      hasChildren: true,
    });
    expect(container.querySelector('[data-testid="tree-toggle"]')).toBeInTheDocument();
  });

  it('shows collapse label when expanded', () => {
    const { container } = renderTreeNode({
      hasChildren: true,
      isExpanded: true,
    });
    expect(container.querySelector('button[aria-label="Collapse"]')).toBeInTheDocument();
  });

  it('shows expand label when collapsed', () => {
    const { container } = renderTreeNode({
      hasChildren: true,
      isExpanded: false,
    });
    expect(container.querySelector('button[aria-label="Expand"]')).toBeInTheDocument();
  });

  it('does not show expand/collapse icon for leaf nodes', () => {
    const { container } = renderTreeNode({
      node: { id: '1', label: 'Leaf', children: [] },
    });
    expect(container.querySelector('[data-testid="tree-toggle"]')).not.toBeInTheDocument();
  });

  it('calls onToggle when expand/collapse icon is clicked', () => {
    const onToggle = vi.fn();
    const { container } = renderTreeNode({
      hasChildren: true,
      onToggle,
    });
    const toggle = container.querySelector('[data-testid="tree-toggle"]') as HTMLButtonElement;
    toggle.click();
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('forwards ref to root element', () => {
    const ref = { current: null };
    render(<TreeNode ref={ref} {...defaultProps} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies dragging styles when isDragging', () => {
    mockUseSortable.mockReturnValue({
      sortable: {},
      isDragging: true,
      isDropping: false,
      isDragSource: false,
      isDropTarget: false,
      handleRef: vi.fn(),
      ref: vi.fn(),
      sourceRef: vi.fn(),
      targetRef: vi.fn(),
    } as unknown as ReturnType<typeof useSortable>);
    const { container } = renderTreeNode();
    const node = container.querySelector('[data-tree-node="1"]');
    expect(node).toHaveStyle({ opacity: 0.5 });
  });

  it('renders custom renderNode when provided', () => {
    const renderNode = (node: { label: string }) => (
      <span data-testid="custom">Custom: {node.label}</span>
    );
    const { container } = renderTreeNode({ renderNode });
    expect(container.querySelector('[data-testid="custom"]')).toBeInTheDocument();
  });

  it('has data-tree-node attribute', () => {
    const { container } = renderTreeNode();
    const node = container.querySelector('[data-tree-node="1"]');
    expect(node).toHaveAttribute('data-tree-node', '1');
  });
});