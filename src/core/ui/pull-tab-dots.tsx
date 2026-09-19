import { type ComponentProps, forwardRef } from 'react'
import { styled } from 'styled-system/jsx'
import { pullTabDots } from 'styled-system/recipes'
import {
  PULL_TAB_DOTS_BOX,
  PULL_TAB_DOTS_CELL,
  PULL_TAB_DOTS_PITCH,
} from '@/core/theme/recipes/pull-tab-dots-geometry'

type BasePullTabDotsProps = ComponentProps<typeof BasePullTabDots>
const BasePullTabDots = styled('svg', pullTabDots)

export interface PullTabDotsProps extends Omit<BasePullTabDotsProps, 'open'> {
  /** Whether the sidebar is open — spreads the mid-edge cells into the gaps */
  open?: boolean
}

// Lattice geometry comes from pull-tab-dots-geometry.ts so the closed lattice
// (these attributes) and the open-state transforms (the recipe) can never
// disagree. Cell 3px + gap 4px → pitch 7px, box 17px (also the viewBox, which
// keeps user units 1:1 with CSS px).
//
// Deliberately NO shape-rendering="crispEdges": an odd pitch puts the open
// positions on half-pixels (±3.5), and edge snapping would jitter the cells
// mid-transition. The closed lattice is on whole pixels anyway.
const DOT_CELL = PULL_TAB_DOTS_CELL
const DOT_PITCH = PULL_TAB_DOTS_PITCH
const DOT_BOX = PULL_TAB_DOTS_BOX

// Slot numbers follow reading order: dot1 top-left → dot9 bottom-right. The
// recipe's open-state rules address them as [data-dot="1"…"9"].
const DOT_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export const PullTabDots = forwardRef<SVGSVGElement, PullTabDotsProps>(
  ({ open = false, ...props }, forwardedRef) => {
    return (
      <BasePullTabDots
        ref={forwardedRef}
        viewBox={`0 0 ${DOT_BOX} ${DOT_BOX}`}
        aria-hidden="true"
        focusable="false"
        // Only flag the variant when open, so a closed glyph carries no
        // `--open_false` class.
        open={open || undefined}
        data-open={open ? '' : undefined}
        {...props}
      >
        {DOT_SLOTS.map((slot) => {
          const column = (slot - 1) % 3
          const row = Math.floor((slot - 1) / 3)

          return (
            <rect
              key={slot}
              data-dot={slot}
              x={column * DOT_PITCH}
              y={row * DOT_PITCH}
              width={DOT_CELL}
              height={DOT_CELL}
            />
          )
        })}
      </BasePullTabDots>
    )
  }
)

PullTabDots.displayName = 'PullTabDots'