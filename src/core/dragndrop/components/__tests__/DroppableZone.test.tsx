import { render } from '@testing-library/react';
import { DragDropProvider } from '../../provider';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the hook BEFORE importing the component
vi.mock('../../hooks/useDragndrop', () => ({
  useDragndropDroppable: vi.fn(),
}));

import { useDragndropDroppable } from '../../hooks/useDragndrop';
import { DroppableZone } from '../DroppableZone';

const mockUseDragndropDroppable = vi.mocked(useDragndropDroppable);

describe('DroppableZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDragndropDroppable.mockReturnValue({
      ref: vi.fn(),
      isOver: false,
      canDrop: true,
      zoneId: 'test-zone',
      accepts: [],
    });
  });

  it('renders a div with data-droppable-zone attribute', () => {
    const { container } = render(
      <DragDropProvider>
        <DroppableZone zoneId="test-zone" />
      </DragDropProvider>
    );

    const zone = container.querySelector('[data-droppable-zone="test-zone"]');
    expect(zone).toBeInTheDocument();
  });

  it('applies data-drop-target attribute when item is over', () => {
    mockUseDragndropDroppable.mockReturnValue({
      ref: vi.fn(),
      isOver: true,
      canDrop: true,
      zoneId: 'test-zone',
      accepts: [],
    });

    const { container } = render(
      <DragDropProvider>
        <DroppableZone zoneId="test-zone" />
      </DragDropProvider>
    );

    const zone = container.querySelector('[data-drop-target="true"]');
    expect(zone).toBeInTheDocument();
  });

  it('applies data-drop-target="false" when item is not over', () => {
    const { container } = render(
      <DragDropProvider>
        <DroppableZone zoneId="test-zone" />
      </DragDropProvider>
    );

    const zone = container.querySelector('[data-drop-target="false"]');
    expect(zone).toBeInTheDocument();
  });

  it('forwards ref to the root element', () => {
    const ref = vi.fn();
    render(
      <DragDropProvider>
        <DroppableZone zoneId="test-zone" ref={ref} />
      </DragDropProvider>
    );

    expect(ref).toHaveBeenCalled();
    const element = ref.mock.calls[0][0];
    expect(element).toBeInstanceOf(HTMLDivElement);
  });

  it('renders children content', () => {
    const { container } = render(
      <DragDropProvider>
        <DroppableZone zoneId="test-zone">
          <div>Drop content here</div>
        </DroppableZone>
      </DragDropProvider>
    );

    expect(container.textContent).toContain('Drop content here');
  });

  it('applies accepts prop to data-accepts attribute', () => {
    mockUseDragndropDroppable.mockReturnValue({
      ref: vi.fn(),
      isOver: false,
      canDrop: true,
      zoneId: 'test-zone',
      accepts: ['type-a', 'type-b'],
    });

    const { container } = render(
      <DragDropProvider>
        <DroppableZone zoneId="test-zone" accepts={['type-a', 'type-b']} />
      </DragDropProvider>
    );

    const zone = container.querySelector('[data-accepts="type-a,type-b"]');
    expect(zone).toBeInTheDocument();
  });
});