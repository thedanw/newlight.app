import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Heading, Page, Table, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { getFormById, getFormSubmissions } from '../lib/form-queries'
import { PageSkeleton } from '../components/PageSkeleton'
import type { Form, FormSubmissionWithPerson } from '../lib/types'

export default function FormSubmissionsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form | null>(null)
  const [submissions, setSubmissions] = useState<FormSubmissionWithPerson[] | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) return
    getFormById(id).then((loaded) => setForm(loaded ?? null)).catch((reason: unknown) => setError(reason instanceof Error ? reason : new Error(String(reason))))
    getFormSubmissions(id).then(setSubmissions).catch((reason: unknown) => setError(reason instanceof Error ? reason : new Error(String(reason))))
  }, [id])

  if (error) return <Text>{error.message}</Text>
  if (!form || !submissions) return <Page.Body><PageSkeleton /></Page.Body>

  return (
    <>
      <Page.Header>
        <Heading>Submissions — {form.name}</Heading>
      </Page.Header>
      <Page.Body>
        <Stack gap="6">
          <Stack flexDirection="row" gap="2">
            <Button variant="outline" onClick={() => navigate('/people/forms')}>Back</Button>
          </Stack>
          {submissions.length === 0 && <Text color="fg.muted">No submissions yet.</Text>}
          <Card.Root>
            <Card.Body>
              <Table.Root>
                <Table.Head>
                  <Table.Row>
                    <Table.Header>Date</Table.Header>
                    <Table.Header>Person</Table.Header>
                    <Table.Header>Answers</Table.Header>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {submissions.map((submission) => (
                    <Table.Row key={submission.id}>
                      <Table.Cell><Text>{new Date(submission.created_at).toLocaleString()}</Text></Table.Cell>
                      <Table.Cell>
                        {submission.person
                          ? <Button variant="plain" onClick={() => navigate(`/people/${submission.person!.id}`)}>{submission.person.firstname} {submission.person.lastname}</Button>
                          : <Text color="fg.muted">Unlinked</Text>}
                      </Table.Cell>
                      <Table.Cell>
                        <Text>{Object.values(submission.answers as Record<string, unknown>).filter((value) => value !== '' && value !== null && value !== undefined).map(String).join(', ') || '—'}</Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Page.Body>
    </>
  )
}