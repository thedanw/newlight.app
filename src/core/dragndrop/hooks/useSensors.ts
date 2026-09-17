import { createDefaultSensors, createPointerSensorOptions, createKeyboardSensorOptions } from '../sensors';
import type { Sensors } from '@dnd-kit/abstract';

interface UseSensorsOptions {
  /** Pointer sensor options (mouse, touch, pen) */
  pointer?: ReturnType<typeof createPointerSensorOptions>;
  /** Keyboard sensor options */
  keyboard?: ReturnType<typeof createKeyboardSensorOptions>;
}

/**
 * Hook for sensor configuration using createDefaultSensors (v6+ compatible).
 * 
 * Usage:
 * ```tsx
 * const sensors = useSensorsHook({
 *   pointer: { activationConstraint: { distance: 8, tolerance: 5 } },
 *   keyboard: { coordinateGetter: sortableKeyboardCoordinates },
 * });
 * 
 * return <DragDropProvider sensors={sensors} ... />;
 * ```
 */
export function useSensorsHook(options: UseSensorsOptions = {}): Sensors {
  const { pointer, keyboard } = options;

  return createDefaultSensors({
    pointer,
    keyboard,
  });
}

/**
 * Pre-configured sensor presets (v6+ compatible).
 */
export const sensorPresets = {
  /** Default mobile-first configuration (8px mouse, 250ms touch delay) */
  default: createDefaultSensors(),
  /** Strict mouse-only (no touch delay) */
  mouseOnly: createDefaultSensors({
    pointer: {
      activationConstraint: () => ({ distance: 5 }),
    },
  }),
  /** Touch-friendly with longer delay */
  touchFriendly: createDefaultSensors({
    pointer: {
      activationConstraint: () => ({ delay: 300, tolerance: 8 }),
    },
  }),
  /** Accessibility-focused with keyboard priority */
  accessibility: createDefaultSensors({
    keyboard: createKeyboardSensorOptions(),
  }),
} as const;