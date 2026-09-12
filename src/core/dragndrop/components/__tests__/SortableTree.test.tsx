import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { SortableTree } from '../SortableTree';

// Capture the drag lifecycle handlers SortableTree passes to its DragDropProvider
const { capturedHandlers } = vi.hoisted(() => ({
  capturedHandlers: {} as Record<string, (...args: any[]) => void>,
}));

// Mock @dnd-kit/react so DragDropProvider renders children and captures handlers,
// and DragOverlay renders its render-prop output.
vi.mock('@dnd-kit/react', () => ({
  DragDropProvider: ({ children, onDragStart, onDragMove, onDragOver, onDragEnd }: any) => {
    capturedHandlers.onDragStart = onDragStart;
    capturedHandlers.onDragMove = onDragMove;
    capturedHandlers.onDragOver = onDragOver;
    capturedHandlers.onDragEnd = onDragEnd;
    return <div data-testid="drag-drop-provider">{children}</div>;
  },
  DragOverlay: ({ children }: any) => {
    const content = typeof children === 'function' ? children(null) : children;
    return <div data-testid="drag-overlay">{content}</div>;
  },
}));

// Mock useSortable (used by TreeNode internally)
vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: vi.fn(() => ({
    sortable: {},
    isDragging: false,
    isDropping: false,
    isDragSource: false,
    isDropTarget: false,
    handleRef: vi.fn(),
    ref: vi.fn(),
    sourceRef: vi.fn(),
    targetRef: vi.fn(),
  })),
}));

// Mock move helper (identity — reorder logic is covered by tree utils)
vi.mock('@dnd-kit/helpers', () => ({
  move: vi.fn((items: any[]) => items),
}));

// Mock sensors to avoid real sensor construction in JSDOM
vi.mock('../../sensors', () => ({
  createDefaultSensors: vi.fn(() => []),
}));

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
  return render(<SortableTree tree={tree} onReorder={vi.fn()} {...props} />);
};

describe('SortableTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const { container } = render(<SortableTree tree={deepTree} onReorder={vi.fn()} />);
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

  it('calls onReorder when drag ends without cancellation', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });

    // Start a drag on a leaf node (populates sourceChildren + removes descendants)
    act(() => {
      capturedHandlers.onDragStart({ operation: { source: { id: '1-2' } } });
    });

    // End the drag — rebuilds the tree and fires onReorder
    act(() => {
      capturedHandlers.onDragEnd({ canceled: false });
    });

    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  it('keeps descendants attached when dragging a parent', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });

    // Start dragging '1' (has children 1-1, 1-2) — descendants are removed
    // from the flat list into sourceChildren so the whole subtree drags together.
    act(() => {
      capturedHandlers.onDragStart({ operation: { source: { id: '1' } } });
    });

    // End the drag — descendants are re-attached when the tree is rebuilt.
    act(() => {
      capturedHandlers.onDragEnd({ canceled: false });
    });

    const reordered = onReorder.mock.calls[0][0];
    const root1 = reordered.find((n: { id: string }) => n.id === '1');
    expect(root1.children.map((c: { id: string }) => c.id)).toEqual(['1-1', '1-2']);
  });

  it('nests an item under another item when dragged horizontally', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });

    // Start dragging root '2'
    act(() => {
      capturedHandlers.onDragStart({ operation: { source: { id: '2' } } });
    });

    // Drag over '1-1' with a horizontal offset of one indentation level →
    // projected depth 1 → parent becomes '1'.
    act(() => {
      capturedHandlers.onDragOver(
        {
          operation: { source: { id: '2' }, target: { id: '1-1' } },
          preventDefault: vi.fn(),
        },
        { dragOperation: { transform: { x: 24 } } }
      );
    });

    // End the drag — rebuilds the tree with '2' nested under '1'.
    act(() => {
      capturedHandlers.onDragEnd({ canceled: false });
    });

    const reordered = onReorder.mock.calls[0][0];
    const root1 = reordered.find((n: { id: string }) => n.id === '1');
    expect(root1.children.map((c: { id: string }) => c.id)).toContain('2');
  });

  it('does not create a self-parent when dragging a parent over the next item', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });

    // Start dragging parent '1' — its descendants (1-1, 1-2) are removed into
    // sourceChildren, leaving the flat list as [1, 2].
    act(() => {
      capturedHandlers.onDragStart({ operation: { source: { id: '1' } } });
    });

    // Drag '1' over '2' (the item directly below it) with a horizontal offset.
    // getProjection([1, 2], '2', 1) returns parentId === '1' (the source's own
    // id). Without the guard this self-parent corrupts the tree and previously
    // made the visibleItems walk loop forever (hard freeze). The guard must skip
    // the update so the tree stays valid.
    act(() => {
      capturedHandlers.onDragOver(
        {
          operation: { source: { id: '1' }, target: { id: '2' } },
          preventDefault: vi.fn(),
        },
        { dragOperation: { transform: { x: 24 } } }
      );
    });

    // End the drag — the tree must rebuild cleanly (no self-parent → no
    // infinite recursion in buildTree/flattenTree).
    act(() => {
      capturedHandlers.onDragEnd({ canceled: false });
    });

    const reordered = onReorder.mock.calls[0][0];
    // '1' stays a root with its descendants intact
    const root1 = reordered.find((n: { id: string }) => n.id === '1');
    expect(root1.children.map((c: { id: string }) => c.id)).toEqual(['1-1', '1-2']);
    // '1' is not its own child
    expect(root1.children.map((c: { id: string }) => c.id)).not.toContain('1');
  });

  it('does not call onReorder when drag is canceled', () => {
    const onReorder = vi.fn();
    renderTree({ onReorder });

    act(() => {
      capturedHandlers.onDragStart({ operation: { source: { id: '1-2' } } });
    });

    act(() => {
      capturedHandlers.onDragEnd({ canceled: true });
    });

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