import { PointerSensor, KeyboardSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import type { PointerSensorOptions, KeyboardSensorOptions } from '@dnd-kit/dom';
import type { Sensors } from '@dnd-kit/abstract';
import type { DragDropSensorConfig } from '../types';

/**
 * Mobile-first sensor configuration
 * Touch: 250ms delay for long-press activation
 * Mouse: 8px distance threshold for drag initiation
 * Keyboard: Arrow keys for accessibility
 *
 * @dnd-kit v2 note: sensors are configured via `Sensor.configure(options)`
 * which returns a `{ plugin, options }` descriptor. The `sensors` prop on
 * `DragDropProvider` accepts an array of sensor classes OR descriptors.
 */

export function createPointerSensorOptions(): PointerSensorOptions {
  return {
    // Mobile-first: 8px distance for mouse, 250ms long-press delay for touch
    activationConstraints: (event) => {
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
    // Standard keyboard navigation (v2 uses keyboardCodes, not coordinateGetter)
    keyboardCodes: {
      start: ['Space', 'Enter'],
      cancel: ['Escape'],
      end: ['Space', 'Enter', 'Tab'],
      up: ['ArrowUp'],
      down: ['ArrowDown'],
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
    },
  };
}

/**
 * Create the default sensor array for drag-and-drop
 * Order matters: pointer first, then keyboard
 */
export function createDefaultSensors(config?: DragDropSensorConfig): Sensors {
  const pointerOptions = config?.pointer ?? createPointerSensorOptions();
  const keyboardOptions = config?.keyboard ?? createKeyboardSensorOptions();

  return [
    PointerSensor.configure(pointerOptions),
    KeyboardSensor.configure(keyboardOptions),
    ...(config?.custom ?? []),
  ];
}

/**
 * Hook to use configured sensors
 */
export function useDragDropSensors(config?: DragDropSensorConfig) {
  return createDefaultSensors(config);
}

/**
 * Sensor configuration presets
 */
export const sensorPresets = {
  /** Default mobile-first configuration */
  default: createDefaultSensors(),
  /** Strict mouse-only (no touch delay) */
  mouseOnly: createDefaultSensors({
    pointer: {
      activationConstraints: () => [new PointerActivationConstraints.Distance({ value: 5 })],
    },
  }),
  /** Touch-friendly with longer delay */
  touchFriendly: createDefaultSensors({
    pointer: {
      activationConstraints: () => [new PointerActivationConstraints.Delay({ value: 300, tolerance: 8 })],
    },
  }),
  /** Accessibility-focused with keyboard priority */
  accessibility: createDefaultSensors({
    keyboard: createKeyboardSensorOptions(),
  }),
} as const;