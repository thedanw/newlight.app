import { useParams } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { Breadcrumb, Card, Heading, Page, Text } from '@/core/ui'
import { Stack } from 'styled-system/jsx'
import { Users } from 'lucide-react'
import { useHousehold } from '../lib/hooks'
import { saveHouseholdAddress } from '../lib/queries'
import { HouseholdAddress } from '../components/HouseholdAddress'
import { HouseholdMembers } from '../components/HouseholdMembers'
import { PageSkeleton } from '../components/PageSkeleton'

export default function HouseholdPage() {
  const { id } = useParams()
  const { data: household, loading, error } = useHousehold(id)

  if (loading) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Household" />
      </Page.Header>
      <Page.Body><PageSkeleton /></Page.Body>
    </Page.Main>
  )
  if (error || !household) return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Household" />
      </Page.Header>
      <Page.Body>
        <Text>{error?.message ?? 'Household not found.'}</Text>
      </Page.Body>
    </Page.Main>
  )

  return (
    <Page.Main>
      <Page.Header style={{ '--module-number': 1 } as CSSProperties}>
        <Page.Heading level={1} icon={Users} title="Household" />
      </Page.Header>
      <Page.Body>
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item><Breadcrumb.Link href={`/people/households/${household.id}`} aria-current="page">{household.name ?? 'Household'}</Breadcrumb.Link></Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
        <Stack gap="6">
          <Card.Root>
            <Card.Header>
              <Card.Title>{household.name ?? 'Unnamed household'}</Card.Title>
            </Card.Header>
            <Card.Body>
              <Stack gap="4">
                <Heading textStyle="md">Home address</Heading>
                <HouseholdAddress address={household.address} onSave={async (address) => { await saveHouseholdAddress(household.id, address) }} />
              </Stack>
            </Card.Body>
          </Card.Root>
          <HouseholdMembers members={household.members} />
        </Stack>
      </Page.Body>
    </Page.Main>
  )
}
