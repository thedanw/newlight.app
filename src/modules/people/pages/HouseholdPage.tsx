import { useNavigate, useParams } from 'react-router-dom'
import { BackButton, Breadcrumb, Heading, PageHeader, Text } from '@/core/ui'
import { useHousehold } from '../lib/hooks'
import { saveHouseholdAddress } from '../lib/queries'
import { HouseholdAddress } from '../components/HouseholdAddress'
import { HouseholdMembers } from '../components/HouseholdMembers'
import { PageSkeleton } from '../components/PageSkeleton'

export default function HouseholdPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: household, loading, error } = useHousehold(id)

  if (loading) return <><PageHeader><BackButton onClick={() => navigate('/people')} /><Heading>Household</Heading></PageHeader><main><PageSkeleton /></main></>
  if (error || !household) return <><PageHeader><BackButton onClick={() => navigate('/people')} /><Heading>Household</Heading></PageHeader><main><Text>{error?.message ?? 'Household not found.'}</Text></main></>

  return (
    <>
      <PageHeader>
        <BackButton onClick={() => navigate('/people')} />
        <Heading>Household</Heading>
      </PageHeader>
      <main>
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item><Breadcrumb.Link href="/people">People</Breadcrumb.Link></Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item><Breadcrumb.Link href={`/people/households/${household.id}`} aria-current="page">{household.name ?? 'Household'}</Breadcrumb.Link></Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
        <Heading>{household.name ?? 'Unnamed household'}</Heading>
        <section aria-labelledby="household-address-heading">
          <Heading id="household-address-heading">Home address</Heading>
          <HouseholdAddress address={household.address} onSave={async (address) => { await saveHouseholdAddress(household.id, address) }} />
        </section>
        <HouseholdMembers members={household.members} />
      </main>
    </>
  )
}
