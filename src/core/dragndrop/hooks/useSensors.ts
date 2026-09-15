import { useSensor, useSensors } from '@dnd-kit/react';
import { PointerSensor, KeyboardSensor } from '@dnd-kit/dom';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { PointerSensorOptions, KeyboardSensorOptions } from '@dnd-kit/dom';
import type { Sensors } from '@dnd-kit/abstract';

interface UseSensorsOptions {
  /** Pointer sensor options (mouse, touch, pen) */
  pointer?: PointerSensorOptions;
  /** Keyboard sensor options */
  keyboard?: KeyboardSensorOptions;
}

/**
 * Hook for sensor configuration using dnd-kit v8+ useSensors pattern.
 * 
 * Usage:
 * ```tsx
 * const sensors = useSensors({
 *   pointer: { activationConstraint: { distance: 8, tolerance: 5 } },
 *   keyboard: { coordinateGetter: sortableKeyboardCoordinates },
 * });
 * 
 * return <DragDropProvider sensors={sensors} ... />;
 * ```
 */
export function useSensorsHook(options: UseSensorsOptions = {}): Sensors {
  const { pointer, keyboard } = options;

  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: pointer?.activationConstraint ?? {
        distance: 8,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboard?.coordinateGetter ?? sortableKeyboardCoordinates,
    })
  );
}

/**
 * Pre-configured sensor presets.
 */
export const sensorPresets = {
  /** Default mobile-first configuration (8px mouse, 250ms touch delay) */
  default: {
    pointer: {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
      },
    },
    keyboard: {
      coordinateGetter: sortableKeyboardCoordinates,
    },
  },
  /** Strict mouse-only (no touch delay) */
  mouseOnly: {
    pointer: {
      activationConstraint: {
        distance: 5,
      },
    },
    keyboard: {
      coordinateGetter: sortableKeyboardCoordinates,
    },
  },
  /** Touch-friendly with longer delay */
  touchFriendly: {
    pointer: {
      activationConstraint: {
        distance: 0,
        tolerance: 8,
      },
    },
    keyboard: {
      coordinateGetter: sortableKeyboardCoordinates,
    },
  },
  /** Accessibility-focused with keyboard priority */
  accessibility: {
    pointer: {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
      },
    },
    keyboard: {
      coordinateGetter: sortableKeyboardCoordinates,
    },
  },
} as const;