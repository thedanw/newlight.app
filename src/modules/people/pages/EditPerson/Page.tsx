import { useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Breadcrumb, Page, Text, useRegisterPageActions } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Users } from 'lucide-react'
import { usePerson, useCurrentOperatorPermission } from '../../lib/hooks'
import { useProfilePermissions } from '../../lib/profile-permissions'
import { PersonalSection } from '../../components/sections/Personal'
import { DemographicsSection } from '../../components/sections/Demographics'
import { ContactSection } from '../../components/sections/Contact'
import { GuardiansSection } from '../../components/sections/Guardians'
import { MedicalSection } from '../../components/sections/Medical'
import { ConsentsSection } from '../../components/sections/Consents'
import { ChildSafetySection } from '../../components/sections/ChildSafety'
import { AdminSection } from '../../components/ProfileSections/AdminSection/AdminSection'
import { JourneySection } from '../../components/sections/Journey'
import { TagsSection } from '../../components/sections/Tags'
import { ProfileSection } from '../../components/sections/ProfileSection'
import { AccountAccessSection } from '../../components/sections/AccountAccess'
import { PageSkeleton } from '../../components/PageSkeleton'

type EditableSectionHandle = {
  save: () => Promise<void>
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function EditPersonPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: person, loading, error } = usePerson(id)
  const permissions = useProfilePermissions(person)
  const opQuery = useCurrentOperatorPermission()
  const personalRef = useRef<EditableSectionHandle>(null)
  const demographicsRef = useRef<EditableSectionHandle>(null)
  const contactRef = useRef<EditableSectionHandle>(null)
  const childSafetyRef = useRef<EditableSectionHandle>(null)
  const adminRef = useRef<EditableSectionHandle>(null)
  const journeyRef = useRef<EditableSectionHandle>(null)

  const handleSaveAll = useCallback(async () => {
    const saves = [
      personalRef.current?.save(),
      demographicsRef.current?.save(),
      contactRef.current?.save(),
      childSafetyRef.current?.save(),
      journeyRef.current?.save(),
      adminRef.current?.save(),
    ]
    await Promise.all(saves.filter(Boolean) as Promise<void>[])
    navigate(`/people/${id}/view`)
  }, [id, navigate])

  const handleCancel = useCallback(() => {
    navigate(`/people/${id}/view`)
  }, [id, navigate])

  useRegisterPageActions(
    {
      cancel: handleCancel,
      apply: handleSaveAll,
      isSaving: false,
      isDirty: true,
    },
    !loading && !permissions.loading && !error && Boolean(person) && Boolean(id) && !permissions.isPublic,
  )

  if (loading || permissions.loading || opQuery.loading) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title={person ? `Edit ${capitalize(person.demographic)}` : 'Profile'} />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )

  if (error || !person || !id) return (
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
  const showContact = isAdult || permissions.isPublic
  const showGuardians = (isYouth || isChild) && !permissions.isPublic
  const showMedical = (isYouth || isChild) && !permissions.isPublic
  const showConsents = (isYouth || isChild) && !permissions.isPublic
  const showChildSafety = (isAdult || isYouth) && !permissions.isPublic
  const showAdmin = ['admin', 'super_admin'].includes(person.access_permission) && !permissions.isPublic
  const publicName = `${person.firstname ?? ''} ${person.lastname?.[0] ?? ''}`.trim() || 'Hidden'

  return (
    <>
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={Users} title={permissions.isPublic ? 'Profile' : `Edit ${capitalize(person.demographic)}`} />
        </Page.Header>

      <Page.Body>
        <Stack>
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Link href={`/people/${id}/view`}>{person.firstname} {person.lastname}</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Link href={`/people/${id}`} aria-current="page">Edit</Breadcrumb.Link></Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>

          {permissions.isPublic ? (
            <ProfileSection title="Profile">
              <p><strong>Name:</strong> {publicName}</p>
            </ProfileSection>
          ) : (
            <>
              <PersonalSection ref={personalRef} person={person} canEdit={permissions.canEdit} defaultEdit={permissions.canEdit} />
              <DemographicsSection ref={demographicsRef} person={person} canEdit={permissions.canEdit} defaultEdit={permissions.canEdit} />

              {showContact && <ContactSection ref={contactRef} person={person} canEdit={permissions.canEdit} defaultEdit={permissions.canEdit} />}
              {showGuardians && <GuardiansSection person={person} canManageGuardians={permissions.canManageGuardians} />}
              {showMedical && <MedicalSection person={person} />}
              {showConsents && <ConsentsSection person={person} />}
              {showChildSafety && <ChildSafetySection ref={childSafetyRef} person={person} canEditChildSafety={permissions.canEditChildSafety} defaultEdit={permissions.canEditChildSafety} />}
              {showAdmin && <AdminSection ref={adminRef} person={person} canEditAdminFields={permissions.canEditAdminFields} defaultEdit={permissions.canEditAdminFields} />}

              <JourneySection ref={journeyRef} person={person} canEdit={permissions.canManageJourney} defaultEdit={permissions.canManageJourney} />
              <TagsSection person={person} />
              <AccountAccessSection person={person} operatorPermission={opQuery.data ?? null} isSelf={permissions.isSelf} />
            </>
          )}
        </Stack>
      </Page.Body>
      </Page.Main>
    </>
  )
}
