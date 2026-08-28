import { Heading, PageHeader, Text } from '@/core/ui'
import { useCurrentOperatorPermission } from '../lib/hooks'
import { JourneySettingsManager } from '../components/JourneySettingsManager'
import { PageSkeleton } from '../components/PageSkeleton'

export default function JourneySettingsPage() {
  const permission = useCurrentOperatorPermission()
  const canManage = permission.data === 'admin' || permission.data === 'super_admin'
  return (
    <>
      <PageHeader>
        <Heading>Journey settings</Heading>
      </PageHeader>
      <main>
        {permission.loading && <PageSkeleton lines={2} />}
        {!permission.loading && !canManage && <Text>You do not have permission to manage journey settings.</Text>}
        {!permission.loading && canManage && <JourneySettingsManager />}
      </main>
    </>
  )
}
