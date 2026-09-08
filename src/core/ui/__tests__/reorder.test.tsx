import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Reorder } from '../reorder'

const { startMock } = vi.hoisted(() => ({ startMock: vi.fn() }))

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return {
    ...actual,
    useDragControls: () => ({
      subscribe: () => () => {},
      start: startMock,
      cancel: () => {},
      componentControls: new Set(),
    }),
  }
})

describe('Reorder', () => {
  const values = ['a', 'b', 'c']

  beforeEach(() => {
    startMock.mockClear()
  })

  function renderReorder(onReorder = vi.fn()) {
    return render(
      <Reorder.Root values={values} onReorder={onReorder}>
        {values.map((value) => (
          <Reorder.Item key={value} value={value}>
            <Reorder.Handle />
            <span>{value}</span>
          </Reorder.Item>
        ))}
      </Reorder.Root>,
    )
  }

  it('renders a list with all items in order', () => {
    renderReorder()
    expect(screen.getByRole('list')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(values.length)
    for (const value of values) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('renders an accessible drag handle on each item', () => {
    const { container } = renderReorder()
    const handles = container.querySelectorAll('button[aria-label="Reorder item"]')
    expect(handles).toHaveLength(values.length)
  })

  it('starts a drag when the handle is pressed', () => {
    const { container } = renderReorder()
    const handle = container.querySelector('button[aria-label="Reorder item"]')
    expect(handle).not.toBeNull()
    fireEvent.pointerDown(handle!)
    expect(startMock).toHaveBeenCalled()
  })
})