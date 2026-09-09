import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Page } from '@/core/ui'
import { ActionFooter } from '../action-footer'
import { PageActionsProvider, useRegisterPageActions, type PageActions } from '../page-actions'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Harness({ actions, enabled = true }: { actions: PageActions; enabled?: boolean }) {
  useRegisterPageActions(actions, enabled)
  return null
}

function renderFooter(actions: PageActions, enabled = true) {
  return render(
    <PageActionsProvider>
      <Page.Root>
        <Harness actions={actions} enabled={enabled} />
        <ActionFooter />
      </Page.Root>
    </PageActionsProvider>,
  )
}

describe('ActionFooter', () => {
  it('renders Cancel and Save buttons when actions are dirty', () => {
    const { container } = renderFooter({ cancel: vi.fn(), apply: vi.fn(), isSaving: false, isDirty: true })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(container.querySelector('[data-state="visible"]')).not.toBeNull()
  })

  it('uses applyLabel for the apply button', () => {
    renderFooter({ cancel: vi.fn(), apply: vi.fn(), isSaving: false, isDirty: true, applyLabel: 'Apply' })
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
  })

  it('is inert + aria-hidden and hides buttons from the a11y tree when not dirty', () => {
    const { container } = renderFooter({ cancel: vi.fn(), apply: vi.fn(), isSaving: false, isDirty: false })
    const footer = container.querySelector('[data-state="hidden"]')
    expect(footer).not.toBeNull()
    expect(footer).toHaveAttribute('inert')
    expect(footer).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
  })

  it('stays hidden + inert when registration is disabled', () => {
    const { container } = renderFooter(
      { cancel: vi.fn(), apply: vi.fn(), isSaving: false, isDirty: true },
      false,
    )
    const footer = container.querySelector('[data-state="hidden"]')
    expect(footer).not.toBeNull()
    expect(footer).toHaveAttribute('inert')
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
  })

  it('calls cancel and apply handlers on click', () => {
    const cancel = vi.fn()
    const apply = vi.fn()
    renderFooter({ cancel, apply, isSaving: false, isDirty: true })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(cancel).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(apply).toHaveBeenCalledTimes(1)
  })

  it('disables both buttons while saving', () => {
    renderFooter({ cancel: vi.fn(), apply: vi.fn(), isSaving: true, isDirty: true })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})