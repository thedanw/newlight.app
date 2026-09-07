import { useState } from 'react'
import type { Person } from '../../lib/types'
import { Link, Button, Dialog, Field, Input, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { ProfileSection } from './ProfileSection'
import { usePersonGuardians } from '../../lib/hooks'
import { createContactOnlyParent, createPersonRelationship } from '../../lib/queries'

export function GuardiansSection({ person, canManageGuardians = true }: { person: Person; canManageGuardians?: boolean }) {
  const guardiansState = usePersonGuardians(person.id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardians = guardiansState.data ?? []

  const handleAdd = async () => {
    setSaving(true)
    setError(null)
    try {
      const newParent = await createContactOnlyParent(firstname.trim(), lastname.trim())
      await createPersonRelationship({
        person_id: person.id,
        related_person_id: newParent.id,
        relationship_type: 'guardian',
      })
      setFirstname('')
      setLastname('')
      setDialogOpen(false)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProfileSection title="Guardians">
      <Dialog.Root open={dialogOpen} onOpenChange={(details) => setDialogOpen(details.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Title>Add guardian</Dialog.Title>
            <Dialog.Body>
              <Stack gap="3">
                <Text color="fg.muted">Create a new contact-only parent and link them as a guardian.</Text>
                {error && <Text color="fg.default">{error}</Text>}
                <Field.Root>
                  <Field.Label>First name</Field.Label>
                  <Input value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="First name" />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Last name</Field.Label>
                  <Input value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Last name" />
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger onClick={handleAdd} disabled={saving || !firstname.trim() || !lastname.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </Dialog.ActionTrigger>
              <Dialog.CloseTrigger>Cancel</Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      <Stack gap="3">
        <Stack gap="2">
          {guardians.map((guardian) => (
            <Link key={guardian.id} href={`/people/${guardian.id}`}>
              {guardian.preferred_name ? `${guardian.preferred_name} ${guardian.lastname}` : `${guardian.firstname} ${guardian.lastname}`}
            </Link>
          ))}
          {!guardians.length && <Text color="fg.muted">No guardians linked.</Text>}
        </Stack>
        {canManageGuardians && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>Add guardian</Button>
        )}
      </Stack>
    </ProfileSection>
  )
}
