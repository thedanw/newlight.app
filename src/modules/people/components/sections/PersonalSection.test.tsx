import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { PersonalSection } from './PersonalSection'
import type { Person } from '../lib/types'

const mockPerson = {
  id: 'person-1',
  firstname: 'Jane',
  lastname: 'Doe',
  preferred_name: 'Janey',
  middle_name: 'Marie',
  gender: 'female',
  date_of_birth: '1990-01-01',
  marital_status: 'single',
  demographic: 'adult' as const,
  access_permission: 'admin' as const,
  journey: {},
  _synced_at: new Date().toISOString(),
  _source_modified: new Date().toISOString(),
} as Person

describe('PersonalSection', () => {
  afterEach(cleanup)

  it('renders display mode by default', () => {
    render(<PersonalSection person={mockPerson} />)
    expect(screen.getByText(/First name:/i)).toBeInTheDocument()
    expect(screen.getByText((_content, element) => {
      return element?.tagName?.toLowerCase() === 'p' && !!element.textContent?.includes('Jane') && element.textContent?.includes('First name')
    })).toBeInTheDocument()
    expect(screen.getByText(/Last name:/i)).toBeInTheDocument()
    expect(screen.getByText((_content, element) => {
      return element?.tagName?.toLowerCase() === 'p' && !!element.textContent?.includes('Doe') && element.textContent?.includes('Last name')
    })).toBeInTheDocument()
  })

  it('switches to edit mode and back', async () => {
    render(<PersonalSection person={mockPerson} />)
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)
    expect(screen.getByLabelText(/First name/i)).toHaveValue('Jane')
    expect(screen.getByLabelText(/Last name/i)).toHaveValue('Doe')
  })
})
