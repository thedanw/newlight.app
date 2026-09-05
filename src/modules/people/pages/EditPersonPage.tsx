import { useNavigate, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Breadcrumb, Page, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Users } from 'lucide-react'
import { usePerson } from '../lib/hooks'
import { useCurrentOperatorPermission } from '../lib/hooks'
import { updatePerson } from '../lib/queries'
import { PersonForm } from '../components/PersonForm'
import { PageSkeleton } from '../components/PageSkeleton'

export default function EditPersonPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: person, loading, error } = usePerson(id)
  const operatorPermission = useCurrentOperatorPermission()
  if (loading) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Edit person" />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )
  if (error || !person || !id) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Edit person" />
      </Page.Header>
      <Page.Body>
        <Text>{error?.message ?? 'Person not found.'}</Text>
      </Page.Body>
    </Page.Main>
  )
  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Edit person" />
      </Page.Header>
      <Page.Body>
        <Stack gap="6">
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Link href={`/people/${id}`}>{person.firstname} {person.lastname}</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Link href={`/people/${id}/edit`} aria-current="page">Edit</Breadcrumb.Link></Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
          <PersonForm initialValue={person} allowAdminFields={operatorPermission.data === 'admin' || operatorPermission.data === 'super_admin'} submitLabel="Save changes" onCancel={() => navigate(`/people/${id}`)} onSubmit={async (value) => { await updatePerson(id, value); navigate(`/people/${id}`) }} />
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
