import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, Field, Heading, Input, Page, Text, Textarea } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { FileText } from 'lucide-react'
import { getFormById, submitForm } from '../lib/form-queries'
import { PageSkeleton } from '../components/PageSkeleton'
import type { FormWithFields } from '../lib/types'

export default function FormPublicPage() {
  const { formId } = useParams()
  const [form, setForm] = useState<FormWithFields | null>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!formId) return
    getFormById(formId)
      .then((loaded) => { setForm(loaded); setLoading(false) })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load form.')
        setLoading(false)
      })
  }, [formId])

  if (loading) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={FileText} title="Form" />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )
  if (error) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={FileText} title="Form" />
      </Page.Header>
      <Page.Body><Text>{error}</Text></Page.Body>
    </Page.Main>
  )
  if (!form) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={FileText} title="Form" />
      </Page.Header>
      <Page.Body><Text>Form not found.</Text></Page.Body>
    </Page.Main>
  )
  if (!form.is_public) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={FileText} title="Form" />
      </Page.Header>
      <Page.Body><Text>This form is not accepting submissions.</Text></Page.Body>
    </Page.Main>
  )

  const setAnswer = (fieldId: string, value: unknown) => setAnswers((current) => ({ ...current, [fieldId]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await submitForm(form.id, answers)
      setSubmitted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit form.')
    }
  }

  if (submitted) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={FileText} title="Form" />
        </Page.Header>
        <Page.Body>
          <Heading>{(form.settings as { thank_you_message?: string } | null)?.thank_you_message ?? 'Thanks for submitting!'}</Heading>
        </Page.Body>
      </Page.Main>
    )
  }

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={FileText} title={form.name} />
      </Page.Header>
      <Page.Body>
        <Stack gap="6">
          <Heading>{form.name}</Heading>
          {form.description && <Text color="fg.muted">{form.description}</Text>}
          <Card.Root>
            <Card.Body>
              <form onSubmit={handleSubmit}>
                <Stack gap="4">
                  {form.fields.map((field) => {
                    const value = answers[field.id]
                    return (
                      <Field.Root key={field.id}>
                        <Field.Label>{field.label}{field.required ? ' *' : ''}</Field.Label>
                        {field.field_type === 'textarea' && (
                          <Textarea value={String(value ?? '')} onChange={(event) => setAnswer(field.id, event.target.value)} placeholder={field.placeholder ?? undefined} />
                        )}
                        {field.field_type === 'select' && (
                          <select value={String(value ?? '')} onChange={(event) => setAnswer(field.id, event.target.value)}>
                            <option value="">Select...</option>
                            {(field.options as { label: string; value: string }[] | null)?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        )}
                        {field.field_type === 'multi_select' && (
                          <div>
                            {(field.options as { label: string; value: string }[] | null)?.map((option) => {
                              const selected = Array.isArray(value) ? value.includes(option.value) : false
                              return (
                                <label key={option.value}>
                                  <input type="checkbox" checked={selected} onChange={(event) => {
                                    const current = Array.isArray(value) ? value as string[] : []
                                    setAnswer(field.id, event.target.checked ? [...current, option.value] : current.filter((item) => item !== option.value))
                                  }} />
                                  {option.label}
                                </label>
                              )
                            })}
                          </div>
                        )}
                        {field.field_type === 'checkbox' && (
                          <label>
                            <input type="checkbox" checked={value === true} onChange={(event) => setAnswer(field.id, event.target.checked)} />
                            {field.label}
                          </label>
                        )}
                        {field.field_type === 'email' && <Input type="email" value={String(value ?? '')} onChange={(event) => setAnswer(field.id, event.target.value)} placeholder={field.placeholder ?? undefined} />}
                        {field.field_type === 'phone' && <Input type="tel" value={String(value ?? '')} onChange={(event) => setAnswer(field.id, event.target.value)} placeholder={field.placeholder ?? undefined} />}
                        {field.field_type === 'number' && <Input type="number" value={String(value ?? '')} onChange={(event) => setAnswer(field.id, event.target.value)} placeholder={field.placeholder ?? undefined} />}
                        {field.field_type === 'date' && <Input type="date" value={String(value ?? '')} onChange={(event) => setAnswer(field.id, event.target.value)} />}
                        {field.field_type === 'text' && <Input value={String(value ?? '')} onChange={(event) => setAnswer(field.id, event.target.value)} placeholder={field.placeholder ?? undefined} />}
                      </Field.Root>
                    )
                  })}
                  {error && <Text>{error}</Text>}
                  <Button type="submit">Submit</Button>
                </Stack>
              </form>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
