import { useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import type { Person, PersonPublic } from '../../lib/types'
import { Button, Field, Input } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Grid } from 'styled-system/jsx'
import { ProfileSection } from './ProfileSection'
import { updatePerson, writePeopleAudit } from '../../lib/queries'

interface ContactField {
  key: keyof Person
  label: string
  type?: 'text' | 'email' | 'tel'
}

const contactFields: ContactField[] = [
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'mobile', label: 'Mobile', type: 'tel' },
]

export type ContactSectionHandle = {
  save: () => Promise<void>
}

export const ContactSection = forwardRef<ContactSectionHandle, { person: Person | PersonPublic; canEdit?: boolean; defaultEdit?: boolean }>(({ person, canEdit = true, defaultEdit = false }, ref) => {
  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {}
    contactFields.forEach((f) => {
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

    contactFields.forEach((f) => {
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
    <ProfileSection title="Contact">
      {isEditing ? (
        <Grid gap="3" columns={{ base: 1, sm: 2 }}>
          {contactFields.map((field) => (
            <Field.Root key={field.key}>
              <Field.Label>{field.label}</Field.Label>
              <Input
                type={field.type}
                value={values[String(field.key)] || ''}
                onChange={(e) => setValues({ ...values, [String(field.key)]: e.target.value })}
              />
            </Field.Root>
          ))}
        </Grid>
      ) : (
        <Stack gap="3">
          <p><strong>Email:</strong> {initialValues['email'] || 'Not provided'}</p>
          <p><strong>Mobile:</strong> {initialValues['mobile'] || 'Not provided'}</p>
          {canEdit && <Button size="sm" onClick={() => { setValues(initialValues); setIsEditing(true) }}>Edit</Button>}
        </Stack>
      )}
    </ProfileSection>
  )
})
