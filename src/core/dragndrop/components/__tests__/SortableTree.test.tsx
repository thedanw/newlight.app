import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SortableTree } from '../SortableTree';
import { DragDropProvider } from '../../provider';

// Mock useSortableTree (used by TreeNode internally)
vi.mock('../../hooks/useSortableTree', () => ({
  useSortableTree: vi.fn(),
}));

import { useSortableTree } from '../../hooks/useSortableTree';
const mockUseSortableTree = vi.mocked(useSortableTree);

const tree = [
  {
    id: '1',
    label: 'Root 1',
    children: [
      { id: '1-1', label: 'Child 1-1' },
      { id: '1-2', label: 'Child 1-2' },
    ],
  },
  { id: '2', label: 'Root 2' },
];

const renderTree = (props = {}) => {
  return render(
    <DragDropProvider>
      <SortableTree tree={tree} onReorder={vi.fn()} {...props} />
    </DragDropProvider>
  );
};

describe('SortableTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSortableTree.mockReturnValue({
      sortable: {},
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      isDropTarget: false,
      handleRef: vi.fn(),
      ref: vi.fn(),
      sourceRef: vi.fn(),
      targetRef: vi.fn(),
      depth: 0,
      parentId: null,
    } as unknown as ReturnType<typeof useSortableTree>);
  });

  it('renders all root nodes', () => {
    const { container } = renderTree();
    expect(container.querySelector('[data-tree-node="1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-tree-node="2"]')).toBeInTheDocument();
  });

  it('renders children of expanded nodes', () => {
    const { container } = renderTree();
    expect(container.querySelector('[data-tree-node="1-1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-tree-node="1-2"]')).toBeInTheDocument();
  });

  it('applies depth indentation to children', () => {
    const { container } = renderTree();
    const child = container.querySelector('[data-tree-node="1-1"]');
    expect(child).toHaveAttribute('data-depth', '1');
  });

  it('hides children when parent is collapsed', () => {
    const { container } = renderTree();
    // Collapse Root 1
    const toggles = container.querySelectorAll('[data-testid="tree-toggle"]');
    fireEvent.click(toggles[0]);
    expect(container.querySelector('[data-tree-node="1-1"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-tree-node="1-2"]')).not.toBeInTheDocument();
  });

  it('hides grandchildren when an ancestor is collapsed', () => {
    const deepTree = [
      {
        id: 'a',
        label: 'A',
        children: [
          {
            id: 'a-1',
            label: 'A-1',
            children: [{ id: 'a-1-1', label: 'A-1-1' }],
          },
        ],
      },
    ];
    const { container } = render(
      <DragDropProvider>
        <SortableTree tree={deepTree} onReorder={vi.fn()} />
      </DragDropProvider>
    );
    // Grandchild visible initially
    expect(container.querySelector('[data-tree-node="a-1-1"]')).toBeInTheDocument();
    // Collapse root A — both child and grandchild must disappear
    const toggles = container.querySelectorAll('[data-testid="tree-toggle"]');
    fireEvent.click(toggles[0]);
    expect(container.querySelector('[data-tree-node="a-1"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-tree-node="a-1-1"]')).not.toBeInTheDocument();
  });

  it('shows children again when parent is re-expanded', () => {
    const { container } = renderTree();
    const toggles = container.querySelectorAll('[data-testid="tree-toggle"]');
    fireEvent.click(toggles[0]); // collapse
    fireEvent.click(toggles[0]); // expand
    expect(container.querySelector('[data-tree-node="1-1"]')).toBeInTheDocument();
  });

  it('shows expand/collapse toggle only for nodes with children', () => {
    const { container } = renderTree();
    const toggles = container.querySelectorAll('[data-testid="tree-toggle"]');
    // Only Root 1 has children
    expect(toggles).toHaveLength(1);
  });

  it('calls onReorder when drag ends with a valid target', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });
    // Simulate drag end by invoking the handler through a node's useSortableTree mock
    const dragEndHandler = mockUseSortableTree.mock.calls[0][0].onDragEnd;
    dragEndHandler({ active: { id: '1-2' }, over: { id: '1-1' } });
    expect(onReorder).toHaveBeenCalled();
  });

  it('does not call onReorder when dragging onto itself', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });
    const dragEndHandler = mockUseSortableTree.mock.calls[0][0].onDragEnd;
    dragEndHandler({ active: { id: '1' }, over: { id: '1' } });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('does not call onReorder when over is null', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });
    const dragEndHandler = mockUseSortableTree.mock.calls[0][0].onDragEnd;
    dragEndHandler({ active: { id: '1' }, over: null });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('renders custom renderNode for each node', () => {
    const renderNode = (node: { label: string }) => (
      <span data-testid="custom-node">{node.label}</span>
    );
    const { container } = renderTree({ renderNode });
    expect(container.querySelectorAll('[data-testid="custom-node"]').length).toBeGreaterThan(0);
  });
});