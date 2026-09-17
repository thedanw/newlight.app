import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useDndMonitor } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { DragDropProviderProps, DragItem, DropZone } from './types';
import { createDefaultSensors } from './sensors';
import type { Sensors } from '@dnd-kit/abstract';

/**
 * Core DragDropProvider component
 * Wraps the application with dnd-kit context and sensors
 * Provides mobile-first touch handling and accessibility support
 */
export function DragDropProvider({
  children,
  contextId = 'default',
  sensors: sensorConfig,
  onDragStart,
  onDragEnd,
  onDragOver,
}: DragDropProviderProps) {
  // Allow passing either a config object (for backward compat) or pre-configured sensor descriptors
  const sensors: Sensors = Array.isArray(sensorConfig)
    ? sensorConfig
    : createDefaultSensors(sensorConfig);

  const handleDragStart = (event: DragStartEvent) => {
    const source = event.active;
    const activeItem: DragItem = {
      id: source.id as string,
      label: source.data?.label ?? String(source.id),
      data: source.data,
      disabled: source.data?.disabled,
    };
    onDragStart?.({ active: activeItem });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const source = event.active;
    const activeItem: DragItem = {
      id: source.id as string,
      label: source.data?.label ?? String(source.id),
      data: source.data,
      disabled: source.data?.disabled,
    };

    const target = event.over;
    const overZone: DropZone | null = target
      ? {
          id: target.id as string,
          accepts: target.data?.accepts ?? [],
          isActive: true,
        }
      : null;

    onDragEnd?.({ active: activeItem, over: overZone });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const source = event.active;
    const activeItem: DragItem = {
      id: source.id as string,
      label: source.data?.label ?? String(source.id),
      data: source.data,
      disabled: source.data?.disabled,
    };

    const target = event.over;
    const overZone: DropZone | null = target
      ? {
          id: target.id as string,
          accepts: target.data?.accepts ?? [],
          isActive: true,
        }
      : null;

    onDragOver?.({ active: activeItem, over: overZone });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div data-dragndrop-context={contextId}>
        {children}
        <DragOverlay dropAnimation={null}>{null}</DragOverlay>
        <DragStatusAnnouncer />
      </div>
    </DndContext>
  );
}

/**
 * Hook to access the current drag context
 * Must be used within a DragDropProvider
 */
export function useDragDropContext() {
  // This would typically use React Context to access the provider's state
  // For now, we return a basic implementation
  return {
    contextId: 'default',
    isDragging: false,
    activeId: null,
    overId: null,
    registerItem: () => {},
    unregisterItem: () => {},
    getItemElement: () => undefined,
  };
}

export { DragOverlay };

/**
 * Visually-hidden live region that announces drag state changes
 * for screen readers. Uses useDndMonitor from @dnd-kit/core
 * to track drag start/end events.
 */
function DragStatusAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  useDndMonitor({
    onDragStart(event) {
      const source = event.active;
      const label = String(source.data?.label ?? source.id);
      setAnnouncement(`Dragging ${label}`);
    },
    onDragEnd(event) {
      const source = event.active;
      const label = String(source.data?.label ?? source.id);
      const target = event.over;
      if (target) {
        const overLabel = String(target.data?.label ?? target.id);
        setAnnouncement(`Dropped ${label} at ${overLabel}`);
      } else {
        setAnnouncement(`${label} dropped`);
      }
    },
  });

  // Clear announcement after a brief delay to avoid stale announcements
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {announcement}
    </div>
  );
}