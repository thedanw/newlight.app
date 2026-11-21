const fs = require('fs');
const p = 'src/core/dragndrop/hooks/useSortableList.ts';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("import { useSortable, arrayMove } from '@dnd-kit/sortable';", "import { move } from '@dnd-kit/helpers';");
c = c.replace("import { createDefaultSensors } from '../sensors';", "import { PointerSensor, KeyboardSensor, PointerActivationConstraints } from '@dnd-kit/dom';");
c = c.replace("import type { DragStartEvent, DragMoveEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';", "import type { DragStartEvent, DragOverEvent, DragEndEvent, SensorDescriptor } from '@dnd-kit/abstract';");
const oldSensors = '  const sensors = createDefaultSensors();';
const newSensors = `  const sensors = React.useMemo<SensorDescriptor<any>[]>(() => [
    PointerSensor.configure({
      activationConstraints: (event, source) => {
        const pointerType = (event as PointerEvent).pointerType;
        if (pointerType === 'mouse') {
          return [new PointerActivationConstraints.Distance({ value: 5 })];
        }
        return [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })];
      },
    }),
    KeyboardSensor.configure({
      keyboardCodes: {
        start: ['Space', 'Enter'],
        cancel: ['Escape'],
        end: ['Space', 'Enter', 'Tab'],
        up: ['ArrowUp'],
        down: ['ArrowDown'],
        left: ['ArrowLeft'],
        right: ['ArrowRight'],
      },
    }),
  ], []);`;
c = c.replace(oldSensors, newSensors);
c = c.replace('arrayMove(items, sourceIndex, targetIndex)', 'move(items, { sourceIndex, targetIndex })');
c = c.replace('    const { active, over } = event;', "    const operation = (event as any).operation as { source?: { id: string | number }; target?: { id: string | number } } | undefined;\n    const active = operation?.source;\n    const over = operation?.target;");
c = c.replace('    if (!event.canceled) {', "    const operation = (event as any).operation as { canceled?: boolean } | undefined;\n    const canceled = operation?.canceled ?? (event as any).canceled ?? false;\n    if (!canceled) {");
const start = c.indexOf('  // Get item props for rendering');
const end = c.indexOf('  return {');
if (start !== -1 && end !== -1) {
  c = c.slice(0, start) + c.slice(end);
}
c = c.replace('    getItemProps,', '');
c = c.replace('  /** Drag move handler */\n  handleDragMove: (event: DragMoveEvent) => void;\n', '');
c = c.replace('    handleDragMove,', '');
const cb = '  const handleDragMove = React.useCallback((_event: DragMoveEvent) => {\n    // No special handling needed for flat lists\n  }, []);\n';
c = c.replace(cb, '');
fs.writeFileSync(p, c);
console.log('rewritten', p);
