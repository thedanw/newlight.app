# Multiple Sortable Lists — Complete Example Code

> Referenced by: [multiple-sortable-lists.md](../guides/multiple-sortable-lists.md)
> Source: https://dndkit.com/react/guides/multiple-sortable-lists/
> Files: `Item.js`, `Column.js`, `App.js`, plus cancel-aware `App.js`. Three columns (`A`, `B`, `C`); items reorder within and across columns.

## Item.js

```jsx
import {useSortable} from '@dnd-kit/react/sortable';

function Item({id, index, column}) {
  const {ref} = useSortable({
    id,
    index,
    type: 'item',
    accept: 'item',
    group: column,
  });

  return (
    <div ref={ref} className="Item">
      {id}
    </div>
  );
}
```

> Uncontrolled sortable items — sorted within each column **and across columns** via `group` (the column id). (Reconstructed from the guide's description.)

## Column.js (droppable container)

Lets items land in **empty** columns; `CollisionPriority.Low` lets child items win collisions:

```jsx
import {useDroppable} from '@dnd-kit/react';
import {CollisionPriority} from '@dnd-kit/abstract';

function Column({id, children}) {
  const {ref} = useDroppable({
    id,
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div ref={ref} className="Column">
      {children}
    </div>
  );
}
```

## App.js (move items between lists)

`move(items, event)` from `@dnd-kit/helpers` mutates the arrays cross-list in `onDragOver`:

```jsx
import {DragDropProvider} from '@dnd-kit/react';
import {move} from '@dnd-kit/helpers';

export function App() {
  const [items, setItems] = useState({
    A: ['A0', 'A1', 'A2'],
    B: ['B0', 'B1'],
    C: [],
  });
  const [columnOrder, setColumnOrder] = useState(() => Object.keys(items));

  return (
    <DragDropProvider
      onDragOver={(event) => {
        const {source, target} = event.operation;

        if (source?.type === 'column') return;

        setItems((items) => move(items, event));
      }}
      onDragEnd={(event) => {
        const {source, target} = event.operation;

        if (event.canceled || source.type !== 'column') return;

        setColumnOrder((columns) => move(columns, event));
      }}
    >
      <div className="Root">
        {columnOrder.map((column, columnIndex) => (
          <Column key={column} id={column} index={columnIndex}>
            {items[column].map((id, index) => (
              <Item key={id} id={id} index={index} column={column} />
            ))}
          </Column>
        ))}
      </div>
    </DragDropProvider>
  );
}
```

## Column.js (sortable columns — optional)

Reorder columns via `useSortable`; pass `index` from `App`:

```jsx
import {useSortable} from '@dnd-kit/react/sortable';

function Column({id, index, children}) {
  const {ref} = useSortable({
    id,
    index,
    type: 'column',
  });

  return (
    <div ref={ref} className="Column">
      {children}
    </div>
  );
}
```

> (Reconstructed from the guide's description; `source.type === 'column'` guards in `App` dispatch column moves to `columnOrder`.)
> Column order is applied in `onDragEnd` (not `onDragOver`) so the columns' React order only updates on drop, while dnd-kit optimistically reorders during the drag. For finer control, handle it in `onDragOver`.

## App.js (cancel-aware)

Snapshot items in `onDragStart`; restore on `event.canceled`:

```jsx
import React, {useRef, useState} from 'react';
import {DragDropProvider} from '@dnd-kit/react';
import {move} from '@dnd-kit/helpers';
import "./styles.css";

import {Column} from './Column';
import {Item} from './Item';

export function App({style = styles}) {
  const [items, setItems] = useState({
    A: ['A0', 'A1', 'A2'],
    B: ['B0', 'B1'],
    C: [],
  });
  const previousItems = useRef(items);
  const [columnOrder, setColumnOrder] = useState(() => Object.keys(items));

  return (
    <DragDropProvider
      onDragStart={() => {
        previousItems.current = items;
      }}
      onDragOver={(event) => {
        const {source, target} = event.operation;

        if (source?.type === 'column') return;

        setItems((items) => move(items, event));
      }}
      onDragEnd={(event) => {
        const {source, target} = event.operation;

        if (event.canceled) {
          if (source.type === 'item') {
            setItems(previousItems.current);
          }

          return;
        }

        if (source.type === 'column') {
          setColumnOrder((columns) => move(columns, event));
        }
      }}
    >
      <div className="Root">
        {columnOrder.map((column, columnIndex) => (
          <Column key={column} id={column} index={columnIndex}>
            {items[column].map((id, index) => (
              <Item key={id} id={id} index={index} column={column} />
            ))}
          </Column>
        ))}
      </div>
    </DragDropProvider>
  );
}
```

> Optimistic updates performed by `@dnd-kit` auto-revert when a drag is canceled.