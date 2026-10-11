import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { Page } from '@/core/ui'
import FormsDashboardPage from '../dashboard'
import { getForms, deleteForm, duplicateForm } from '../lib/queries'
import type { Form, FormWithFields } from '../lib/types'

// vitest globals are disabled, so Testing Library cannot self-register cleanup.
afterEach(() => {
  cleanup()
})

vi.mock('../lib/queries', () => ({
  getForms: vi.fn(),
  deleteForm: vi.fn(),
  duplicateForm: vi.fn(),
}))

const mockGetForms = vi.mocked(getForms)
const mockDeleteForm = vi.mocked(deleteForm)
const mockDuplicateForm = vi.mocked(duplicateForm)

const forms = [
  { id: 'f1', name: 'Community Survey', description: 'Quarterly feedback', is_public: true },
  { id: 'f2', name: 'Welcome Card', description: 'New visitor details', is_public: false },
] as unknown as Form[]

// Mirrors the AppShell chrome: routed pages render inside `Page.Root`.
function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Page.Root>
        <LocationProbe />
        <FormsDashboardPage />
      </Page.Root>
    </MemoryRouter>,
  )

const firstRowCheckbox = () => document.querySelector<HTMLInputElement>('input[type="checkbox"]') as HTMLInputElement

describe('FormsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetForms.mockResolvedValue(forms)
    mockDeleteForm.mockResolvedValue(undefined)
    mockDuplicateForm.mockResolvedValue({ id: 'f1-copy' } as unknown as FormWithFields)
  })

  it('renders the forms list', async () => {
    renderDashboard()

    expect(await screen.findByText('Community Survey')).toBeInTheDocument()
    expect(screen.getByText('Welcome Card')).toBeInTheDocument()
  })

  it('filters forms instantly via the header search (D5: search lives in Page.HeaderBottom)', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    fireEvent.change(screen.getByLabelText('Search forms'), { target: { value: 'welcome' } })

    await waitFor(() => expect(screen.queryByText('Community Survey')).not.toBeInTheDocument())
    expect(screen.getByText('Welcome Card')).toBeInTheDocument()
  })

  it('enables mass manage when a row is selected', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    firstRowCheckbox().click()

    expect(await screen.findByText('1 selected')).toBeInTheDocument()
  })

  it('confirms mass deletion, deletes the selection and refreshes', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    firstRowCheckbox().click()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete (1)' }))

    // Mass delete is confirmed through the Ark UI dialog (single source of truth).
    expect(await screen.findByText('Delete Selected Forms')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete 1' }))

    await waitFor(() => expect(mockDeleteForm).toHaveBeenCalledWith('f1'))
    await waitFor(() => expect(mockGetForms).toHaveBeenCalledTimes(2))
    // Selection cleared after a successful delete → mass manage hides again.
    await waitFor(() => expect(screen.queryByText('1 selected')).not.toBeInTheDocument())
  })

  it('keeps the selection when the mass delete is cancelled', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    firstRowCheckbox().click()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete (1)' }))
    expect(await screen.findByText('Delete Selected Forms')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByText('Delete Selected Forms')).not.toBeInTheDocument())
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(mockDeleteForm).not.toHaveBeenCalled()
  })

  it('renders the error state when loading fails', async () => {
    mockGetForms.mockRejectedValue(new Error('Network down'))
    renderDashboard()

    expect(await screen.findByText('Network down')).toBeInTheDocument()
  })

  it('opens the duplicate dialog from the managed row toolbar', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    // Row actions live in the managed row toolbar, opened via the trigger.
    screen.getAllByRole('button', { name: 'Manage' })[0].click()
    fireEvent.click(await screen.findByRole('button', { name: 'Duplicate' }))

    expect(await screen.findByText('Duplicate Form')).toBeInTheDocument()
  })

  it('deletes a single form after confirmation', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    screen.getAllByRole('button', { name: 'Manage' })[0].click()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Delete Form')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockDeleteForm).toHaveBeenCalledWith('f1'))
    await waitFor(() => expect(mockGetForms).toHaveBeenCalledTimes(2))
  })

  it('duplicates a form from the managed row toolbar', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    screen.getAllByRole('button', { name: 'Manage' })[0].click()
    fireEvent.click(await screen.findByRole('button', { name: 'Duplicate' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Duplicate' }))

    await waitFor(() => expect(mockDuplicateForm).toHaveBeenCalledWith('f1'))
    // The duplicate opens in the editor (D8 keeps edit at /forms/:id/edit).
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/forms/f1-copy/edit'))
  })

  it('clears the selection from the mass manage close button', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    firstRowCheckbox().click()
    expect(await screen.findByText('1 selected')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    await waitFor(() => expect(screen.queryByText('1 selected')).not.toBeInTheDocument())
  })

  it('navigates to the form page on row click (D8)', async () => {
    renderDashboard()
    await screen.findByText('Community Survey')

    fireEvent.click(screen.getByText('Community Survey'))

    expect(await screen.findByTestId('location')).toHaveTextContent('/forms/f1')
  })
})