import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import type { Person, JourneyTrack, JourneyStage, JourneyTrackCategory } from '../../lib/types'
import { JourneySection } from './Journey'
import type { JourneySectionHandle } from './Journey'
import { useJourneyTracks, useJourneyStages, useJourneyCategories } from '../../lib/hooks'
import { updatePersonJourney, writePeopleAudit } from '../../lib/queries'

vi.mock('../../lib/hooks')
vi.mock('../../lib/queries')

const mockUseJourneyTracks = vi.mocked(useJourneyTracks)
const mockUseJourneyStages = vi.mocked(useJourneyStages)
const mockUseJourneyCategories = vi.mocked(useJourneyCategories)
const mockUpdatePersonJourney = vi.mocked(updatePersonJourney)
const mockWritePeopleAudit = vi.mocked(writePeopleAudit)

const tracks: JourneyTrack[] = [
  { id: 'track-1', category_id: 'cat-1', name: 'Sundays 10am', sort_order: 1, elvanto_location_id: null, follow_elvanto: false, deleted_at: null },
  { id: 'track-2', category_id: 'cat-1', name: 'Youth (Fri)', sort_order: 2, elvanto_location_id: null, follow_elvanto: false, deleted_at: null },
  { id: 'track-3', category_id: null, name: 'Playtime (Tues)', sort_order: 3, elvanto_location_id: null, follow_elvanto: false, deleted_at: null },
]

const stages: JourneyStage[] = [
  { id: 'a1b2c3d4-0000-4000-8000-000000000001', slug: 'contact', label: 'Contact', color: '#e6e3d7', sort_order: 1, is_terminal: false },
  { id: 'a1b2c3d4-0000-4000-8000-000000000002', slug: 'guest', label: 'Guest', color: '#7ec8b5', sort_order: 2, is_terminal: false },
  { id: 'a1b2c3d4-0000-4000-8000-000000000003', slug: 'linked', label: 'Linked', color: '#5ab2aa', sort_order: 3, is_terminal: false },
  { id: 'a1b2c3d4-0000-4000-8000-000000000004', slug: 'regular', label: 'Regular', color: '#1c7782', sort_order: 4, is_terminal: false },
  { id: 'a1b2c3d4-0000-4000-8000-000000000005', slug: 'archived', label: 'Archived', color: '#6B7280', sort_order: 5, is_terminal: true },
]

const categories: JourneyTrackCategory[] = [
  { id: 'cat-1', parent_id: null, name: 'Church Location', sort_order: 1 },
]

const mockPerson = {
  id: 'person-1',
  firstname: 'Jane',
  lastname: 'Doe',
  demographic: 'adult' as const,
  access_permission: 'admin' as const,
   journey: { 'track-1': 'a1b2c3d4-0000-4000-8000-000000000004', 'track-2': 'a1b2c3d4-0000-4000-8000-000000000002' },
  _synced_at: new Date().toISOString(),
  _source_modified: new Date().toISOString(),
} as unknown as Person

function setHooksState(opts: { loading?: boolean; tr?: JourneyTrack[]; st?: JourneyStage[]; cats?: JourneyTrackCategory[] } = {}) {
  mockUseJourneyTracks.mockReturnValue({ data: opts.tr ?? tracks, loading: opts.loading ?? false, error: null })
  mockUseJourneyStages.mockReturnValue({ data: opts.st ?? stages, loading: opts.loading ?? false, error: null })
  mockUseJourneyCategories.mockReturnValue({ data: opts.cats ?? categories, loading: opts.loading ?? false, error: null })
}

describe('JourneySection', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdatePersonJourney.mockResolvedValue({} as Person)
    mockWritePeopleAudit.mockResolvedValue(undefined)
    setHooksState()
  })

  it('shows a loading state while tracks are being fetched', () => {
    setHooksState({ loading: true })
    render(<JourneySection person={mockPerson} />)
    expect(screen.getByText(/Loading journey tracks/i)).toBeInTheDocument()
  })

  it('renders tracks as rows with stages as columns', () => {
    render(<JourneySection person={mockPerson} />)
    expect(screen.getByText('Track')).toBeInTheDocument()
    expect(screen.getByText('Sundays 10am')).toBeInTheDocument()
    expect(screen.getByText('Youth (Fri)')).toBeInTheDocument()
    expect(screen.getByText('Playtime (Tues)')).toBeInTheDocument()
    const grid = screen.getByRole('table')
    expect(grid).toHaveTextContent('Contact')
    expect(grid).toHaveTextContent('Regular')
    expect(grid).toHaveTextContent('Archived')
  })

  it('groups tracks under their category heading', () => {
    render(<JourneySection person={mockPerson} />)
    expect(screen.getByText('Church Location')).toBeInTheDocument()
  })

  it('shows the current stage as a badge in read-only mode', () => {
    render(<JourneySection person={mockPerson} />)
    expect(screen.getAllByText('Regular').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Guest').length).toBeGreaterThan(0)
  })

  it('renders radio selection fields when editable', () => {
    render(<JourneySection person={mockPerson} canEdit defaultEdit />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(tracks.length * stages.length)
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(2)
  })

  it('selecting a stage updates the journey state on save', async () => {
    const user = userEvent.setup()
    const ref: { current: JourneySectionHandle | null } = { current: null }
    render(<JourneySection ref={ref} person={mockPerson} canEdit defaultEdit />)

    const allRadios = screen.getAllByRole('radio')
    const guestOnTrack1 = allRadios.find(
      (r) => r.getAttribute('name') === 'journey-track-1' && r.getAttribute('value') === 'a1b2c3d4-0000-4000-8000-000000000002',
    )
    expect(guestOnTrack1).toBeDefined()
    if (guestOnTrack1) await user.click(guestOnTrack1)

    await ref.current!.save()

    expect(mockUpdatePersonJourney).toHaveBeenCalledTimes(1)
    expect(mockUpdatePersonJourney).toHaveBeenCalledWith('person-1', { 'track-1': 'a1b2c3d4-0000-4000-8000-000000000002', 'track-2': 'a1b2c3d4-0000-4000-8000-000000000002' })
    expect(mockWritePeopleAudit).toHaveBeenCalledTimes(1)
    const [personId, field, oldVal, newVal] = mockWritePeopleAudit.mock.calls[0]
    expect(personId).toBe('person-1')
    expect(field).toBe('journey_track')
    expect(oldVal).toEqual({ 'track-1': 'a1b2c3d4-0000-4000-8000-000000000004', 'track-2': 'a1b2c3d4-0000-4000-8000-000000000002' })
    expect(newVal).toEqual({ 'track-1': 'a1b2c3d4-0000-4000-8000-000000000002', 'track-2': 'a1b2c3d4-0000-4000-8000-000000000002' })
  })

  it('does not call updatePersonJourney when nothing changed', async () => {
    const ref: { current: JourneySectionHandle | null } = { current: null }
    render(<JourneySection ref={ref} person={mockPerson} canEdit defaultEdit />)

    await ref.current!.save()

    expect(mockUpdatePersonJourney).not.toHaveBeenCalled()
    expect(mockWritePeopleAudit).not.toHaveBeenCalled()
  })

  it('does not render edit controls in read-only mode', () => {
    render(<JourneySection person={mockPerson} />)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit journey/i })).not.toBeInTheDocument()
  })

  it('shows an Edit button when canEdit but not in edit mode', () => {
    render(<JourneySection person={mockPerson} canEdit />)
    expect(screen.getByRole('button', { name: /edit journey/i })).toBeInTheDocument()
  })
})
