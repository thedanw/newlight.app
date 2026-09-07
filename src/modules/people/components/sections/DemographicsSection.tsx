import { useState, useMemo } from 'react'
import type { Person } from '../../lib/types'
import { Button, Field, Input } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { ProfileSection } from './ProfileSection'
import { updatePerson, writePeopleAudit } from '../../lib/queries'

interface DemographicsField {
  key: keyof Person
  label: string
  type?: 'text' | 'number'
}

const demographicsFields: DemographicsField[] = [
  { key: 'demographic', label: 'Demographic' },
  { key: 'school_name', label: 'School' },
  { key: 'kindy_start_year', label: 'Kindy start year', type: 'number' },
  { key: 'school_email_permission', label: 'School email permission' },
]

export function DemographicsSection({ person, canEdit = true }: { person: Person; canEdit?: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const schoolYear = useMemo(() => {
    if (!person.kindy_start_year) return null
    const year = new Date().getFullYear() - person.kindy_start_year
    if (year === 0) return 'Kindy'
    return `Year ${year}`
  }, [person.kindy_start_year])

  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {}
    demographicsFields.forEach((f) => {
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

    demographicsFields.forEach((f) => {
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
    <ProfileSection title="Demographics">
      {isEditing ? (
        <Stack gap="3">
          {demographicsFields.map((field) => (
            <Field.Root key={field.key}>
              <Field.Label>{field.label}</Field.Label>
              <Input
                type={field.type === 'number' ? 'number' : 'text'}
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
          <p><strong>Demographic:</strong> {initialValues['demographic'] || 'Not provided'}</p>
          <p><strong>School:</strong> {initialValues['school_name'] || 'Not provided'}</p>
          <p><strong>School year:</strong> {schoolYear ?? 'Not provided'}</p>
          <p><strong>School email permission:</strong> {initialValues['school_email_permission'] || 'Not provided'}</p>
          {canEdit && <Button size="sm" onClick={handleEdit}>Edit</Button>}
        </Stack>
      )}
    </ProfileSection>
  )
}
