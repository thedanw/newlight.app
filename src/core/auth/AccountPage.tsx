'use client'
import { useCallback, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Breadcrumb, Button, Card, Heading, Page, Text } from '@/core/ui'
import { useRegisterPageActions } from '@/core/ui'
import { Stack, VStack, HStack } from 'styled-system/jsx'
import { UserRound } from 'lucide-react'
import { useAuth } from './use-auth'
import { useCurrentOperatorPermission } from '@/modules/people/lib/hooks'
import { useProfilePermissions } from '@/modules/people/lib/profile-permissions'
import { PersonalSection } from '@/modules/people/components/sections/Personal'
import { DemographicsSection } from '@/modules/people/components/sections/Demographics'
import { ContactSection } from '@/modules/people/components/sections/Contact'
import { GuardiansSection } from '@/modules/people/components/sections/Guardians'
import { MedicalSection } from '@/modules/people/components/sections/Medical'
import { ConsentsSection } from '@/modules/people/components/sections/Consents'
import { ChildSafetySection } from '@/modules/people/components/sections/ChildSafety'
import { JourneySection } from '@/modules/people/components/sections/Journey'
import { TagsSection } from '@/modules/people/components/sections/Tags'
import { AccountAccessSection } from '@/modules/people/components/sections/AccountAccess'
import { PageSkeleton } from '@/modules/people/components/PageSkeleton'
type SaveHandle = { save: () => Promise<void> }
export default function AccountPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const opQuery = useCurrentOperatorPermission()
  const perms = useProfilePermissions(auth.person)
  const pRef = useRef<SaveHandle>(null)
  const dRef = useRef<SaveHandle>(null)
  const cRef = useRef<SaveHandle>(null)
  const sRef = useRef<SaveHandle>(null)
  const jRef = useRef<SaveHandle>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveAll = useCallback(async () => {
    setSaveError(null)
    const s = [pRef.current?.save(), dRef.current?.save(), cRef.current?.save(), sRef.current?.save(), jRef.current?.save()]
    try { await Promise.all(s.filter(Boolean) as Promise<void>[]) }
    catch (e) { setSaveError(e instanceof Error ? e.message : String(e)) }
  }, [])
  const signOutGo = async () => {
    setSigningOut(true)
    await auth.signOut()
    navigate('/login', { replace: true })
  }
  useRegisterPageActions({ cancel: () => void signOutGo(), apply: saveAll, isSaving: false, isDirty: true, applyLabel: 'Save profile' }, Boolean(auth.user) && Boolean(auth.person))
  if (!auth.user) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={UserRound} title="Account" />
        </Page.Header>
        <Page.Body><Text>Please sign in.</Text></Page.Body>
      </Page.Main>
    )
  }
  if (opQuery.loading || perms.loading) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={UserRound} title="Account" />
        </Page.Header>
        <Page.Body><PageSkeleton /></Page.Body>
      </Page.Main>
    )
  }
  if (!auth.person) {
    return (
      <Page.Main>
        <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
          <Page.Heading level={1} icon={UserRound} title="Account" />
        </Page.Header>
        <Page.Body><Text color="error">This login is not linked to a people profile. A super admin must set people.auth_user_id to this account user id before it can be given a role.</Text></Page.Body>
      </Page.Main>
    )
  }
  const person = auth.person
  const op = opQuery.data ?? null
  const isAdult = person.demographic === 'adult'
  const isYouth = person.demographic === 'youth'
  const isChild = person.demographic === 'child'
  const showContact = isAdult || perms.isPublic
  const showGuardians = (isYouth || isChild) && !perms.isPublic
  const showMedical = (isYouth || isChild) && !perms.isPublic
  const showConsents = (isYouth || isChild) && !perms.isPublic
  const showChild = (isAdult || isYouth) && !perms.isPublic
  const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1)
  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={UserRound} title={`Edit ${cap(person.demographic)}`} />
      </Page.Header>
      <Page.Body>
        <Stack>
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item><Breadcrumb.Link href="/account" aria-current="page">Account</Breadcrumb.Link></Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
          <Card.Root><Card.Body>
            <HStack>
              <Avatar.Root size="xl"><Avatar.Fallback>{auth.initials}</Avatar.Fallback></Avatar.Root>
              <VStack gap="0" alignItems="flex-start">
                <Heading>{auth.displayName}</Heading>
                <Text color="fg.muted">{auth.user?.email}</Text>
              </VStack>
            </HStack>
          </Card.Body></Card.Root>
          {saveError && <Text color="error">{saveError}</Text>}
          <PersonalSection ref={pRef} person={person} canEdit defaultEdit />
          <DemographicsSection ref={dRef} person={person} canEdit defaultEdit />
          {showContact && <ContactSection ref={cRef} person={person} canEdit defaultEdit />}
          {showGuardians && <GuardiansSection person={person} canManageGuardians={perms.canManageGuardians} />}
          {showMedical && <MedicalSection person={person} />}
          {showConsents && <ConsentsSection person={person} />}
          {showChild && <ChildSafetySection ref={sRef} person={person} canEditChildSafety={perms.canEditChildSafety} defaultEdit={perms.canEditChildSafety} />}
          <JourneySection ref={jRef} person={person} canEdit={perms.canManageJourney} defaultEdit={perms.canManageJourney} />
          <TagsSection person={person} />
          <AccountAccessSection person={person} operatorPermission={op} isSelf />
          <Card.Root><Card.Body>
            <Button variant="outline" color="red" onClick={signOutGo} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</Button>
          </Card.Body></Card.Root>
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
