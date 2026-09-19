/**
 * PullTabDots lattice geometry — the single source of truth shared by the
 * `pullTabDots` recipe (compile-time CSS) and the `PullTabDots` component (SVG
 * attributes), so tweaking the mark can never desync the closed lattice from
 * the open-state transforms.
 *
 * Layout (device-independent SVG user units — 1 unit == 1px at 1:1):
 *
 *   ┌──┐
 *   │  │ ← CELL square
 *   └──┘
 *   └─ PITCH ─┘   PITCH = CELL + GAP
 *
 *   BOX = 3 * CELL + 2 * GAP  (== 2 * PITCH + CELL, also the SVG viewBox)
 *
 * Why the open-state offset is PITCH / 2:
 *   A mid-edge cell's centre is PITCH / 2 from the lattice centre, and the
 *   centre of the diagonal gap between any four neighbouring cells is exactly
 *   half a pitch diagonally away from a mid-edge cell. Sliding by ±PITCH / 2
 *   therefore lands that cell dead centre in the gap — for ANY cell size or
 *   gap. Hard-coding the pixel offset (the source design's 4px) only works
 *   while CELL = GAP = 4.
 *
 * NOTE: no imports here on purpose — the Panda CLI loads this file through the
 * recipe config, and the browser bundle loads it through the component.
 */

/** Side length of one square cell. */
export const PULL_TAB_DOTS_CELL = 3
/** Space between neighbouring cells (tighten/loosen the mark here). */
export const PULL_TAB_DOTS_GAP = 4
/** Centre-to-centre distance between neighbouring cells. */
export const PULL_TAB_DOTS_PITCH = PULL_TAB_DOTS_CELL + PULL_TAB_DOTS_GAP
/** Glyph box — keeps the SVG viewBox and the CSS box size in lockstep. */
export const PULL_TAB_DOTS_BOX = 3 * PULL_TAB_DOTS_CELL + 2 * PULL_TAB_DOTS_GAP
/** Open-state diagonal slide: half a pitch == the diagonal gap's centre. */
export const PULL_TAB_DOTS_OFFSET = PULL_TAB_DOTS_PITCH / 2