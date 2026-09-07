import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ContactSection } from './ContactSection'
import type { Person } from '../lib/types'

const mockPerson = {
  id: 'person-1',
  firstname: 'Jane',
  lastname: 'Doe',
  email: 'jane@example.com',
  mobile: '0412345678',
  demographic: 'adult' as const,
  access_permission: 'admin' as const,
  journey: {},
  _synced_at: new Date().toISOString(),
  _source_modified: new Date().toISOString(),
} as Person

describe('ContactSection', () => {
  afterEach(cleanup)

  it('renders display mode by default', () => {
    render(<ContactSection person={mockPerson} />)
    expect(screen.getByText(/Email:/i)).toBeInTheDocument()
    expect(screen.getByText(/Mobile:/i)).toBeInTheDocument()
  })

  it('switches to edit mode and back', async () => {
    render(<ContactSection person={mockPerson} />)
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)
    expect(screen.getByLabelText(/Email/i)).toHaveValue('jane@example.com')
    expect(screen.getByLabelText(/Mobile/i)).toHaveValue('0412345678')
  })
})
