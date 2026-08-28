import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Loader, PagePanel, Sidebar } from '@/core/ui'
import { ErrorBoundary } from '../components/ErrorBoundary'

export default function PeopleLayout() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      <Sidebar onModuleNavigate={(moduleId) => navigate(`/${moduleId}`)} />
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
