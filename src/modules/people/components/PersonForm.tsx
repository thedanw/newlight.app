import { useState, type FormEvent } from 'react'
import { createListCollection } from '@ark-ui/react'
import { Button, Card, Checkbox, Field, Input, Select, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
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
  const demographicCollection = createListCollection({
    items: [
      { label: 'Adult', value: 'adult' },
      { label: 'Youth', value: 'youth' },
      { label: 'Child', value: 'child' },
    ]
  })

  const accessPermissionCollection = createListCollection({
    items: [
      { label: 'Public', value: 'public' },
      { label: 'Member area', value: 'member_area' },
      { label: 'Team leaders', value: 'team_leaders' },
      { label: 'Admin', value: 'admin' },
      { label: 'Super admin', value: 'super_admin' },
    ]
  })

  const householdCollection = createListCollection({ items: (householdsQuery.data ?? []).map((household) => ({ label: household.name ?? 'Unnamed household', value: household.id })) })

  const demographicValue = value.demographic ? [value.demographic] : []
  const accessPermissionValue = value.access_permission ? [value.access_permission] : []

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
      <Stack gap="6">
        {/* Personal Information */}
        <Card.Root>
          <Card.Header>
            <Card.Title>Personal Information</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap="4">
              <Field.Root required>
                <Field.Label>First name</Field.Label>
                <Input value={value.firstname} onChange={(event) => update('firstname', event.target.value)} />
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
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Demographics */}
        <Card.Root>
          <Card.Header>
            <Card.Title>Demographics</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap="4">
              <Field.Root required>
                <Field.Label>Demographic</Field.Label>
                <Select.Root collection={demographicCollection} value={demographicValue} onValueChange={(details) => update('demographic', details.value[0] as Person['demographic'])}>
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select demographic" />
                      <Select.Indicator />
                    </Select.Trigger>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {demographicCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Date of birth</Field.Label>
                <Input type="date" value={value.date_of_birth ?? ''} onChange={(event) => update('date_of_birth', event.target.value || null)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>School</Field.Label>
                <Input value={value.school_name ?? ''} onChange={(event) => update('school_name', event.target.value || null)} />
              </Field.Root>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Household */}
        <Card.Root>
          <Card.Header>
            <Card.Title>Household</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap="4">
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
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Journey */}
        <Card.Root>
          <Card.Header>
            <Card.Title>Journey</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap="4">
              <Field.Root required>
                <Field.Label>Journey track IDs</Field.Label>
                {tracksQuery.data?.length ? tracksQuery.data.map((track) => (
                  <Checkbox.Root key={track.id} checked={journeyTracks.includes(track.id)} onCheckedChange={(details) => setJourneyTracks((current) => details.checked ? [...current, track.id] : current.filter((id) => id !== track.id))}>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{track.name}</Checkbox.Label>
                  </Checkbox.Root>
                )) : (
                  <>
                    <Input value={manualJourneyTracks} onChange={(event) => setManualJourneyTracks(event.target.value)} placeholder="track-id, another-track-id" />
                    <Field.HelperText>Separate multiple track IDs with commas.</Field.HelperText>
                  </>
                )}
              </Field.Root>
            </Stack>
          </Card.Body>
        </Card.Root>

        {/* Admin fields */}
        {canEditAdminFields && (
          <Card.Root>
            <Card.Header>
              <Card.Title>Admin</Card.Title>
            </Card.Header>
            <Card.Body>
              <Stack gap="4">
                <Field.Root>
                  <Field.Label>Access permission</Field.Label>
                  <Select.Root collection={accessPermissionCollection} value={accessPermissionValue} onValueChange={(details) => update('access_permission', details.value[0] as Person['access_permission'])}>
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select access level" />
                        <Select.Indicator />
                      </Select.Trigger>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {accessPermissionCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>Date professed</Field.Label>
                  <Input type="date" value={value.date_professed ?? ''} onChange={(event) => update('date_professed', event.target.value || null)} />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Legacy member ID</Field.Label>
                  <Input value={value.legacy_member_id ?? ''} onChange={(event) => update('legacy_member_id', event.target.value || null)} />
                </Field.Root>
              </Stack>
            </Card.Body>
          </Card.Root>
        )}

        {error && <Text color="error">{error}</Text>}

        <Stack flexDirection="row" gap="3">
          <Button type="submit" loading={saving} loadingText="Saving">{submitLabel}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </Stack>
      </Stack>
    </form>
  )
}