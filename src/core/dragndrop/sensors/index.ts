import { PointerSensor, KeyboardSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import type { PointerSensorOptions, KeyboardSensorOptions } from '@dnd-kit/dom';
import type { Sensors } from '@dnd-kit/abstract';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DragDropSensorConfig } from '../types';

/**
 * Mobile-first sensor configuration for dnd-kit v8+
 * Touch: 250ms delay for long-press activation
 * Mouse: 8px distance threshold for drag initiation
 * Keyboard: Arrow keys with coordinateGetter for sortable
 * 
 * v8+ pattern: sensors are created via `useSensors(useSensor(Sensor, options))`
 * but the `sensors` prop on `DragDropProvider` accepts an array of descriptors.
 */

export function createPointerSensorOptions(): PointerSensorOptions {
  return {
    // Mobile-first: 8px distance for mouse, 250ms long-press delay for touch
    activationConstraint: (event) => {
      if (event.pointerType === 'mouse') {
        return [new PointerActivationConstraints.Distance({ value: 8 })];
      }
      // Touch / pen: long-press delay with tolerance
      return [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })];
    },
  };
}

export function createKeyboardSensorOptions(): KeyboardSensorOptions {
  return {
    // v8+ uses coordinateGetter for sortable keyboard navigation
    coordinateGetter: sortableKeyboardCoordinates,
  };
}

/**
 * Create the default sensor array for drag-and-drop (v8+ descriptor format)
 * Order matters: pointer first, then keyboard
 */
export function createDefaultSensors(config?: DragDropSensorConfig): Sensors {
  const pointerOptions = config?.pointer ?? createPointerSensorOptions();
  const keyboardOptions = config?.keyboard ?? createKeyboardSensorOptions();

  return [
    { sensor: PointerSensor, options: pointerOptions },
    { sensor: KeyboardSensor, options: keyboardOptions },
    ...(config?.custom ?? []),
  ];
}

/**
 * Sensor configuration presets (v8+ descriptor format)
 */
export const sensorPresets = {
  /** Default mobile-first configuration */
  default: createDefaultSensors(),
  /** Strict mouse-only (no touch delay) */
  mouseOnly: createDefaultSensors({
    pointer: {
      activationConstraint: () => [new PointerActivationConstraints.Distance({ value: 5 })],
    },
  }),
  /** Touch-friendly with longer delay */
  touchFriendly: createDefaultSensors({
    pointer: {
      activationConstraint: () => [new PointerActivationConstraints.Delay({ value: 300, tolerance: 8 })],
    },
  }),
  /** Accessibility-focused with keyboard priority */
  accessibility: createDefaultSensors({
    keyboard: createKeyboardSensorOptions(),
  }),
} as const;