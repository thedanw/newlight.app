import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { PullTab } from '@/core/ui'
import { PullTabDots } from '../pull-tab-dots'
import {
  PULL_TAB_DOTS_BOX,
  PULL_TAB_DOTS_CELL,
  PULL_TAB_DOTS_OFFSET,
  PULL_TAB_DOTS_PITCH,
} from '@/core/theme/recipes/pull-tab-dots-geometry'

afterEach(() => {
  cleanup()
})

/** Boolean variant hook the recipe's diagonal spread rules hang off. */
const OPEN_VARIANT_CLASS = 'pull-tab-dots--open_true'

/** 3px cells on a 7px pitch, laid out top-left → bottom-right. */
const LATTICE = ['0', '7', '14'].flatMap((row) =>
  ['0', '7', '14'].map((column) => [column, row])
)

function renderDots(open?: boolean) {
  const { container } = render(<PullTabDots open={open} />)
  const svg = container.querySelector('svg')
  if (!svg) throw new Error('PullTabDots did not render an <svg>')
  return {
    container,
    svg,
    classes: (svg.getAttribute('class') ?? '').split(/\s+/),
    dots: Array.from(container.querySelectorAll('[data-dot]')),
  }
}

describe('PullTabDots', () => {
  it('renders nine cells on a 3 × 3 lattice, top-left → bottom-right', () => {
    const { svg, dots } = renderDots()

    expect(svg).toHaveAttribute('viewBox', `0 0 ${PULL_TAB_DOTS_BOX} ${PULL_TAB_DOTS_BOX}`)
    expect(svg).toHaveAttribute('aria-hidden', 'true')

    expect(dots).toHaveLength(9)
    expect(dots.map((dot) => dot.getAttribute('data-dot'))).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ])
    expect(dots.map((dot) => [dot.getAttribute('x'), dot.getAttribute('y')])).toEqual(LATTICE)
    expect(dots.every((dot) => dot.getAttribute('width') === `${PULL_TAB_DOTS_CELL}`)).toBe(true)
    expect(dots.every((dot) => dot.getAttribute('height') === `${PULL_TAB_DOTS_CELL}`)).toBe(true)
  })

  it('keeps the closed lattice untouched while the sidebar is closed', () => {
    const { svg, classes } = renderDots()

    expect(svg).not.toHaveAttribute('data-open')
    expect(classes).not.toContain(OPEN_VARIANT_CLASS)
  })

  it('flags the open state so the spread rules apply', () => {
    // The transforms themselves are compile-time CSS in the `pullTabDots`
    // recipe (see src/core/theme/recipes/pull-tab-dots.ts); this asserts the
    // state hook they are keyed on. Inspect the emitted declarations with:
    //   npx panda cssgen --outfile out.css
    const { svg, classes } = renderDots(true)

    expect(svg).toHaveAttribute('data-open')
    expect(classes).toContain(OPEN_VARIANT_CLASS)
  })

  it('slides mid-edge cells by exactly half a pitch — the diagonal gap centres', () => {
    // Derived, not hard-coded: the source design's 4px offset only matched its
    // 4px cell + 4px gap lattice.
    expect(PULL_TAB_DOTS_OFFSET).toBe(PULL_TAB_DOTS_PITCH / 2)
    expect(PULL_TAB_DOTS_BOX).toBe(2 * PULL_TAB_DOTS_PITCH + PULL_TAB_DOTS_CELL)
    expect(PULL_TAB_DOTS_OFFSET).toBe(3.5)

    // Gap centre of the diagonal hole between cells 1, 2, 4 and 5, measured
    // from cell 2's own centre — must equal the offset in both axes.
    const cellCentre = PULL_TAB_DOTS_PITCH + PULL_TAB_DOTS_CELL / 2
    const holeCentre = (PULL_TAB_DOTS_PITCH + PULL_TAB_DOTS_CELL) / 2
    expect(cellCentre - holeCentre).toBe(PULL_TAB_DOTS_OFFSET)
  })

  it('composes with PullTab — sidebar state and icon styling survive the merge', () => {
    const { container } = render(
      <PullTab open onClick={() => {}}>
        <PullTabDots open />
      </PullTab>
    )

    const button = container.querySelector('button')
    const svg = container.querySelector('svg')
    if (!button || !svg) throw new Error('PullTab did not render its glyph')

    expect(button).toHaveAttribute('data-open')
    expect(svg).toHaveAttribute('data-open')
    expect(svg.getAttribute('class')).toContain('pull-tab-dots')
    expect(svg.getAttribute('class')).toContain('icon')
  })
})
