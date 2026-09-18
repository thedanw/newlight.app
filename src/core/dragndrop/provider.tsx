import { useEffect, useState, type ComponentProps } from 'react';
import { DragDropProvider as NativeDragDropProvider, DragOverlay, useDragDropMonitor } from '@dnd-kit/react';
import type { Sensors } from '@dnd-kit/dom';
import { createDefaultSensors } from './sensors';
import type { DragDropSensorConfig } from './types';

type NativeDragDropProviderProps = ComponentProps<typeof NativeDragDropProvider>;

/** App-level provider props inferred from the current native provider. */
export type DragDropProviderProps = Omit<NativeDragDropProviderProps, 'sensors'> & {
  /** Optional identifier used by the app-level wrapper. */
  contextId?: string;
  /** Current sensor array or the legacy config object accepted by this wrapper. */
  sensors?: Sensors | DragDropSensorConfig;
};

/**
 * Core DragDropProvider component.
 * Wraps the application with dnd-kit context and sensors.
 */
export function DragDropProvider({
  children,
  contextId = 'default',
  sensors,
  ...nativeProps
}: DragDropProviderProps) {
  const resolvedSensors: Sensors = Array.isArray(sensors)
    ? sensors
    : createDefaultSensors(sensors);

  return (
    <NativeDragDropProvider
      sensors={resolvedSensors}
      {...nativeProps}
    >
      <div data-dragndrop-context={contextId}>
        {children}
        <DragStatusAnnouncer />
      </div>
    </NativeDragDropProvider>
  );
}

export { DragOverlay };

/**
 * Visually-hidden live region that announces drag state changes
 * for screen readers. Uses useDragDropMonitor from @dnd-kit/react
 * to track drag start/end events.
 */
function DragStatusAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  useDragDropMonitor({
    onDragStart(event) {
      const source = event.operation.source;
      const label = String(source?.data?.label ?? source?.id);
      setAnnouncement(`Dragging ${label}`);
    },
    onDragEnd(event) {
      const source = event.operation.source;
      const label = String(source?.data?.label ?? source?.id);
      const target = event.operation.target;
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