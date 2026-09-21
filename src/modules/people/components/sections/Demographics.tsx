import { useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import type { Person, PersonPublic } from '../../lib/types'
import { Button, Field, Input } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Grid } from 'styled-system/jsx'
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

export type DemographicsSectionHandle = {
  save: () => Promise<void>
}

export const DemographicsSection = forwardRef<DemographicsSectionHandle, { person: Person | PersonPublic; canEdit?: boolean; defaultEdit?: boolean }>(({ person, canEdit = true, defaultEdit = false }, ref) => {
  const schoolYear = useMemo(() => {
    const kindyStartYear = (person as Record<string, unknown>).kindy_start_year as number | null | undefined
    if (!kindyStartYear) return null
    const year = new Date().getFullYear() - kindyStartYear
    if (year === 0) return 'Kindy'
    return `Year ${year}`
  }, [person])

  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {}
    demographicsFields.forEach((f) => {
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

  useImperativeHandle(ref, () => ({
    save: handleSave
  }))

  return (
    <ProfileSection title="Demographics">
      {isEditing ? (
        <Grid columns={{ base: 1, sm: 2 }}>
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
        </Grid>
      ) : (
        <Stack>
          <p><strong>Demographic:</strong> {initialValues['demographic'] || 'Not provided'}</p>
          <p><strong>School:</strong> {initialValues['school_name'] || 'Not provided'}</p>
          <p><strong>School year:</strong> {schoolYear ?? 'Not provided'}</p>
          <p><strong>School email permission:</strong> {initialValues['school_email_permission'] || 'Not provided'}</p>
          {canEdit && <Button size="sm" onClick={() => { setValues(initialValues); setIsEditing(true) }}>Edit</Button>}
        </Stack>
      )}
    </ProfileSection>
  )
})
