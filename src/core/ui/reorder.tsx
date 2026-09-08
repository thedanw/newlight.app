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
  useEffect,
  useState,
  type ComponentProps,
} from 'react'
import { cx } from 'styled-system/css'
import { reorder } from 'styled-system/recipes'
import { IconButton } from './icon-button'

// NOTE: The `reorder` slot recipe classes are applied manually (not via
// `createStyleContext`/`styled`) because Panda's `styled` factory treats
// `transition` as a CSS property, which conflicts with framer-motion's
// `Transition` prop on `Reorder.Group` / `Reorder.Item`.

// Local reduced-motion hook (house pattern: do NOT import framer's). Drag
// tracking is never gated on reduced motion — only the release animation is
// suppressed (zeroed transition).
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}

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
  { dragListener = false, dragControls, className, transition, children, ...props },
  ref,
) {
  const controls = useDragControls()
  const reducedMotion = useReducedMotion()
  return (
    <ItemControlsContext.Provider value={controls}>
      <MotionReorder.Item
        ref={ref}
        className={cx(reorder().item, className)}
        dragListener={dragListener}
        dragControls={dragControls ?? controls}
        {...props}
        transition={reducedMotion ? { duration: 0 } : transition}
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
      size="lg"
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