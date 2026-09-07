import { useState, useMemo } from 'react'
import type { Person } from '../../lib/types'
import { Button, Field, Input } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
import { Collapsible } from '@/core/ui'
import { updatePerson, writePeopleAudit } from '../../lib/queries'

interface ChildSafetyField {
  key: keyof Person
  label: string
  type?: 'text' | 'date' | 'select'
}

const childSafetyFields: ChildSafetyField[] = [
  { key: 'safe_ministry_leader_type', label: 'Safe Ministry Leader Type' },
  { key: 'safe_ministry_notes', label: 'Safe Ministry Notes' },
  { key: 'safe_ministry_start_date', label: 'Safe Ministry Start Date', type: 'date' },
  { key: 'wwcc_number', label: 'WWCC Number' },
  { key: 'wwcc_expiry_date', label: 'WWCC Expiry Date', type: 'date' },
  { key: 'wwcc_verification_date', label: 'WWCC Verification Date', type: 'date' },
  { key: 'wwcc_verification_made_by', label: 'WWCC Verification Made By' },
  { key: 'wwcc_verification_outcome', label: 'WWCC Verification Outcome' },
  { key: 'wwcc_exemption', label: 'WWCC Exemption' },
  { key: 'smt_certificate_no', label: 'SMT Certificate' },
  { key: 'smt_completion_date', label: 'SMT Completion Date', type: 'date' },
  { key: 'smt_last_type', label: 'Last SMT Type' },
  { key: 'smc_exemption', label: 'SMC Exemption' },
  { key: 'smc_reviewer', label: 'SMC Reviewer' },
  { key: 'smc_result_date', label: 'SMC Result Date', type: 'date' },
  { key: 'smc_result', label: 'SMC Result' },
]

export function ChildSafetySection({ person, canEditChildSafety = true }: { person: Person; canEditChildSafety?: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})

  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {}
    childSafetyFields.forEach((f) => {
      const value = person[f.key]
      if (value === null || value === undefined) {
        initial[String(f.key)] = 'Not provided'
      } else if (typeof value === 'boolean') {
        initial[String(f.key)] = value ? 'Yes' : 'No'
      } else {
        initial[String(f.key)] = String(value)
      }
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

    childSafetyFields.forEach((f) => {
      const key = String(f.key)
      const newValue = values[key]
      const oldValue = initialValues[key]
      if (newValue !== oldValue) {
        updates[key] = newValue
        auditWrites.push(writePeopleAudit(person.id, key, oldValue, newValue) as Promise<unknown>)
      }
    })

    if (Object.keys(updates).length > 0) {
      await updatePerson(person.id, updates)
      await Promise.all(auditWrites)
    }
    setIsEditing(false)
  }

  return (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger>
        <HStack gap="2">
          <span style={{ fontWeight: 600 }}>Child Safety · WWCC · SMT · SMC</span>
          <Collapsible.Indicator>⌄</Collapsible.Indicator>
        </HStack>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Stack gap="3">
          {childSafetyFields.map((field) => (
            <p key={field.key}>
              {field.label}: {initialValues[String(field.key)]}
            </p>
          ))}
          <HStack gap="2">
            {isEditing ? (
              <>
                {childSafetyFields.map((field) => (
                  <Field.Root key={field.key}>
                    <Field.Label>{field.label}</Field.Label>
                    <Input
                      type={field.type === 'date' ? 'date' : 'text'}
                      value={values[String(field.key)] || ''}
                      onChange={(e) => setValues({ ...values, [String(field.key)]: e.target.value })}
                    />
                  </Field.Root>
                ))}
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
              </>
            ) : (
              <>
                {canEditChildSafety && <Button onClick={handleEdit}>Edit</Button>}
              </>
            )}
          </HStack>
        </Stack>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
