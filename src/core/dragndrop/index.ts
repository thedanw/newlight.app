// Core types
export * from './types';

// Provider
export { DragDropProvider, useDragDropContext } from './provider';

// Sensors
export {
  createDefaultSensors,
  createPointerSensorOptions,
  createKeyboardSensorOptions,
  useDragDropSensors,
  sensorPresets,
} from './sensors';

// Hooks (modern v8+)
export {
  useSortableTree,
  type UseSortableTreeOptions,
  type TreeNodeRowHelpers,
} from './hooks/useSortableTree';
export {
  useSortableList,
  type UseSortableListOptions,
  type UseSortableListReturn,
} from './hooks/useSortableList';
export {
  useDragOverlay,
  useDefaultDragOverlay,
} from './hooks/useDragOverlay';
export {
  useSensorsHook,
  sensorPresets as sensorPresetsV8,
} from './hooks/useSensors';

// Components
export { TreeNode, type TreeNodeProps } from './components/TreeNode';
export { SortableTree, type SortableTreeProps } from './components/SortableTree';

// Utilities
export * from './utils';