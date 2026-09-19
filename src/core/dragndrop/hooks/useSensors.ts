import { createDefaultSensors, createPointerSensorOptions, createKeyboardSensorOptions, sensorPresets } from '../sensors';
import type { Sensors } from '@dnd-kit/abstract';

/**
 * Hook for sensor configuration using createDefaultSensors (Latest / @dnd-kit/react 0.5.0).
 * 
 * Usage:
 * ```tsx
 * const sensors = useSensorsHook({
 *   pointer: createPointerSensorOptions(),
 *   keyboard: createKeyboardSensorOptions(),
 * });
 * 
 * return <DragDropProvider sensors={sensors} ... />;
 * ```
 */
export function useSensorsHook(options: {
  pointer?: ReturnType<typeof createPointerSensorOptions>;
  keyboard?: ReturnType<typeof createKeyboardSensorOptions>;
} = {}): Sensors {
  const { pointer, keyboard } = options;

  return createDefaultSensors({
    pointer,
    keyboard,
  });
}

/**
 * Pre-configured sensor presets (Latest / @dnd-kit/react 0.5.0).
 * Re-exports the current sensor presets from sensors/index.ts.
 */
export { sensorPresets };