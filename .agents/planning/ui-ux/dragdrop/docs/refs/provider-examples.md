# DragDropProvider — Full Examples

> Referenced by: [drag-drop-provider.md](../components/drag-drop-provider.md)
> Source: https://dndkit.com/react/components/drag-drop-provider/

## Event handling

```jsx
function App() {
  return (
    <DragDropProvider
      onBeforeDragStart={(event) => {
        // Optionally prevent dragging
        if (shouldPreventDrag(event.operation.source)) {
          event.preventDefault();
        }
      }}
      onDragStart={({operation}) => {
        console.log('Started dragging', operation.source.id);
      }}
      onDragMove={({operation}) => {
        console.log('Current position:', operation.position);
      }}
      onDragOver={({operation}) => {
        const {source, target} = operation;
        console.log(`${source.id} is over ${target?.id}`);
      }}
      onDragEnd={({operation}) => {
        const {source, target} = operation;
        if (target) {
          console.log(`Dropped ${source.id} onto ${target.id}`);
        }
      }}
    >
      <YourDraggableContent />
    </DragDropProvider>
  );
}
```

## Multiple contexts

Independent contexts — elements cannot drop into another:

```jsx
function App() {
  return (
    <div>
      <DragDropProvider>
        <FileList /> {/* Files can only be dropped in this context */}
      </DragDropProvider>

      <DragDropProvider>
        <TaskList /> {/* Tasks can only be dropped in this context */}
      </DragDropProvider>
    </div>
  );
}
```

## Extending defaults (function form)

Receives defaults to extend:

```jsx
import {Feedback} from '@dnd-kit/dom';
import {RestrictToWindow} from '@dnd-kit/dom/modifiers';

function App() {
  return (
    <DragDropProvider
      // Add a plugin alongside defaults
      plugins={(defaults) => [...defaults, Feedback.configure({dropAnimation: null})]}
      // Add a modifier
      modifiers={(defaults) => [...defaults, RestrictToWindow]}
    >
      <YourDraggableContent />
    </DragDropProvider>
  );
}
```

## Replacing defaults (array form)

```jsx
import {PointerSensor, KeyboardSensor} from '@dnd-kit/dom';

function App() {
  return (
    <DragDropProvider
      sensors={[PointerSensor, KeyboardSensor]}
      plugins={[AutoScroller, Accessibility]}
      modifiers={[RestrictToWindow]}
    >
      <YourDraggableContent />
    </DragDropProvider>
  );
}
```

> Caveat: original snippet used `AutoScroller`, `Accessibility`, `RestrictToWindow` without shown imports — add them from `@dnd-kit/dom` / `@dnd-kit/dom/modifiers` as needed.