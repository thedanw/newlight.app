import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumb, Heading, Page, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
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
  if (loading) return <><Page.Header><Heading>Edit person</Heading></Page.Header><Page.Body><PageSkeleton /></Page.Body></>
  if (error || !person || !id) return <><Page.Header><Heading>Edit person</Heading></Page.Header><Page.Body><Text>{error?.message ?? 'Person not found.'}</Text></Page.Body></>
  return (
    <>
      <Page.Header><Heading>Edit person</Heading></Page.Header>
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
    </>
  )
}