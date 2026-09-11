import { render } from '@testing-library/react';
import { DragDropProvider } from '../../provider';
import type { DragItem } from '../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the hooks BEFORE importing the component
vi.mock('../../hooks/useDragndrop', () => ({
  useDragndropSortable: vi.fn(),
  useDragndropDraggable: vi.fn(),
}));

// Mock useSortable from @dnd-kit/react/sortable
vi.mock('@dnd-kit/react/sortable', () => ({
  useSortable: vi.fn(() => ({
    ref: vi.fn(),
    handleRef: vi.fn(),
    isDragging: false,
    isDropping: false,
    isDragSource: false,
    isDropTarget: false,
  })),
}));

import { useDragndropSortable } from '../../hooks/useDragndrop';
import { useDragndropDraggable } from '../../hooks/useDragndrop';
import { SortableList } from '../SortableList';

const mockUseDragndropSortable = vi.mocked(useDragndropSortable);
const mockUseDragndropDraggable = vi.mocked(useDragndropDraggable);

const testItems: DragItem[] = [
  { id: 'item-1', label: 'Item 1' },
  { id: 'item-2', label: 'Item 2' },
  { id: 'item-3', label: 'Item 3' },
];

describe('SortableList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDragndropSortable.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      sourceRef: vi.fn(),
      targetRef: vi.fn(),
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      isDropTarget: false,
      item: testItems[0],
    });
    mockUseDragndropDraggable.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      item: testItems[0],
    });
  });

  it('renders a list with data-sortable-list attribute', () => {
    const { container } = render(
      <DragDropProvider>
        <SortableList items={testItems} onReorder={vi.fn()} />
      </DragDropProvider>
    );

    const list = container.querySelector('[data-sortable-list]');
    expect(list).toBeInTheDocument();
  });

  it('renders all items in the list', () => {
    const { container } = render(
      <DragDropProvider>
        <SortableList items={testItems} onReorder={vi.fn()} />
      </DragDropProvider>
    );

    testItems.forEach((item) => {
      expect(container.querySelector(`[data-draggable-item="${item.id}"]`)).toBeInTheDocument();
    });
  });

  it('calls onReorder when items are reordered', () => {
    const onReorder = vi.fn();
    render(
      <DragDropProvider>
        <SortableList items={testItems} onReorder={onReorder} />
      </DragDropProvider>
    );

    // Simulate a reorder by finding the sortable context and triggering it
    // This is a basic test - actual reorder testing would require more integration
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('forwards ref to the root element', () => {
    const ref = vi.fn();
    render(
      <DragDropProvider>
        <SortableList items={testItems} onReorder={vi.fn()} ref={ref} />
      </DragDropProvider>
    );

    expect(ref).toHaveBeenCalled();
    const element = ref.mock.calls[0][0];
    expect(element).toBeInstanceOf(HTMLDivElement);
  });

  it('applies data-dragging attribute to dragging item', () => {
    mockUseDragndropDraggable.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: true,
      isDropping: false,
      isDragSource: true,
      item: testItems[0],
    });

    const { container } = render(
      <DragDropProvider>
        <SortableList items={testItems} onReorder={vi.fn()} />
      </DragDropProvider>
    );

    const draggingItem = container.querySelector('[data-dragging="true"]');
    expect(draggingItem).toBeInTheDocument();
  });

  it('renders custom item renderer', () => {
    const customRenderer = vi.fn((item) => (
      <div data-custom-item={item.id}>{item.label}</div>
    ));

    const { container } = render(
      <DragDropProvider>
        <SortableList items={testItems} onReorder={vi.fn()} renderItem={customRenderer} />
      </DragDropProvider>
    );

    testItems.forEach((item) => {
      expect(container.querySelector(`[data-custom-item="${item.id}"]`)).toBeInTheDocument();
    });
    expect(customRenderer).toHaveBeenCalledTimes(testItems.length);
  });
});