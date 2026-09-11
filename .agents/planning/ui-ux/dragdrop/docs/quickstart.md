# Quickstart — dnd kit for React

> Source: https://dndkit.com/react/quickstart/
> Package: `@dnd-kit/react` — thin React layer over vanilla dnd-kit. Vanilla concepts (plugins, sensors, modifiers) apply.

## Setup

```sh
npm install @dnd-kit/react
```

## 1. Draggable

`useDraggable({id})` → `ref` makes any element draggable (unique `id` required):

```jsx
import {useDraggable} from '@dnd-kit/react';

function Draggable() {
  const {ref} = useDraggable({id: 'draggable'});
  return <button ref={ref}>Draggable</button>;
}
```

## 2. Droppable

`useDroppable({id})` → `ref` makes a drop target:

```jsx
import {useDroppable} from '@dnd-kit/react';

function Droppable({id, children}) {
  const {ref} = useDroppable({id});
  return <div ref={ref} style={{width: 300, height: 300}}>{children}</div>;
}
```

## 3. Wire together

`DragDropProvider` orchestrates interactions and exposes drag/drop events:

```jsx
import React, {useState} from 'react';
import {DragDropProvider} from '@dnd-kit/react';
import {Droppable} from './Droppable';
import {Draggable} from './Draggable';

function App() {
  const targets = ['A', 'B', 'C'];
  const [target, setTarget] = useState();
  const draggable = <Draggable id="draggable">Drag me</Draggable>;

  return (
    <DragDropProvider onDragEnd={(event) => {
      if (event.canceled) return;
      setTarget(event.operation.target?.id);
    }}>
      {!target ? draggable : null}
      {targets.map((id) => (
        <Droppable key={id} id={id}>{target === id ? draggable : `Droppable ${id}`}</Droppable>
      ))}
    </DragDropProvider>
  );
}
```

## Key points

- Provider orchestrates all drag/drop; multiple draggables + droppables coexist under one provider.
- `onDragEnd` event: bail early on `event.canceled`; read `event.operation.target?.id`.

## Next

- [DragDropProvider](components/drag-drop-provider.md)
- [useDraggable](hooks/use-draggable.md)
- [useDroppable](hooks/use-droppable.md)