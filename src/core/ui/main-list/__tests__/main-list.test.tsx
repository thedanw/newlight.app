import { useState } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MainList } from '..'
import { mainListOverlay, mainListSlotClassNames } from '../main-list-context'

// vitest globals are disabled, so Testing Library cannot self-register cleanup.
afterEach(() => {
  cleanup()
})

type Item = { id: string; name: string; description?: string }

const PAGE_ONE: Item[] = [
  { id: 'f1', name: 'Alpha' },
  { id: 'f2', name: 'Beta' },
]
/** All keys matching the current "search" — spans more than the visible page (decision #28). */
const ALL_FILTERED_KEYS = ['f1', 'f2', 'f3']

const checkboxes = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))

/** Controlled harness: the consumer owns the selection set, MainList owns the logic. */
function ControlledList(props: {
  onSelectionChange?: (keys: Set<string>) => void
  onSelectAll?: (keys: string[]) => void
  onSelectVisible?: (keys: string[]) => void
  onDeleteSelected?: (keys: string[]) => Promise<void>
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  return (
    <MainList.Root
      items={PAGE_ONE}
      getKey={(item: Item) => item.id}
      renderRow={(item: Item) => <MainList.RowContent primary={item.name} />}
      selection={{
        selectedKeys,
        onSelectionChange: (keys) => {
          setSelectedKeys(keys)
          props.onSelectionChange?.(keys)
        },
        allFilteredKeys: ALL_FILTERED_KEYS,
        onSelectAll: props.onSelectAll,
        onSelectVisible: props.onSelectVisible,
      }}
      toolbar={{}}
      massManage={{
        visible: selectedKeys.size > 0,
        onClose: () => setSelectedKeys(new Set()),
        onDeleteSelected: props.onDeleteSelected ?? (async () => undefined),
        selectedCount: selectedKeys.size,
      }}
    />
  )
}

describe('MainList selection (controlled)', () => {
  it('toggles row selection via the row checkbox', async () => {
    const onSelectionChange = vi.fn()
    render(<ControlledList onSelectionChange={onSelectionChange} />)

    checkboxes()[0].click()

    await waitFor(() => expect(onSelectionChange).toHaveBeenCalledWith(new Set(['f1'])))
    // Hooks locked by findings #2: row + root reflect select mode / selection.
    expect(document.querySelector('[data-selected="true"]')).not.toBeNull()
    expect(document.querySelector('[data-select-mode="true"]')).not.toBeNull()
  })

  it('Select Visible selects only the current page and notifies', async () => {
    const onSelectionChange = vi.fn()
    const onSelectVisible = vi.fn()
    render(<ControlledList onSelectionChange={onSelectionChange} onSelectVisible={onSelectVisible} />)

    checkboxes()[0].click()
    await waitFor(() => expect(screen.getByText('1 selected')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Select Visible' }))

    await waitFor(() => expect(onSelectVisible).toHaveBeenCalledWith(['f1', 'f2']))
    // Union of the previous selection and the visible page.
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['f1', 'f2']))
    // Page fully selected, but filtered set is not → Select All stays available.
    expect(screen.getByRole('button', { name: 'Select Visible' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Select All' })).toBeEnabled()
  })

  it('Select All selects every filtered key, not just the visible page', async () => {
    const onSelectionChange = vi.fn()
    const onSelectAll = vi.fn()
    render(<ControlledList onSelectionChange={onSelectionChange} onSelectAll={onSelectAll} />)

    checkboxes()[0].click()
    await waitFor(() => expect(screen.getByText('1 selected')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Select All' }))

    await waitFor(() => expect(onSelectAll).toHaveBeenCalledWith(ALL_FILTERED_KEYS))
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(ALL_FILTERED_KEYS))
    // Everything filtered is selected → the action disables itself.
    expect(screen.getByRole('button', { name: 'Select All' })).toBeDisabled()
  })

  it('Deselect All clears the selection and hides mass manage', async () => {
    render(<ControlledList />)

    checkboxes()[0].click()
    await waitFor(() => expect(screen.getByText('1 selected')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Deselect All' }))

    await waitFor(() => expect(screen.queryByText('1 selected')).not.toBeInTheDocument())
  })
})

describe('MainList mass manage', () => {
  it('drives visibility through data-visible (recipe animation hook)', async () => {
    const { container } = render(<ControlledList />)
    const massManage = container.querySelector('[data-visible]')

    expect(massManage).toHaveAttribute('data-visible', 'false')
    checkboxes()[0].click()
    await waitFor(() => expect(massManage).toHaveAttribute('data-visible', 'true'))
  })

  it('deletes the selected keys, then clears the selection', async () => {
    const onDeleteSelected = vi.fn().mockResolvedValue(undefined)
    render(<ControlledList onDeleteSelected={onDeleteSelected} />)

    // Selection sets are absolute — wait for the re-render between toggles.
    checkboxes()[0].click()
    await waitFor(() => expect(screen.getByText('1 selected')).toBeInTheDocument())
    checkboxes()[1].click()
    await waitFor(() => expect(screen.getByText('2 selected')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Delete (2)' }))

    await waitFor(() => expect(onDeleteSelected).toHaveBeenCalledWith(['f1', 'f2']))
    await waitFor(() => expect(screen.queryByText('2 selected')).not.toBeInTheDocument())
  })

  it('keeps the selection when the delete flow rejects (cancel)', async () => {
    const onDeleteSelected = vi.fn().mockRejectedValue(new Error('cancelled'))
    render(<ControlledList onDeleteSelected={onDeleteSelected} />)

    checkboxes()[0].click()
    await waitFor(() => expect(screen.getByText('1 selected')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Delete (1)' }))

    await waitFor(() => expect(onDeleteSelected).toHaveBeenCalled())
    // Rejection = cancel: MainList must NOT clear the selection.
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(document.querySelector('[data-selected="true"]')).not.toBeNull()
  })
})

describe('MainList row toolbar (managed)', () => {
  function renderWithToolbar() {
    const onRowClick = vi.fn()
    render(
      <MainList.Root
        items={PAGE_ONE}
        getKey={(item: Item) => item.id}
        renderRow={(item: Item) => <MainList.RowContent primary={item.name} />}
        renderRowToolbar={(item: Item) => <button type="button">Edit {item.name}</button>}
        onRowClick={onRowClick}
      />,
    )
    return { onRowClick }
  }

  const trigger = () => screen.getAllByRole('button', { name: 'Manage' })[0] as HTMLButtonElement

  it('opens via the managed trigger with aria-expanded and data-open', () => {
    renderWithToolbar()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger())

    const toolbar = document.querySelector('[data-open="true"]')
    expect(toolbar).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Edit Alpha' })).toBeInTheDocument()
    // Focus moves into the toolbar for keyboard users.
    expect(toolbar).toHaveFocus()
  })

  it('closes on Escape and restores the trigger', () => {
    renderWithToolbar()
    fireEvent.click(trigger())

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.querySelector('[data-open="true"]')).toBeNull()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('raises the open row above the toolbar overlay', () => {
    renderWithToolbar()
    fireEvent.click(trigger())

    // Stacking contract: the open row sets the `data-toolbar-open` hook and
    // the row recipe maps that hook to position/zIndex above the fixed
    // overlay (zIndex 50) — the toolbar stays interactive while the backdrop
    // dims everything else. (happy-dom has no stylesheet engine, so the
    // recipe output is asserted directly, as with the rowSelect tests below.)
    const openRow = document.querySelector('[data-toolbar-open="true"]')
    expect(openRow).not.toBeNull()
    const rowClass = mainListSlotClassNames.row()
    expect((openRow as Element).className).toContain(rowClass.split(' ')[0])

    // The overlay class itself pins the backdrop at zIndex 50.
    const overlay = document.querySelector('[role="presentation"]')
    expect(overlay).not.toBeNull()
    expect((overlay as Element).className).toContain(mainListOverlay.split(' ')[0])

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.querySelector('[data-toolbar-open="true"]')).toBeNull()
  })

  it('closes when the overlay is clicked', () => {
    renderWithToolbar()
    fireEvent.click(trigger())

    const overlay = document.querySelector('[role="presentation"]')
    expect(overlay).not.toBeNull()
    fireEvent.click(overlay as Element)

    expect(document.querySelector('[data-open="true"]')).toBeNull()
  })

  it('suppresses row navigation while the toolbar is open', () => {
    const { onRowClick } = renderWithToolbar()
    fireEvent.click(trigger())
    fireEvent.click(screen.getByText('Alpha'))
    expect(onRowClick).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByText('Alpha'))
    expect(onRowClick).toHaveBeenCalledTimes(1)
  })
})

describe('MainList footer pagination', () => {
  it('renders the visible range and forwards page changes', async () => {
    const onPageChange = vi.fn()
    render(
      <MainList.Root
        items={PAGE_ONE}
        getKey={(item: Item) => item.id}
        renderRow={(item: Item) => <MainList.RowContent primary={item.name} />}
        pagination={{ page: 1, pageSize: 25, total: 60, onPageChange }}
      />,
    )

    expect(screen.getByText('Showing 1 to 25 of 60')).toBeInTheDocument()
    // count derives from total, so every page is reachable (findings #12).
    screen.getByRole('button', { name: 'page 2' }).click()
    // Ark/zag dispatches onPageChange asynchronously.
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(2))
  })

  it('renders the last-page range', () => {
    render(
      <MainList.Root
        items={PAGE_ONE}
        getKey={(item: Item) => item.id}
        renderRow={(item: Item) => <MainList.RowContent primary={item.name} />}
        pagination={{ page: 3, pageSize: 25, total: 60, onPageChange: vi.fn() }}
      />,
    )
    expect(screen.getByText('Showing 51 to 60 of 60')).toBeInTheDocument()
  })
})

describe('MainList row slots + select variant', () => {
  it('renders primary/secondary/meta slots', () => {
    render(
      <MainList.Root
        items={[{ id: 'f1', name: 'Alpha', description: 'The alpha form' }]}
        getKey={(item: Item) => item.id}
        renderRow={(item: Item) => (
          <MainList.RowContent primary={item.name} secondary={item.description} meta={<span>Public</span>} />
        )}
      />,
    )

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('The alpha form')).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()
  })

  it('renders RowSelect with the hidden width variant outside select mode', () => {
    const { container } = render(
      <MainList.Root
        items={PAGE_ONE}
        getKey={(item: Item) => item.id}
        renderRow={(item: Item) => <MainList.RowContent primary={item.name} />}
      />,
    )

    const row = container.querySelector('[data-select-mode="false"]')
    expect(row?.firstElementChild).toHaveClass(mainListSlotClassNames.rowSelect({ visible: false }))
    // The variant must actually differentiate (no-op variant classes are finding #9).
    expect(mainListSlotClassNames.rowSelect({ visible: false })).not.toBe(
      mainListSlotClassNames.rowSelect({ visible: true }),
    )
  })

  it('switches RowSelect to the visible width variant in select mode', async () => {
    render(<ControlledList />)
    checkboxes()[0].click()

    await waitFor(() => {
      const row = document.querySelector('[data-select-mode="true"]')
      expect(row?.firstElementChild).toHaveClass(mainListSlotClassNames.rowSelect({ visible: true }))
    })
  })
})

