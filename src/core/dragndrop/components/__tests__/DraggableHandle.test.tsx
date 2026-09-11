import { render } from '@testing-library/react';
import { DragDropProvider } from '../../provider';
import { DraggableHandle } from '../DraggableHandle';
import type { DragItem } from '../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the hook
vi.mock('../../hooks/useDragndrop', () => ({
  useDragndropDraggable: vi.fn(),
}));

import { useDragndropDraggable } from '../../hooks/useDragndrop';

const mockUseDragndropDraggable = vi.mocked(useDragndropDraggable);

const testItem: DragItem = {
  id: 'test-item-1',
  label: 'Test Item',
};

describe('DraggableHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDragndropDraggable.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: false,
      isDropping: false,
      isDragSource: false,
      item: testItem,
    });
  });

  it('renders an IconButton with GripVertical icon', () => {
    const { container } = render(
      <DragDropProvider>
        <DraggableHandle item={testItem} />
      </DragDropProvider>
    );

    // Should render a button with the handle - query within container to avoid DragOverlay
    const button = container.querySelector('button[aria-label="Reorder item"]');
    expect(button).toBeInTheDocument();
  });

  it('has minimum 44px touch target (size_11 class = 44px)', () => {
    const { container } = render(
      <DragDropProvider>
        <DraggableHandle item={testItem} />
      </DragDropProvider>
    );

    const button = container.querySelector('button[aria-label="Reorder item"]');
    // Park UI uses size_11 class for 44px (11 * 4px = 44px)
    expect(button).toHaveClass('size_11');
  });

  it('forwards ref to the button element', () => {
    const ref = vi.fn();
    const { container } = render(
      <DragDropProvider>
        <DraggableHandle item={testItem} ref={ref} />
      </DragDropProvider>
    );

    const button = container.querySelector('button[aria-label="Reorder item"]');
    expect(ref).toHaveBeenCalledWith(button);
  });

  it('applies cursor grab style (cursor_grab class)', () => {
    const { container } = render(
      <DragDropProvider>
        <DraggableHandle item={testItem} />
      </DragDropProvider>
    );

    const button = container.querySelector('button[aria-label="Reorder item"]');
    // Park UI uses cursor_grab class for grab cursor
    expect(button).toHaveClass('cursor_grab');
  });

  it('shows grabbing cursor when dragging (cursor_grabbing class)', () => {
    mockUseDragndropDraggable.mockReturnValue({
      ref: vi.fn(),
      handleRef: vi.fn(),
      isDragging: true,
      isDropping: false,
      isDragSource: true,
      item: testItem,
    });

    const { container } = render(
      <DragDropProvider>
        <DraggableHandle item={testItem} />
      </DragDropProvider>
    );

    const button = container.querySelector('button[aria-label="Reorder item"]');
    // Park UI uses cursor_grabbing class for grabbing cursor
    expect(button).toHaveClass('cursor_grabbing');
  });
});