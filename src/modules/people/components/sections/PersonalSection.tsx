import { useState, useMemo } from 'react'
import type { Person } from '../../lib/types'
import { Button, Field, Input } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { ProfileSection } from './ProfileSection'
import { updatePerson, writePeopleAudit } from '../../lib/queries'

interface PersonalField {
  key: keyof Person
  label: string
}

const personalFields: PersonalField[] = [
  { key: 'firstname', label: 'First name' },
  { key: 'middle_name', label: 'Middle name' },
  { key: 'lastname', label: 'Last name' },
  { key: 'preferred_name', label: 'Preferred name' },
  { key: 'gender', label: 'Gender' },
  { key: 'date_of_birth', label: 'Date of birth' },
  { key: 'marital_status', label: 'Marital status' },
]

export function PersonalSection({ person, canEdit = true }: { person: Person; canEdit?: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {}
    personalFields.forEach((f) => {
      const value = person[f.key]
      initial[String(f.key)] = value === null || value === undefined ? '' : String(value)
    })
    return initial
  }, [person])

  const handleEdit = () => {
    setValues(initialValues)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const updates: Record<string, unknown> = {}
    const auditWrites: Promise<unknown>[] = []

    personalFields.forEach((f) => {
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

  return (
    <ProfileSection title="Personal">
      {isEditing ? (
        <Stack gap="3">
          {personalFields.map((field) => (
            <Field.Root key={field.key}>
              <Field.Label>{field.label}</Field.Label>
              <Input
                type={field.key === 'date_of_birth' ? 'date' : 'text'}
                value={values[String(field.key)] || ''}
                onChange={(e) => setValues({ ...values, [String(field.key)]: e.target.value })}
              />
            </Field.Root>
          ))}
          <Stack gap="2">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          </Stack>
        </Stack>
      ) : (
        <Stack gap="3">
          {personalFields.map((field) => (
            <p key={field.key}>
              <strong>{field.label}:</strong> {initialValues[String(field.key)] || 'Not provided'}
            </p>
          ))}
          {canEdit && <Button size="sm" onClick={handleEdit}>Edit</Button>}
        </Stack>
      )}
    </ProfileSection>
  )
}
