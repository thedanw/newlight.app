import { render, screen, waitFor, cleanup, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, afterEach } from 'vitest'
import type { JourneyStage, JourneyTrack } from '../../lib/types'
import { useJourneyTracks, useJourneyStages, useHouseholds, useCurrentOperatorPermission } from '../../lib/hooks'
import { PersonForm } from './Form'
import { PageActionsProvider } from '@/core/ui'

vi.mock('../../lib/hooks')

const mockUseJourneyTracks = vi.mocked(useJourneyTracks)
const mockUseJourneyStages = vi.mocked(useJourneyStages)
const mockUseHouseholds = vi.mocked(useHouseholds)
const mockUseCurrentOperatorPermission = vi.mocked(useCurrentOperatorPermission)

const tracks: JourneyTrack[] = [
  { id: 'track-sundays', category_id: null, name: 'Sundays 10am', sort_order: 1, elvanto_location_id: null, follow_elvanto: false, deleted_at: null },
]

const stages: JourneyStage[] = [
  { id: 'stage-contact', slug: 'contact', label: 'Contact', color: null, sort_order: 1, is_terminal: false },
  { id: 'stage-guest', slug: 'guest', label: 'Guest', color: null, sort_order: 2, is_terminal: false },
]

afterEach(() => {
  cleanup()
})

function setHooksState(opts: { loading?: boolean; tracks?: JourneyTrack[]; stages?: JourneyStage[] } = {}) {
  mockUseJourneyTracks.mockReturnValue({ data: opts.tracks ?? tracks, loading: opts.loading ?? false, error: null })
  mockUseJourneyStages.mockReturnValue({ data: opts.stages ?? stages, loading: opts.loading ?? false, error: null })
  mockUseHouseholds.mockReturnValue({ data: [], loading: false, error: null })
  mockUseCurrentOperatorPermission.mockReturnValue({ data: 'admin', loading: false, error: null })
}

describe('PersonForm journey default', () => {
  it('submits journey with contact stage id when no stage is selected for a track', async () => {
    setHooksState()
    const onSubmit = vi.fn()
    render(
      <PageActionsProvider>
        <PersonForm initialValue={{ journey: {} }} submitLabel="Create" onSubmit={onSubmit} onCancel={() => {}} />
      </PageActionsProvider>,
    )

    const user = userEvent.setup()
    const trackLabel = screen.getAllByText('Sundays 10am')[0]
    await user.click(trackLabel)
    await user.type(screen.getByLabelText('First name'), 'Jane')
    await user.type(screen.getByLabelText('Last name'), 'Doe')

    const form = document.querySelector('form')!
    await act(async () => {
      fireEvent.submit(form)
    })

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submitted = onSubmit.mock.calls[0]![0] as { journey: Record<string, string> }
    expect(submitted.journey['track-sundays']).toBe('stage-contact')
  })

  it('submits journey with first non-terminal stage id when contact stage is missing', async () => {
    const stagesWithoutContact: JourneyStage[] = [
      { id: 'stage-guest', slug: 'guest', label: 'Guest', color: null, sort_order: 1, is_terminal: false },
    ]
    setHooksState({ stages: stagesWithoutContact })
    const onSubmit = vi.fn()
    render(
      <PageActionsProvider>
        <PersonForm initialValue={{ journey: {} }} submitLabel="Create" onSubmit={onSubmit} onCancel={() => {}} />
      </PageActionsProvider>,
    )

    const user = userEvent.setup()
    const trackLabel = screen.getAllByText('Sundays 10am')[0]
    await user.click(trackLabel)
    await user.type(screen.getByLabelText('First name'), 'Jane')
    await user.type(screen.getByLabelText('Last name'), 'Doe')

    const form = document.querySelector('form')!
    await act(async () => {
      fireEvent.submit(form)
    })

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const submitted = onSubmit.mock.calls[0]![0] as { journey: Record<string, string> }
    expect(submitted.journey['track-sundays']).toBe('stage-guest')
  })

  it('blocks submit with error when no stages exist and a track is selected', async () => {
    setHooksState({ stages: [] })
    const onSubmit = vi.fn()
    render(
      <PageActionsProvider>
        <PersonForm initialValue={{ journey: {} }} submitLabel="Create" onSubmit={onSubmit} onCancel={() => {}} />
      </PageActionsProvider>,
    )

    const user = userEvent.setup()
    const trackLabel = screen.getAllByText('Sundays 10am')[0]
    await user.click(trackLabel)
    await user.type(screen.getByLabelText('First name'), 'Jane')
    await user.type(screen.getByLabelText('Last name'), 'Doe')

    const form = document.querySelector('form')!
    await act(async () => {
      fireEvent.submit(form)
    })

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
  })
})
