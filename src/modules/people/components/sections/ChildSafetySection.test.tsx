import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import type { Person } from '../lib/types'
import { ChildSafetySection } from './ChildSafetySection'

describe('ChildSafetySection', () => {
  afterEach(cleanup)

  const mockPerson = {
    id: 'person-1',
    firstname: 'Jane',
    lastname: 'Doe',
    demographic: 'adult' as const,
    access_permission: 'admin' as const,
    journey: {},
    _synced_at: new Date().toISOString(),
    _source_modified: new Date().toISOString(),
    safe_ministry_leader_type: 'adults_leader' as const,
    safe_ministry_notes: 'Trained in 2024',
    safe_ministry_start_date: '2024-01-15',
    wwcc_number: 'WWCC123456',
    wwcc_expiry_date: '2027-12-31',
    wwcc_verification_date: '2024-06-01',
    wwcc_verification_made_by: 'Admin User',
    wwcc_verification_outcome: 'Cleared',
    wwcc_exemption: null,
    smt_certificate_no: 'SMT789',
    smt_completion_date: '2024-03-15',
    smt_last_type: 'essentials' as const,
    smc_exemption: false,
    smc_reviewer: 'John Smith',
    smc_result_date: '2024-04-01',
    smc_result: 'over_18_application_approved' as const,
  } as Person

  it('renders all child safety fields when expanded', async () => {
    document.body.innerHTML = ''
    render(<ChildSafetySection person={mockPerson} />)

    // Expand the collapsible by clicking the trigger button
    const toggle = screen.getByRole('button', { name: /Child Safety/ })
    await userEvent.click(toggle)

    // Safe Ministry
    expect(screen.getByText(/Safe Ministry Leader Type/i)).toBeInTheDocument()
    expect(screen.getByText(/Safe Ministry Notes/i)).toBeInTheDocument()
    expect(screen.getByText(/Safe Ministry Start Date/i)).toBeInTheDocument()

    // WWCC
    expect(screen.getByText(/WWCC Number/i)).toBeInTheDocument()
    expect(screen.getByText(/WWCC Expiry Date/i)).toBeInTheDocument()
    expect(screen.getByText(/WWCC Verification Date/i)).toBeInTheDocument()
    expect(screen.getByText(/WWCC Verification Made By/i)).toBeInTheDocument()
    expect(screen.getByText(/WWCC Verification Outcome/i)).toBeInTheDocument()

    // SMT
    expect(screen.getByText(/SMT Certificate/i)).toBeInTheDocument()
    expect(screen.getByText(/SMT Completion Date/i)).toBeInTheDocument()
    expect(screen.getByText(/Last SMT Type/i)).toBeInTheDocument()

    // SMC
    expect(screen.getByText(/SMC Exemption/i)).toBeInTheDocument()
    expect(screen.getByText(/SMC Reviewer/i)).toBeInTheDocument()
    expect(screen.getByText(/SMC Result Date/i)).toBeInTheDocument()
    expect(screen.getByText(/SMC Result: /i)).toBeInTheDocument()
  })

  it('shows summary in collapsed state', () => {
    document.body.innerHTML = ''
    render(<ChildSafetySection person={mockPerson} />)
    // Collapsed state should show only the summary button
    const summary = screen.getByRole('button', { name: /Child Safety/ })
    expect(summary).toHaveTextContent(/WWCC/)
    expect(summary).toHaveTextContent(/SMT/)
    expect(summary).toHaveTextContent(/SMC/)
  })
})
