import { PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import type { PointerSensorOptions, KeyboardSensorOptions } from '@dnd-kit/core';
import type { Sensors } from '@dnd-kit/abstract';
import type { DragDropSensorConfig } from '../types';

/**
 * Mobile-first sensor configuration for dnd-kit v6+ (core)
 * Touch: 250ms delay for long-press activation
 * Mouse: 8px distance threshold for drag initiation
 * Keyboard: Arrow keys with keyboardCodes
 * 
 * v6+ pattern: sensors are passed as `{ sensor: SensorClass, options }` objects
 * to DndContext.
 */

export function createPointerSensorOptions(): PointerSensorOptions {
  return {
    // Mobile-first: 8px distance for mouse, 250ms long-press delay for touch
    activationConstraint: (event: { pointerType: string }) => {
      if (event.pointerType === 'mouse') {
        return { distance: 8 };
      }
      // Touch / pen: long-press delay with tolerance
      return { delay: 250, tolerance: 5 };
    },
  };
}

export function createKeyboardSensorOptions(): KeyboardSensorOptions {
  return {
    // v6+ uses keyboardCodes for keyboard navigation
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
 * Create the default sensor array for drag-and-drop (v6+ format)
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
 * Sensor configuration presets (v6+ format)
 */
export const sensorPresets = {
  /** Default mobile-first configuration */
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