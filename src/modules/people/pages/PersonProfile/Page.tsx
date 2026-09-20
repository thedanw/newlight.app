import { useNavigate, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Breadcrumb, Page, Text, Button } from '@/core/ui'
import { Stack, HStack } from 'styled-system/jsx'
import { Mail, Users } from 'lucide-react'
import { usePerson, usePublicPerson, useCurrentOperatorPermission } from '../../lib/hooks'
import { useProfilePermissions } from '../../lib/profile-permissions'
import { useAuth } from '@/core/auth'
import { PersonHeader } from './Header'
import { PageSkeleton } from '../../components/PageSkeleton'
import { PersonalSection } from '../../components/sections/Personal'
import { DemographicsSection } from '../../components/sections/Demographics'
import { ContactSection } from '../../components/sections/Contact'
import { GuardiansSection } from '../../components/sections/Guardians'
import { MedicalSection } from '../../components/sections/Medical'
import { ConsentsSection } from '../../components/sections/Consents'
import { ChildSafetySection } from '../../components/sections/ChildSafety'
import { JourneySection } from '../../components/sections/Journey'
import { TagsSection } from '../../components/sections/Tags'
import type { Person, PersonPublic } from '../../lib/types'

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function PersonProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isPublic = !user
  const { data: person, loading, error } = isPublic ? usePublicPerson(id) : usePerson(id)
  const permissions = useProfilePermissions(isPublic ? null : (person as Person | null))
  const operatorPermission = useCurrentOperatorPermission()
  const canEmail = !isPublic && ['team_leaders', 'admin', 'super_admin'].includes(operatorPermission.data ?? '')

  if (loading || permissions.loading) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Profile" />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )

  if (error || !person) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Profile" />
      </Page.Header>
      <Page.Body>
        <Text>{error?.message ?? 'Person not found.'}</Text>
      </Page.Body>
    </Page.Main>
  )

  const profileType = person.demographic

  const lastNameDisplay = isPublic
    ? (person as PersonPublic).lastname_initial ?? ''
    : (person as Person).lastname

  return (
    <Page.Main>
       <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title={`${capitalize(profileType)} Profile`}>
          {canEmail && (
            <Button variant="surface" size="sm" onClick={() => navigate(`/people/email`)}>
              <Mail />
              Email
            </Button>
          )}
        </Page.Heading>
      </Page.Header>

      <Page.Body>
        <Stack gap="6">
          <HStack justifyContent="space-between" alignItems="center">
            <Text textStyle="lg" color="fg.muted">Profile Type: {profileType}</Text>
            {!isPublic && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/people/${person.id}`)}>
                Change Type
              </Button>
            )}
          </HStack>
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link href={`/people/${person.id}/edit`}>
                  {person.firstname} {lastNameDisplay}
                </Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Link href={`/people/${person.id}/view`} aria-current="page">View</Breadcrumb.Link></Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>

          {!isPublic && <PersonHeader person={person as Person} onEdit={() => navigate(`/people/${person.id}`)} canEdit={false} />}

          <PersonalSection person={person as Person} canEdit={false} />
          <DemographicsSection person={person as Person} canEdit={false} />
          <ContactSection person={person as Person} canEdit={false} />
          <GuardiansSection person={person as Person} canManageGuardians={false} />
          <MedicalSection person={person as Person} />
          <ConsentsSection person={person as Person} />
          <ChildSafetySection person={person as Person} canEditChildSafety={false} />
          <JourneySection person={person as Person} />
          <TagsSection person={person as Person} />
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
