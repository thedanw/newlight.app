import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Loader, PagePanel, Sidebar } from '@/core/ui'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useSettings } from '@/core/settings/SettingsProvider'

export default function PeopleLayout() {
  const navigate = useNavigate()
  const { logoUrl } = useSettings()

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      <Sidebar
        onModuleNavigate={(moduleId) => navigate(`/${moduleId}`)}
        logo={logoUrl}
      />
      <PagePanel id="page-panel">
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </PagePanel>
    </div>
  )
}
