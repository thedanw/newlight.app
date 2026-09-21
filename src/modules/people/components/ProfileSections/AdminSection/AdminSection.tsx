import { useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import type { Person, PersonPublic } from '../../../lib/types'
import { Button, Field, Input, Select } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Grid } from 'styled-system/jsx'
import { ProfileSection } from '../../sections/ProfileSection'
import { updatePerson, writePeopleAudit } from '../../../lib/queries'
import { createListCollection } from '@ark-ui/react'

interface AdminField {
  key: keyof Person
  label: string
  type?: 'text' | 'date'
}

const adminFields: AdminField[] = [
  { key: 'access_permission', label: 'Access permission' },
  { key: 'date_professed', label: 'Date professed', type: 'date' },
  { key: 'legacy_date_added', label: 'Legacy date added', type: 'date' },
  { key: 'legacy_member_id', label: 'Legacy member id' },
]

export type AdminSectionHandle = {
  save: () => Promise<void>
}

export const AdminSection = forwardRef<AdminSectionHandle, { person: Person | PersonPublic; canEditAdminFields?: boolean; defaultEdit?: boolean }>(({ person, canEditAdminFields = false, defaultEdit = false }, ref) => {
  const accessCollection = useMemo(() => createListCollection({
    items: [
      { label: 'Public', value: 'public' },
      { label: 'Member area', value: 'member_area' },
      { label: 'Team leaders', value: 'team_leaders' },
      { label: 'Admin', value: 'admin' },
      { label: 'Super admin', value: 'super_admin' },
    ]
  }), [])

  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {}
    adminFields.forEach((f) => {
      const value = (person as Record<string, unknown>)[f.key as string]
      initial[String(f.key)] = value === null || value === undefined ? '' : String(value)
    })
    return initial
  }, [person])

  const [isEditing, setIsEditing] = useState(defaultEdit)
  const [values, setValues] = useState<Record<string, string>>(() => defaultEdit ? initialValues : {})

  const handleSave = async () => {
    const updates: Record<string, unknown> = {}
    const auditWrites: Promise<unknown>[] = []

    adminFields.forEach((f) => {
      const key = String(f.key)
      const newValue = values[key]
      const oldValue = initialValues[key]
      if (newValue !== oldValue) {
        updates[key] = newValue || null
        auditWrites.push(writePeopleAudit(person.id, key, oldValue || null, newValue || null) as Promise<unknown>)
      }
    })

    if (Object.keys(updates).length > 0) {
      await updatePerson(person.id, updates)
      await Promise.all(auditWrites)
    }
    setIsEditing(false)
  }

  useImperativeHandle(ref, () => ({
    save: handleSave
  }))

  return (
    <ProfileSection title="Admin">
      {isEditing ? (
        <Grid columns={{ base: 1, sm: 2 }}>
          {adminFields.map((field) => (
            <Field.Root key={field.key}>
              <Field.Label>{field.label}</Field.Label>
              {field.key === 'access_permission' ? (
                <Select.Root
                  collection={accessCollection}
                  value={[values[String(field.key)] || '']}
                  onValueChange={(details) => setValues({ ...values, [String(field.key)]: details.value[0] })}
                >
                  <Select.Control>
                    <Select.Trigger><Select.ValueText placeholder="Select access level" /></Select.Trigger>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {accessCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          <Select.ItemText>{item.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              ) : (
                <Input
                  type={field.type === 'date' ? 'date' : 'text'}
                  value={values[String(field.key)] || ''}
                  onChange={(e) => setValues({ ...values, [String(field.key)]: e.target.value })}
                />
              )}
            </Field.Root>
          ))}
        </Grid>
      ) : (
        <Stack>
          {adminFields.map((field) => (
            <p key={field.key}>
              <strong>{field.label}:</strong> {initialValues[String(field.key)] || 'Not provided'}
            </p>
          ))}
          {canEditAdminFields && <Button size="sm" onClick={() => { setValues(initialValues); setIsEditing(true) }}>Edit</Button>}
        </Stack>
      )}
    </ProfileSection>
  )
})
