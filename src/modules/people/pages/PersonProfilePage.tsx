import { useNavigate, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Breadcrumb, Page, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Users } from 'lucide-react'
import { usePerson } from '../lib/hooks'
import { PersonHeader } from '../components/PersonHeader'
import { PageSkeleton } from '../components/PageSkeleton'
import { PersonalSection } from '../components/sections/PersonalSection'
import { DemographicsSection } from '../components/sections/DemographicsSection'
import { ContactSection } from '../components/sections/ContactSection'
import { GuardiansSection } from '../components/sections/GuardiansSection'
import { MedicalSection } from '../components/sections/MedicalSection'
import { ConsentsSection } from '../components/sections/ConsentsSection'
import { ChildSafetySection } from '../components/sections/ChildSafetySection'
import { AdminSection } from '../components/sections/AdminSection'
import { JourneySection } from '../components/sections/JourneySection'
import { TagsSection } from '../components/sections/TagsSection'

export default function PersonProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: person, loading, error } = usePerson(id)

  if (loading) return (
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

  const isAdult = person.demographic === 'adult'
  const isYouth = person.demographic === 'youth'
  const isChild = person.demographic === 'child'
  const showContact = isAdult
  const showGuardians = isYouth || isChild
  const showMedical = isYouth || isChild
  const showConsents = isYouth || isChild
  const showChildSafety = isAdult || isYouth
  const showAdmin = ['admin', 'super_admin'].includes(person.access_permission)

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Profile" />
      </Page.Header>

      <Page.Body>
        <Stack gap="6">
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Link href={`/people/${person.id}`} aria-current="page">{person.firstname} {person.lastname}</Breadcrumb.Link></Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>

          <PersonHeader person={person} onEdit={() => navigate(`/people/${person.id}/edit`)} />

          <PersonalSection person={person} />
          <DemographicsSection person={person} />

          {showContact && <ContactSection person={person} />}
          {showGuardians && <GuardiansSection person={person} />}
          {showMedical && <MedicalSection person={person} />}
          {showConsents && <ConsentsSection person={person} />}
          {showChildSafety && <ChildSafetySection person={person} />}
          {showAdmin && <AdminSection person={person} />}

          <JourneySection person={person} />
          <TagsSection person={person} />
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
