import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ActionFooter, Page, PageActionsProvider } from '@/core/ui'
import FormBuilderPage from '../pages/FormBuilderPage'

afterEach(cleanup)

const mockUseOrderedCollection = vi.fn()

vi.mock('@/core/lib', () => ({
  useOrderedCollection: (options: unknown) => mockUseOrderedCollection(options),
}))

vi.mock('../lib/form-queries', () => ({
  MAPPABLE_PERSON_FIELDS: ['firstname', 'lastname', 'email'],
  getFormById: vi.fn(),
  createForm: vi.fn(),
  updateForm: vi.fn(),
}))

vi.mock('../lib/queries', () => ({
  getTags: vi.fn().mockResolvedValue([]),
}))

import { getFormById, updateForm } from '../lib/form-queries'
import type { FormWithFields } from '../lib/types'

const mockGetFormById = vi.mocked(getFormById)
const mockUpdateForm = vi.mocked(updateForm)

const formWithFields: FormWithFields = {
  id: 'form-1',
  name: 'Test form',
  description: null,
  owner_id: 'owner-1',
  is_public: false,
  submit_action: 'none',
  submit_target: null,
  settings: {},
  created_at: '2026-09-08T00:00:00.000Z',
  updated_at: '2026-09-08T00:00:00.000Z',
  fields: [
    { id: 'field-a', form_id: 'form-1', field_type: 'text', label: 'First name', placeholder: '', options: null, required: false, maps_to_field: null, sort_order: 0 },
    { id: 'field-b', form_id: 'form-1', field_type: 'text', label: 'Last name', placeholder: '', options: null, required: false, maps_to_field: null, sort_order: 1 },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/people/forms/form-1']}>
      <Routes>
        <Route
          path="/people/forms/:id"
          element={
            <PageActionsProvider>
              <Page.Root>
                <FormBuilderPage />
                <Page.Footer>
                  <ActionFooter />
                </Page.Footer>
              </Page.Root>
            </PageActionsProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FormBuilderPage reorder integration', () => {
  beforeEach(() => {
    mockUseOrderedCollection.mockReset()
    mockUseOrderedCollection.mockReturnValue({
      items: [],
      reorder: vi.fn(),
      isDirty: true,
      save: vi.fn().mockResolvedValue(true),
      reset: vi.fn(),
      error: null,
    })
    mockGetFormById.mockReset()
    mockGetFormById.mockResolvedValue(formWithFields)
    mockUpdateForm.mockReset()
    mockUpdateForm.mockResolvedValue(formWithFields)
  })

  it('wires form fields through useOrderedCollection with a form_fields definition', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByDisplayValue('First name')).toBeInTheDocument())
    const fieldCall = mockUseOrderedCollection.mock.calls.find(
      ([opts]) => opts.definition.collectionId === 'forms:fields',
    )
    expect(fieldCall).toBeDefined()
    if (!fieldCall) throw new Error('Expected a forms:fields useOrderedCollection call')
    expect(fieldCall[0].definition.table).toBe('form_fields')
  })

  it('persists reordered field sort_order via the core hook', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByDisplayValue('First name')).toBeInTheDocument())
    const fieldCall = mockUseOrderedCollection.mock.calls.find(
      ([opts]) => opts.definition.collectionId === 'forms:fields',
    )
    if (!fieldCall) throw new Error('Expected a forms:fields useOrderedCollection call')
    const { persist } = fieldCall[0]
    await act(async () => {
      await persist(['field-b', 'field-a'])
    })
    const labels = screen.getAllByDisplayValue(/name/)
    expect(labels[0]).toHaveValue('Last name')
    expect(labels[1]).toHaveValue('First name')
    fireEvent.click(screen.getByRole('button', { name: 'Save form' }))
    await waitFor(() => expect(mockUpdateForm).toHaveBeenCalled())
    expect(mockUpdateForm).toHaveBeenCalledWith(
      'form-1',
      expect.objectContaining({
        fields: [
          expect.objectContaining({ id: 'field-b', sort_order: 0 }),
          expect.objectContaining({ id: 'field-a', sort_order: 1 }),
        ],
      }),
    )
  })
})