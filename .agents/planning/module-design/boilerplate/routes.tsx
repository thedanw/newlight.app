'use client'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ModuleBreadcrumbProvider } from '@/core/ui'
import { Manifest } from './manifest'
import { registerSidebarModule } from '@/core/ui/sidebar-registry'
import { Outlet } from 'react-router-dom'

// Register sidebar entry at module load
registerSidebarModule({
  id: Manifest.id,
  label: Manifest.name,
  icon: Manifest.icon,
  order: Manifest.number,
})

// Registers the <moduleId> module's settings page (settings-schema extension).
import './settings'

const DashboardPage = lazy(() => import('./dashboard'))
// Add more page lazy imports as you build them:
// const DetailPage = lazy(() => import('./pages/DetailPage'))

/**
 * Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
 * layout component: its `index` route is the dashboard, mounted at `/<moduleId>`.
 */
function ModuleLayout() {
  return (
    <ModuleBreadcrumbProvider manifest={Manifest}>
      <Outlet />
    </ModuleBreadcrumbProvider>
  )
}

export const routes: RouteObject[] = [
  {
    element: <ModuleLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      // Add more routes here. Examples:
      // { path: 'new', element: <CreatePage /> },
      // { path: ':id/edit', element: <EditPage /> },
      // { path: ':id', element: <DetailPage /> },
    ],
  },
]