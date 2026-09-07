import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { DemographicsSection } from './DemographicsSection'
import type { Person } from '../lib/types'

const mockPerson = {
  id: 'person-1',
  firstname: 'Jane',
  lastname: 'Doe',
  demographic: 'adult' as const,
  school_name: 'Test School',
  kindy_start_year: 2015,
  school_email_permission: 'yes' as const,
  access_permission: 'admin' as const,
  journey: {},
  _synced_at: new Date().toISOString(),
  _source_modified: new Date().toISOString(),
} as Person

describe('DemographicsSection', () => {
  afterEach(cleanup)

  it('renders display mode by default', () => {
    render(<DemographicsSection person={mockPerson} />)
    expect(screen.getByText(/Demographic:/i)).toBeInTheDocument()
    expect(screen.getByText(/School:/i)).toBeInTheDocument()
    expect(screen.getByText(/School year:/i)).toBeInTheDocument()
    expect(screen.getByText(/School email permission:/i)).toBeInTheDocument()
  })

  it('switches to edit mode and back', async () => {
    render(<DemographicsSection person={mockPerson} />)
    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)
    expect(screen.getByLabelText(/Demographic/i)).toBeInTheDocument()
    expect(screen.getByLabelText('School')).toHaveValue('Test School')
  })
})
