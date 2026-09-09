import { useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import type { Person, PersonPublic } from '../../../lib/types'
import { Button, Card, Field, Input } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'
import { Grid } from 'styled-system/jsx'
import { Collapsible } from '@/core/ui'
import { updatePerson, writePeopleAudit } from '../../../lib/queries'

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

export type ChildSafetySectionHandle = {
  save: () => Promise<void>
}

export const ChildSafetySection = forwardRef<ChildSafetySectionHandle, { person: Person | PersonPublic; canEditChildSafety?: boolean; defaultEdit?: boolean }>(({ person, canEditChildSafety = true, defaultEdit = false }, ref) => {
  const initialValues = useMemo(() => {
    const initial: Record<string, string> = {}
    childSafetyFields.forEach((f) => {
      const value = (person as Record<string, unknown>)[f.key as string]
      if (value === null || value === undefined) {
        initial[String(f.key)] = ''
      } else if (typeof value === 'boolean') {
        initial[String(f.key)] = value ? 'Yes' : 'No'
      } else {
        initial[String(f.key)] = String(value)
      }
    })
    return initial
  }, [person])

  const [isEditing, setIsEditing] = useState(defaultEdit)
  const [values, setValues] = useState<Record<string, string>>(() => defaultEdit ? initialValues : {})

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

  useImperativeHandle(ref, () => ({
    save: handleSave
  }))

  return (
    <Card.Root>
      <Card.Body>
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger>
        <HStack gap="2">
          <span style={{ fontWeight: 600 }}>Child Safety · WWCC · SMT · SMC</span>
          <Collapsible.Indicator>⌄</Collapsible.Indicator>
        </HStack>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Stack gap="3">
          {isEditing ? (
              <Grid gap="3" columns={{ base: 1, sm: 2 }}>
                <Field.Root>
                  <Field.Label>Safe Ministry Leader Type</Field.Label>
                  <Input
                    type="text"
                    value={values['safe_ministry_leader_type'] || ''}
                    onChange={(e) => setValues({ ...values, safe_ministry_leader_type: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Safe Ministry Start Date</Field.Label>
                  <Input
                    type="date"
                    value={values['safe_ministry_start_date'] || ''}
                    onChange={(e) => setValues({ ...values, safe_ministry_start_date: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>WWCC Number</Field.Label>
                  <Input
                    type="text"
                    value={values['wwcc_number'] || ''}
                    onChange={(e) => setValues({ ...values, wwcc_number: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>WWCC Expiry Date</Field.Label>
                  <Input
                    type="date"
                    value={values['wwcc_expiry_date'] || ''}
                    onChange={(e) => setValues({ ...values, wwcc_expiry_date: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>WWCC Verification Date</Field.Label>
                  <Input
                    type="date"
                    value={values['wwcc_verification_date'] || ''}
                    onChange={(e) => setValues({ ...values, wwcc_verification_date: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>WWCC Verification Made By</Field.Label>
                  <Input
                    type="text"
                    value={values['wwcc_verification_made_by'] || ''}
                    onChange={(e) => setValues({ ...values, wwcc_verification_made_by: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>WWCC Verification Outcome</Field.Label>
                  <Input
                    type="text"
                    value={values['wwcc_verification_outcome'] || ''}
                    onChange={(e) => setValues({ ...values, wwcc_verification_outcome: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>WWCC Exemption</Field.Label>
                  <Input
                    type="text"
                    value={values['wwcc_exemption'] || ''}
                    onChange={(e) => setValues({ ...values, wwcc_exemption: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>SMT Certificate</Field.Label>
                  <Input
                    type="text"
                    value={values['smt_certificate_no'] || ''}
                    onChange={(e) => setValues({ ...values, smt_certificate_no: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>SMT Completion Date</Field.Label>
                  <Input
                    type="date"
                    value={values['smt_completion_date'] || ''}
                    onChange={(e) => setValues({ ...values, smt_completion_date: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Last SMT Type</Field.Label>
                  <Input
                    type="text"
                    value={values['smt_last_type'] || ''}
                    onChange={(e) => setValues({ ...values, smt_last_type: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>SMC Exemption</Field.Label>
                  <Input
                    type="text"
                    value={values['smc_exemption'] || ''}
                    onChange={(e) => setValues({ ...values, smc_exemption: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>SMC Reviewer</Field.Label>
                  <Input
                    type="text"
                    value={values['smc_reviewer'] || ''}
                    onChange={(e) => setValues({ ...values, smc_reviewer: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>SMC Result Date</Field.Label>
                  <Input
                    type="date"
                    value={values['smc_result_date'] || ''}
                    onChange={(e) => setValues({ ...values, smc_result_date: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>SMC Result</Field.Label>
                  <Input
                    type="text"
                    value={values['smc_result'] || ''}
                    onChange={(e) => setValues({ ...values, smc_result: e.target.value })}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>Safe Ministry Notes</Field.Label>
                  <Input
                    type="text"
                    value={values['safe_ministry_notes'] || ''}
                    onChange={(e) => setValues({ ...values, safe_ministry_notes: e.target.value })}
                  />
                </Field.Root>
              </Grid>
            ) : (
              <>
                {canEditChildSafety && <Button onClick={() => { setValues(initialValues); setIsEditing(true) }}>Edit</Button>}
              </>
            )}
        </Stack>
      </Collapsible.Content>
    </Collapsible.Root>
    </Card.Body></Card.Root>
  )
})
