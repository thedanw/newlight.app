import { Heading, Page, Text } from '@/core/ui'
import { useCurrentOperatorPermission } from '../lib/hooks'
import { JourneySettingsManager } from '../components/JourneySettingsManager'
import { PageSkeleton } from '../components/PageSkeleton'

export default function JourneySettingsPage() {
  const permission = useCurrentOperatorPermission()
  const canManage = permission.data === 'admin' || permission.data === 'super_admin'
  return (
    <>
      <Page.Header>
        <Heading>Journey settings</Heading>
      </Page.Header>
      <Page.Body>
        {permission.loading && <PageSkeleton lines={2} />}
        {!permission.loading && !canManage && <Text>You do not have permission to manage journey settings.</Text>}
        {!permission.loading && canManage && <JourneySettingsManager />}
      </Page.Body>
    </>
  )
}
