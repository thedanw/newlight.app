'use client'
import {
  Reorder as MotionReorder,
  useDragControls,
  type DragControls,
} from 'framer-motion'
import { GripVerticalIcon } from 'lucide-react'
import {
  createContext,
  forwardRef,
  useContext,
  type ComponentProps,
} from 'react'
import { cx } from 'styled-system/css'
import { reorder } from 'styled-system/recipes'
import { IconButton } from './icon-button'

// NOTE: The `reorder` slot recipe classes are applied manually (not via
// `createStyleContext`/`styled`) because Panda's `styled` factory treats
// `transition` as a CSS property, which conflicts with framer-motion's
// `Transition` prop on `Reorder.Group` / `Reorder.Item`.

// --- Root ---------------------------------------------------------------

export type RootProps = ComponentProps<typeof MotionReorder.Group>

export const Root = forwardRef<HTMLUListElement, RootProps>(function ReorderRoot(
  { className, ...props },
  ref,
) {
  return (
    <MotionReorder.Group
      ref={ref}
      className={cx(reorder().root, className)}
      {...props}
    />
  )
})

// --- Item ---------------------------------------------------------------

const ItemControlsContext = createContext<DragControls | null>(null)

export type ItemProps = ComponentProps<typeof MotionReorder.Item>

export const Item = forwardRef<HTMLLIElement, ItemProps>(function ReorderItem(
  { dragListener = false, dragControls, className, children, ...props },
  ref,
) {
  const controls = useDragControls()
  return (
    <ItemControlsContext.Provider value={controls}>
      <MotionReorder.Item
        ref={ref}
        className={cx(reorder().item, className)}
        dragListener={dragListener}
        dragControls={dragControls ?? controls}
        {...props}
      >
        {children}
      </MotionReorder.Item>
    </ItemControlsContext.Provider>
  )
})

// --- Handle -------------------------------------------------------------

export type HandleProps = ComponentProps<typeof IconButton>

export const Handle = forwardRef<HTMLButtonElement, HandleProps>(function ReorderHandle(
  { onPointerDown, className, children, ...props },
  ref,
) {
  const controls = useContext(ItemControlsContext)
  return (
    <IconButton
      ref={ref}
      className={cx(reorder().handle, className)}
      variant="plain"
      size="sm"
      aria-label="Reorder item"
      onPointerDown={(event) => {
        controls?.start(event)
        onPointerDown?.(event)
      }}
      {...props}
    >
      {children ?? <GripVerticalIcon />}
    </IconButton>
  )
})

// --- Compound -----------------------------------------------------------

export const Reorder = Object.assign(Root, {
  Root,
  Item,
  Handle,
})