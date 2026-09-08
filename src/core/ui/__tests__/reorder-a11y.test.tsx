import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Reorder, useReducedMotion } from '../reorder'

const { itemPropsMock } = vi.hoisted(() => ({ itemPropsMock: vi.fn() }))

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  const { forwardRef, createElement } = await import('react')
  return {
    ...actual,
    useDragControls: () => ({
      subscribe: () => () => {},
      start: vi.fn(),
      cancel: () => {},
      componentControls: new Set(),
    }),
    Reorder: {
      ...actual.Reorder,
      Item: forwardRef(function MockReorderItem(props: Record<string, unknown>, _ref) {
        itemPropsMock(props)
        return createElement('li', null, props.children as ReactNode)
      }),
    },
  }
})

const values = ['a', 'b', 'c']

function renderReorder() {
  return render(
    <Reorder.Root values={values} onReorder={vi.fn()}>
      {values.map((value) => (
        <Reorder.Item key={value} value={value}>
          <Reorder.Handle />
          <span>{value}</span>
        </Reorder.Item>
      ))}
    </Reorder.Root>,
  )
}

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('Reorder a11y + motion', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    itemPropsMock.mockClear()
  })

  it('renders a ≥44px drag handle with an accessible label', () => {
    const { container } = renderReorder()
    const handles = container.querySelectorAll('button[aria-label="Reorder item"]')
    expect(handles).toHaveLength(values.length)
    for (const handle of handles) {
      // `size="lg"` maps to `h: '11'` (44px) in the button recipe.
      expect(handle.className).toContain('button--size_lg')
    }
  })

  it('zeroes the release transition when prefers-reduced-motion is reduce', () => {
    mockMatchMedia(true)
    renderReorder()
    const captured = itemPropsMock.mock.calls.map((call) => call[0])
    expect(captured.length).toBeGreaterThan(0)
    for (const props of captured) {
      expect(props.transition).toEqual({ duration: 0 })
    }
  })

  it('keeps the default transition when motion is allowed', () => {
    mockMatchMedia(false)
    renderReorder()
    const captured = itemPropsMock.mock.calls.map((call) => call[0])
    expect(captured.length).toBeGreaterThan(0)
    for (const props of captured) {
      expect(props.transition).toBeUndefined()
    }
  })
})

describe('useReducedMotion', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns true when prefers-reduced-motion is reduce', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false when prefers-reduced-motion is no-preference', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })
})