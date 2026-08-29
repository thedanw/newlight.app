import { Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Loader, PagePanel, Sidebar } from '@/core/ui'

/* ---------------------------------------------------------------------------
   SettingsLayout — app shell for the settings dashboard (`/settings/*`).

   Mirrors the module-dashboard shell (see `src/modules/people/pages/
   PeopleLayout.tsx`): a full-viewport flex row with the mobile-first Sidebar
   pinned right and the PagePanel filling the rest. Child routes (the
   SettingsPage panel stack) render through the Outlet inside the PagePanel,
   so the settings dashboard gets the same sidebar + page chrome as every
   other module dashboard.
--------------------------------------------------------------------------- */

export default function SettingsLayout() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      <Sidebar
        onSettingsNavigate={() => navigate('/settings')}
        onModuleNavigate={(moduleId) => navigate(`/${moduleId}`)}
      />
      <PagePanel id="page-panel">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </PagePanel>
    </div>
  )
}