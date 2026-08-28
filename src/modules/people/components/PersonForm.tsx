import { useState, type FormEvent } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Button, Field, Input, Select, Text } from '@/core/ui'
import type { Person } from '../lib/types'
import type { PersonInput } from '../lib/queries'
import { createHousehold } from '../lib/queries'
import { useCurrentOperatorPermission, useHouseholds, useJourneyTracks } from '../lib/hooks'
import { personFormSchema } from '../lib/validation'

type PersonFormProps = {
  initialValue?: Partial<Person>
  submitLabel: string
  onSubmit: (value: PersonInput) => Promise<void>
  onCancel: () => void
  allowAdminFields?: boolean
}

const emptyValue: PersonInput = {
  firstname: '',
  lastname: '',
  preferred_name: null,
  middle_name: null,
  email: null,
  date_of_birth: null,
  gender: null,
  marital_status: null,
  demographic: 'adult',
  school_name: null,
  kindy_start_year: null,
  school_email_permission: null,
  household_id: null,
  journey: {},
}

export function PersonForm({ initialValue, submitLabel, onSubmit, onCancel, allowAdminFields = false }: PersonFormProps) {
  const [value, setValue] = useState<PersonInput>({ ...emptyValue, ...initialValue })
  const [journeyTracks, setJourneyTracks] = useState(Object.keys(initialValue?.journey ?? {}))
  const [manualJourneyTracks, setManualJourneyTracks] = useState('')
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const tracksQuery = useJourneyTracks()
  const householdsQuery = useHouseholds()
  const operatorPermission = useCurrentOperatorPermission()
  const canEditAdminFields = allowAdminFields && (operatorPermission.data === 'admin' || operatorPermission.data === 'super_admin')
  const householdCollection = createListCollection({ items: (householdsQuery.data ?? []).map((household) => ({ label: household.name ?? 'Unnamed household', value: household.id })) })

  const update = <K extends keyof PersonInput>(key: K, nextValue: PersonInput[K]) => {
    setValue((current) => ({ ...current, [key]: nextValue }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const tracks = tracksQuery.data?.length ? journeyTracks : manualJourneyTracks.split(',').map((track) => track.trim()).filter(Boolean)
    const nextValue = { ...value, journey: Object.fromEntries(tracks.map((track) => [track, value.journey[track] ?? 'contact'])) }
    const result = personFormSchema.safeParse(nextValue)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Check the form values.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit({ ...value, ...result.data, firstname: result.data.firstname, lastname: result.data.lastname, ...(canEditAdminFields ? { access_permission: value.access_permission, date_professed: value.date_professed, legacy_date_added: value.legacy_date_added, legacy_member_id: value.legacy_member_id } : {}) })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save person.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field.Root required>
        <Field.Label>First name</Field.Label>
        <Input value={value.firstname} onChange={(event) => update('firstname', event.target.value)} />
      </Field.Root>
      {canEditAdminFields && <>
        <Field.Root><Field.Label>Access permission</Field.Label><select value={value.access_permission ?? 'member_area'} onChange={(event) => update('access_permission', event.target.value as Person['access_permission'])}><option value="public">Public</option><option value="member_area">Member area</option><option value="team_leaders">Team leaders</option><option value="admin">Admin</option><option value="super_admin">Super admin</option></select></Field.Root>
        <Field.Root><Field.Label>Date professed</Field.Label><Input type="date" value={value.date_professed ?? ''} onChange={(event) => update('date_professed', event.target.value || null)} /></Field.Root>
        <Field.Root><Field.Label>Legacy member ID</Field.Label><Input value={value.legacy_member_id ?? ''} onChange={(event) => update('legacy_member_id', event.target.value || null)} /></Field.Root>
      </>}
      <Field.Root>
        <Select.Root collection={householdCollection} value={value.household_id ? [value.household_id] : []} onValueChange={(details) => update('household_id', details.value[0] ?? null)}>
          <Select.Label>Household</Select.Label>
          <Select.Control>
            <Select.Trigger><Select.ValueText placeholder="Select a household" /><Select.Indicator /></Select.Trigger>
          </Select.Control>
          <Select.Positioner><Select.Content>{householdCollection.items.map((item) => <Select.Item key={item.value} item={item}><Select.ItemText>{item.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}</Select.Content></Select.Positioner>
        </Select.Root>
        <Input value={newHouseholdName} onChange={(event) => setNewHouseholdName(event.target.value)} placeholder="New household name" />
        <Button type="button" variant="outline" onClick={async () => { if (!newHouseholdName.trim()) return; const household = await createHousehold(newHouseholdName); update('household_id', household.id); setNewHouseholdName('') }}>Create household</Button>
      </Field.Root>
      <Field.Root required>
        <Field.Label>Last name</Field.Label>
        <Input value={value.lastname} onChange={(event) => update('lastname', event.target.value)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Preferred name</Field.Label>
        <Input value={value.preferred_name ?? ''} onChange={(event) => update('preferred_name', event.target.value || null)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Input type="email" value={value.email ?? ''} onChange={(event) => update('email', event.target.value || null)} />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Demographic</Field.Label>
        <select value={value.demographic} onChange={(event) => update('demographic', event.target.value as Person['demographic'])}>
          <option value="adult">Adult</option>
          <option value="youth">Youth</option>
          <option value="child">Child</option>
        </select>
      </Field.Root>
      <Field.Root>
        <Field.Label>Date of birth</Field.Label>
        <Input type="date" value={value.date_of_birth ?? ''} onChange={(event) => update('date_of_birth', event.target.value || null)} />
      </Field.Root>
      <Field.Root>
        <Field.Label>School</Field.Label>
        <Input value={value.school_name ?? ''} onChange={(event) => update('school_name', event.target.value || null)} />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Journey track IDs</Field.Label>
        {tracksQuery.data?.length ? tracksQuery.data.map((track) => (
          <label key={track.id}>
            <input type="checkbox" checked={journeyTracks.includes(track.id)} onChange={(event) => setJourneyTracks((current) => event.target.checked ? [...current, track.id] : current.filter((id) => id !== track.id))} />
            {track.name}
          </label>
        )) : (
          <>
            <Input value={manualJourneyTracks} onChange={(event) => setManualJourneyTracks(event.target.value)} placeholder="track-id, another-track-id" />
            <Field.HelperText>Separate multiple track IDs with commas.</Field.HelperText>
          </>
        )}
      </Field.Root>
      {error && <Text>{error}</Text>}
      <Button type="submit" loading={saving} loadingText="Saving">{submitLabel}</Button>
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
    </form>
  )
}