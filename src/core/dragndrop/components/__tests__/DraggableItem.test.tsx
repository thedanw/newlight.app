import { render } from '@testing-library/react';
import { DragDropProvider } from '../../provider';
import type { DragItem } from '../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the hook BEFORE importing the component
vi.mock('../../hooks/useDragndrop', () => ({
  useDragndropDraggable: vi.fn(),
}));

import { useDragndropDraggable } from '../../hooks/useDragndrop';
import { DraggableItem, DraggableItemHandle, DraggableItemPreview } from '../DraggableItem';

const mockUseDragndropDraggable = vi.mocked(useDragndropDraggable);

const testItem: DragItem = {
  id: 'test-item-1',
  label: 'Test Item',
};

describe('DraggableItem', () => {
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

  describe('DraggableItem (Root)', () => {
    it('renders a div with data-draggable-item attribute', () => {
      const { container } = render(
        <DragDropProvider>
          <DraggableItem item={testItem}>
            <DraggableItemHandle item={testItem} />
            Content
          </DraggableItem>
        </DragDropProvider>
      );

      const root = container.querySelector('[data-draggable-item="test-item-1"]');
      expect(root).toBeInTheDocument();
    });

    it('applies data-dragging attribute when dragging', () => {
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
          <DraggableItem item={testItem}>
            <DraggableItemHandle item={testItem} />
            Content
          </DraggableItem>
        </DragDropProvider>
      );

      const root = container.querySelector('[data-draggable-item="test-item-1"]');
      expect(root).toHaveAttribute('data-dragging', 'true');
      expect(root).toHaveAttribute('data-drag-source', 'true');
    });

    it('forwards ref to the root element', () => {
      const ref = vi.fn();
      const { container } = render(
        <DragDropProvider>
          <DraggableItem item={testItem} ref={ref}>
            <DraggableItemHandle item={testItem} />
            Content
          </DraggableItem>
        </DragDropProvider>
      );

      const root = container.querySelector('[data-draggable-item="test-item-1"]');
      expect(ref).toHaveBeenCalledWith(root);
    });
  });

  describe('DraggableItemHandle', () => {
    it('renders a DraggableHandle', () => {
      const { container } = render(
        <DragDropProvider>
          <DraggableItem item={testItem}>
            <DraggableItemHandle item={testItem} />
            Content
          </DraggableItem>
        </DragDropProvider>
      );

      const handle = container.querySelector('button[aria-label="Reorder item"]');
      expect(handle).toBeInTheDocument();
    });

    it('forwards ref to the handle', () => {
      const ref = vi.fn();
      const { container } = render(
        <DragDropProvider>
          <DraggableItem item={testItem}>
            <DraggableItemHandle item={testItem} ref={ref} />
            Content
          </DraggableItem>
        </DragDropProvider>
      );

      const handle = container.querySelector('button[aria-label="Reorder item"]');
      expect(ref).toHaveBeenCalledWith(handle);
    });
  });

  describe('DraggableItemPreview', () => {
    it('renders preview content with drag preview styling', () => {
      const { container } = render(
        <DragDropProvider>
          <DraggableItem item={testItem}>
            <DraggableItemHandle item={testItem} />
            Content
            <DraggableItemPreview item={testItem}>Preview Content</DraggableItemPreview>
          </DraggableItem>
        </DragDropProvider>
      );

      const preview = container.querySelector('[data-drag-preview="test-item-1"]');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveTextContent('Preview Content');
    });
  });

  describe('Compound component', () => {
    it('exports Handle and Preview as sub-components', () => {
      expect(DraggableItem.Handle).toBeDefined();
      expect(DraggableItem.Preview).toBeDefined();
    });
  });
});