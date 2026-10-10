import { useRef, useCallback, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Breadcrumb, Page, Text, Button, useRegisterPageActions, Badge, Heading, Card } from '@/core/ui'
import { Stack, HStack } from 'styled-system/jsx'
import { Users, Mail } from 'lucide-react'
import { usePerson, usePublicPerson, useCurrentOperatorPermission } from '../../lib/hooks'
import { useProfilePermissions } from '../../lib/profile-permissions'
import { useAuth } from '@/core/auth'
import { createPerson } from '../../lib/queries'
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
import { SendEmailDialog } from '../../components/SendEmailDialog'
import type { Person, PersonInput, EmailRecipient } from '../../lib/types'

type EditableSectionHandle = {
  save: () => Promise<void>
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function createEmptyPerson(demographic: Person['demographic'] = 'adult'): Person {
  return {
    id: '',
    firstname: '',
    lastname: '',
    preferred_name: null,
    middle_name: null,
    email: null,
    date_of_birth: null,
    gender: null,
    marital_status: null,
    demographic,
    school_name: null,
    kindy_start_year: null,
    school_email_permission: null,
    household_id: null,
    access_permission: 'public',
    date_professed: null,
    legacy_date_added: null,
    legacy_member_id: null,
    journey: {},
    tags: [],
    picture_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    _synced_at: null,
    _source_modified: null,
  }
}

// PersonHeader component - moved outside to avoid hooks order issues
function PersonHeader({ person, onEdit, canEdit = true }: { person: Person; onEdit: () => void; canEdit?: boolean }) {
  const [emailOpen, setEmailOpen] = useState(false)
  const name = person.preferred_name ? `${person.preferred_name} ${person.lastname}` : `${person.firstname} ${person.lastname}`
  const hasEmail = Boolean(person.email?.trim())
  const recipient: EmailRecipient[] = hasEmail
    ? [{ email: person.email as string, name }]
    : []
  return (
    <Card.Root>
      <Card.Body>
        <Stack>
          <HStack justifyContent="space-between" alignItems="center">
            <Stack gap="1">
              <Heading>{name}</Heading>
              <Text color="fg.muted">{person.email ?? 'No email address'}</Text>
            </Stack>
            <HStack gap="2">
              <Badge colorPalette={person.demographic === 'adult' ? 'blue' : person.demographic === 'youth' ? 'orange' : 'green'}>{person.demographic}</Badge>
              {hasEmail && <Button variant="outline" onClick={() => setEmailOpen(true)}>Email</Button>}
              {canEdit && <Button onClick={onEdit}>Edit person</Button>}
            </HStack>
          </HStack>
        </Stack>
      </Card.Body>
      <SendEmailDialog open={emailOpen} onOpenChange={setEmailOpen} recipients={recipient} />
    </Card.Root>
  )
}

export default function EditPersonPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreateMode = !id
  const { user } = useAuth()
  const isPublic = !user

  // In create mode, we don't fetch a person - we use local state
  // For public users, use usePublicPerson; for authenticated, use usePerson
  const { data: person, loading, error } = isPublic && !isCreateMode
    ? usePublicPerson(id)
    : usePerson(id)
  const permissions = useProfilePermissions(isCreateMode ? null : (isPublic ? null : person))
  const opQuery = useCurrentOperatorPermission()

  const personalRef = useRef<EditableSectionHandle>(null)
  const demographicsRef = useRef<EditableSectionHandle>(null)
  const contactRef = useRef<EditableSectionHandle>(null)
  const childSafetyRef = useRef<EditableSectionHandle>(null)
  const adminRef = useRef<EditableSectionHandle>(null)
  const journeyRef = useRef<EditableSectionHandle>(null)

  const [createDemographic, setCreateDemographic] = useState<Person['demographic']>('adult')
  const [createPersonData, setCreatePersonData] = useState<PersonInput>({
    firstname: '',
    lastname: '',
    preferred_name: null,
    middle_name: null,
    email: null,
    date_of_birth: null,
    gender: null,
    marital_status: null,
    demographic: 'adult',
    school_name: null,
    kindy_start_year: null,
    school_email_permission: null,
    household_id: null,
    access_permission: 'public',
    date_professed: null,
    legacy_date_added: null,
    legacy_member_id: null,
    journey: {},
  })

  // In create mode, use a local person object built from createPersonData
  const effectivePerson = isCreateMode
    ? { ...createEmptyPerson(createDemographic), ...createPersonData, id: 'new' }
    : person

  const handleSaveAll = useCallback(async () => {
    if (isCreateMode) {
      // In create mode, save demographics first to get the person created
      const demographicsSaved = await demographicsRef.current?.save()
      if (!demographicsSaved) return

      // Create the person with the current form data
      const newPerson = await createPerson(createPersonData)
      navigate(`/people/${newPerson.id}`)
    } else {
      const saves = [
        personalRef.current?.save(),
        demographicsRef.current?.save(),
        contactRef.current?.save(),
        childSafetyRef.current?.save(),
        journeyRef.current?.save(),
        adminRef.current?.save(),
      ]
      await Promise.all(saves.filter(Boolean) as Promise<void>[])
      navigate(`/people/${id}`)
    }
  }, [id, navigate, isCreateMode, createPersonData])

  const handleCancel = useCallback(() => {
    if (isCreateMode) {
      navigate('/people')
    } else {
      navigate(`/people/${id}`)
    }
  }, [id, navigate, isCreateMode])

  const handleChangeType = useCallback(() => {
    navigate(`/people/${id}`)
  }, [id, navigate])

  // Determine if we should show page actions (save/cancel)
  // Show actions in create mode, or edit mode when user has edit permissions
  const showActions = isCreateMode
    ? !permissions.loading && !opQuery.loading
    : !loading && !permissions.loading && !error && Boolean(person) && !permissions.isPublic && permissions.canEdit

  useRegisterPageActions(
    {
      cancel: handleCancel,
      apply: handleSaveAll,
      isSaving: false,
      isDirty: true,
    },
    showActions,
  )

  // Update create mode demographic when demographics section changes
  useEffect(() => {
    if (isCreateMode && effectivePerson) {
      setCreateDemographic(effectivePerson.demographic)
    }
  }, [isCreateMode, effectivePerson?.demographic])

  // Can email: authenticated user with team_leaders/admin/super_admin
  const canEmail = !isPublic && ['team_leaders', 'admin', 'super_admin'].includes(opQuery.data ?? '')

  // Determine if we're in view mode (authenticated but no edit permissions, or public)
  const isViewMode = !isCreateMode && (!permissions.canEdit || permissions.isPublic)

  // Loading state - render skeleton but keep hooks
  const isLoading = (isCreateMode && (permissions.loading || opQuery.loading)) || (!isCreateMode && (loading || permissions.loading || opQuery.loading))

  // Error/not found state (only in edit mode)
  const hasError = !isCreateMode && (error || !person || !id)

  if (isLoading) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={Users} title={isCreateMode ? 'New person' : 'Profile'} />
        </Page.Header>
        <Page.Body><PageSkeleton /></Page.Body>
      </Page.Main>
    )
  }

  if (hasError) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={Users} title="Profile" />
        </Page.Header>
        <Page.Body>
          <Text>{error?.message ?? 'Person not found.'}</Text>
        </Page.Body>
      </Page.Main>
    )
  }

  // In create mode, effectivePerson is built from local state
  // In edit mode, person is guaranteed to exist here (if not loading/error)
  const currentPerson = effectivePerson!

  const isAdult = currentPerson.demographic === 'adult'
  const isYouth = currentPerson.demographic === 'youth'
  const isChild = currentPerson.demographic === 'child'
  const showContact = isAdult || permissions.isPublic
  const showGuardians = (isYouth || isChild) && !permissions.isPublic
  const showMedical = (isYouth || isChild) && !permissions.isPublic
  const showConsents = (isYouth || isChild) && !permissions.isPublic
  const showChildSafety = (isAdult || isYouth) && !permissions.isPublic
  const showAdmin = ['admin', 'super_admin'].includes(currentPerson.access_permission) && !permissions.isPublic
  const publicName = `${currentPerson.firstname ?? ''} ${currentPerson.lastname?.[0] ?? ''}`.trim() || 'Hidden'

  // Last name display for public users
  const lastNameDisplay = isPublic
    ? (currentPerson as Person).lastname_initial ?? ''
    : (currentPerson as Person).lastname

  if (isLoading) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={Users} title={isCreateMode ? 'New person' : 'Profile'} />
        </Page.Header>
        <Page.Body><PageSkeleton /></Page.Body>
      </Page.Main>
    )
  }

  if (hasError) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={Users} title="Profile" />
        </Page.Header>
        <Page.Body>
          <Text>{error?.message ?? 'Person not found.'}</Text>
        </Page.Body>
      </Page.Main>
    )
  }

  return (
    <>
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={Users} title={
            isCreateMode
              ? 'New person'
              : permissions.isPublic
                ? 'Profile'
                : isViewMode
                  ? `${capitalize(currentPerson.demographic)} Profile`
                  : `Edit ${capitalize(currentPerson.demographic)}`
          }>
            {canEmail && !isCreateMode && (
              <Button variant="surface" size="sm" onClick={() => navigate(`/people/email`)}>
                <Mail />
                Email
              </Button>
            )}
          </Page.Heading>
        </Page.Header>

        <Page.Body>
          <Stack>
            {!isCreateMode && (
              <HStack justifyContent="space-between" alignItems="center">
                <Text textStyle="lg" color="fg.muted">Profile Type: {currentPerson.demographic}</Text>
                {!isPublic && !permissions.isPublic && (
                  <Button variant="outline" size="sm" onClick={handleChangeType}>
                    Change Type
                  </Button>
                )}
              </HStack>
            )}

            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
                <Breadcrumb.Separator />
                {isCreateMode ? (
                  <Breadcrumb.Item><Breadcrumb.Link aria-current="page">New</Breadcrumb.Link></Breadcrumb.Item>
                ) : (
                  <>
                    <Breadcrumb.Item>
                      <Breadcrumb.Link href={isViewMode ? `/people/${id}` : `/people/${id}`}>
                        {currentPerson.firstname} {lastNameDisplay}
                      </Breadcrumb.Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                    <Breadcrumb.Item>
                      <Breadcrumb.Link href={`/people/${id}`} aria-current="page">
                        {permissions.isPublic ? 'View' : isViewMode ? 'View' : 'Edit'}
                      </Breadcrumb.Link>
                    </Breadcrumb.Item>
                  </>
                )}
              </Breadcrumb.List>
            </Breadcrumb.Root>

            {permissions.isPublic ? (
              <ProfileSection title="Profile">
                <p><strong>Name:</strong> {publicName}</p>
              </ProfileSection>
            ) : (
              <>
                {!isCreateMode && <PersonHeader person={currentPerson as Person} onEdit={handleChangeType} canEdit={permissions.canEdit} />}
                <PersonalSection ref={personalRef} person={currentPerson} canEdit={permissions.canEdit} defaultEdit={permissions.canEdit || isCreateMode} />
                <DemographicsSection
                  ref={demographicsRef}
                  person={currentPerson}
                  canEdit={permissions.canEdit}
                  defaultEdit={permissions.canEdit || isCreateMode}
                  onDemographicChange={isCreateMode ? setCreateDemographic : undefined}
                />
                <ContactSection ref={contactRef} person={currentPerson} canEdit={permissions.canEdit} defaultEdit={permissions.canEdit || isCreateMode} />
                {showGuardians && <GuardiansSection person={currentPerson} canManageGuardians={permissions.canManageGuardians} />}
                {showMedical && <MedicalSection person={currentPerson} />}
                {showConsents && <ConsentsSection person={currentPerson} />}
                {showChildSafety && <ChildSafetySection ref={childSafetyRef} person={currentPerson} canEditChildSafety={permissions.canEditChildSafety} defaultEdit={permissions.canEditChildSafety || isCreateMode} />}
                {showAdmin && <AdminSection ref={adminRef} person={currentPerson} canEditAdminFields={permissions.canEditAdminFields} defaultEdit={permissions.canEditAdminFields || isCreateMode} />}
                <JourneySection ref={journeyRef} person={currentPerson} canEdit={permissions.canManageJourney} defaultEdit={permissions.canManageJourney || isCreateMode} />
                <TagsSection person={currentPerson} />
                <AccountAccessSection person={currentPerson} operatorPermission={opQuery.data ?? null} isSelf={permissions.isSelf} />
              </>
            )}
          </Stack>
        </Page.Body>
      </Page.Main>
    </>
  )
}