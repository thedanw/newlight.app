import { PointerSensor, KeyboardSensor, PointerActivationConstraints } from '@dnd-kit/dom';
import type { PointerSensorOptions, KeyboardSensorOptions } from '@dnd-kit/dom';
import type { DragDropSensorConfig } from '../types';

/**
 * Mobile-first sensor configuration for dnd-kit Latest (v2 / @dnd-kit/react 0.5.0)
 * Touch: 250ms delay for long-press activation
 * Mouse: 8px distance threshold for drag initiation
 * Keyboard: Arrow keys with keyboardCodes
 *
 * Latest pattern: sensors are passed as `PointerSensor.configure({activationConstraints: [...]})`
 * and `KeyboardSensor.configure({keyboardCodes: {...}})` to DragDropProvider.
 */

export function createPointerSensorOptions(): PointerSensorOptions {
  return {
    // Mouse drags start after moving 8px; touch and pen use a long-press delay.
    activationConstraints: (event) => {
      if (event.pointerType === 'mouse') {
        return [new PointerActivationConstraints.Distance({ value: 8 })]
      }

      return [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
    },
  };
}

export function createKeyboardSensorOptions(): KeyboardSensorOptions {
  return {
    // Latest uses keyboardCodes for keyboard navigation
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
 * Create the default sensor array for drag-and-drop (Latest format)
 * Order matters: pointer first, then keyboard
 */
export function createDefaultSensors(config?: DragDropSensorConfig) {
  const pointerOptions = config?.pointer ?? createPointerSensorOptions();
  const keyboardOptions = config?.keyboard ?? createKeyboardSensorOptions();

  return [
    PointerSensor.configure(pointerOptions),
    KeyboardSensor.configure(keyboardOptions),
    ...(config?.custom ?? []),
  ];
}

/**
 * Sensor configuration presets (Latest format)
 */
export const sensorPresets = {
  /** Default mobile-first configuration */
  default: createDefaultSensors(),
  /** Strict mouse-only (no touch delay) */
  mouseOnly: createDefaultSensors({
    pointer: {
      activationConstraints: [
        new PointerActivationConstraints.Distance({ value: 8 }),
      ],
    },
  }),
  /** Touch-friendly with longer delay */
  touchFriendly: createDefaultSensors({
    pointer: {
      activationConstraints: [
        new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 }),
      ],
    },
  }),
  /** Accessibility-focused with keyboard priority */
  accessibility: createDefaultSensors({
    keyboard: createKeyboardSensorOptions(),
  }),
} as const;