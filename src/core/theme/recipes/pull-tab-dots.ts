import { defineRecipe } from '@pandacss/dev'
import {
  PULL_TAB_DOTS_BOX,
  PULL_TAB_DOTS_OFFSET,
} from './pull-tab-dots-geometry'

/**
 * PullTabDots — the pull-tab's indicator glyph: nine square cells on a 3 × 3
 * lattice (see pull-tab-dots-geometry.ts for the shared lattice math).
 *
 * CLOSED — the tight lattice.
 * OPEN   — the four mid-edge cells slide half a pitch diagonally into the
 *          lattice's diagonal gaps, so the mark opens outward, while the four
 *          corners and the centre hold their position. Pure CSS transform
 *          transitions, so it reverses on close.
 *
 * Geometry and motion are a faithful translation of the Paper-Dashboard 9-dot
 * indicator, re-expressed with Panda primitives (no SCSS, no `navbar` /
 * `toggler` naming). The source's fixed dark bar colour becomes `currentcolor`
 * so the pull-tab's own hover/active colours drive the glyph.
 *
 * Offsets are derived from the lattice, never hard-coded: PITCH / 2 is the one
 * distance that lands a cell in a diagonal gap, whatever the cell size or gap.
 */
export const pullTabDots = defineRecipe({
  className: 'pull-tab-dots',
  jsx: ['PullTabDots'],
  base: {
    // Intrinsic size == the lattice box, so the glyph renders 1:1 (crisp
    // cells). Inside PullTab, the Icon wrapper also declares a box size; this
    // rule is emitted after `.icon` in the recipes layer, so the exact lattice
    // size wins.
    boxSize: `${PULL_TAB_DOTS_BOX}px`,
    flexShrink: '0',
    color: 'currentcolor',
    '& [data-dot]': {
      fill: 'currentcolor',
      // Source easing: all 0.3s cubic-bezier(0.685, 0.0473, 0.346, 1)
      transition: 'transform 300ms cubic-bezier(0.685, 0.0473, 0.346, 1)',
    },
  },
  variants: {
    open: {
      true: {
        // Corners + centre hold their position…
        '& [data-dot="1"], & [data-dot="3"], & [data-dot="5"], & [data-dot="7"], & [data-dot="9"]':
          { transform: 'scale(1)' },
        // …while the mid-edge cells slide half a pitch into the diagonal gaps.
        '& [data-dot="2"]': {
          transform: `translate(${-PULL_TAB_DOTS_OFFSET}px, ${PULL_TAB_DOTS_OFFSET}px)`,
        },
        '& [data-dot="4"]': {
          transform: `translate(${PULL_TAB_DOTS_OFFSET}px, ${PULL_TAB_DOTS_OFFSET}px)`,
        },
        '& [data-dot="6"]': {
          transform: `translate(${-PULL_TAB_DOTS_OFFSET}px, ${-PULL_TAB_DOTS_OFFSET}px)`,
        },
        '& [data-dot="8"]': {
          transform: `translate(${PULL_TAB_DOTS_OFFSET}px, ${-PULL_TAB_DOTS_OFFSET}px)`,
        },
      },
    },
  },
})