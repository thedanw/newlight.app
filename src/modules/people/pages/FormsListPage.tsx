import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Page, Table, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Users } from 'lucide-react'
import { deleteForm, getFormSubmissionCounts, getForms } from '../lib/form-queries'
import { PageSkeleton } from '../components/PageSkeleton'
import type { Form } from '../lib/types'

export default function FormsListPage() {
  const navigate = useNavigate()
  const [forms, setForms] = useState<Form[] | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [error, setError] = useState<Error | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = () => {
    getForms().then(setForms).catch((reason: unknown) => setError(reason instanceof Error ? reason : new Error(String(reason))))
    getFormSubmissionCounts().then(setCounts).catch(() => undefined)
  }
  useEffect(load, [])

  if (error) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Forms" />
      </Page.Header>
      <Page.Body><Text>{error.message}</Text></Page.Body>
    </Page.Main>
  )
  if (!forms) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Forms" />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteForm(id)
      setMessage('Form deleted.')
      load()
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to delete form.')
    }
  }

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Forms" />
      </Page.Header>
      <Page.Body>
        <Stack gap="6">
          <Stack flexDirection="row" gap="2">
            <Button onClick={() => navigate('/people/forms/new')}>New form</Button>
          </Stack>
          {message && <Text>{message}</Text>}
          {forms.length === 0 && <Text color="fg.muted">No forms yet. Create one to collect data.</Text>}
          <Card.Root>
            <Card.Body>
              <Table.Root>
                <Table.Head>
                  <Table.Row>
                    <Table.Header>Name</Table.Header>
                    <Table.Header>Visibility</Table.Header>
                    <Table.Header>Submissions</Table.Header>
                    <Table.Header>Actions</Table.Header>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {forms.map((form) => (
                    <Table.Row key={form.id}>
                      <Table.Cell>
                        <Text>{form.name}</Text>
                        {form.description && <Text color="fg.muted">{form.description}</Text>}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={form.is_public ? 'green' : 'gray'}>{form.is_public ? 'Public' : 'Private'}</Badge>
                      </Table.Cell>
                      <Table.Cell><Text>{counts[form.id] ?? 0}</Text></Table.Cell>
                      <Table.Cell>
                        <Button variant="outline" onClick={() => navigate(`/people/forms/${form.id}/edit`)}>Edit</Button>
                        <Button variant="outline" onClick={() => navigate(`/people/forms/${form.id}/submissions`)}>Submissions</Button>
                        {form.is_public && (
                          <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}/forms/${form.id}`); setMessage('Public URL copied.') }}>Copy URL</Button>
                        )}
                        <Button variant="outline" onClick={() => void handleDelete(form.id)}>Delete</Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
