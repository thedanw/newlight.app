'use client'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { ModuleBreadcrumbProvider } from '@/core/ui'
import { Manifest } from './manifest'
import { registerSidebarModule } from '@/core/ui/sidebar-registry'

// Register sidebar entry at module load
registerSidebarModule({
  id: Manifest.id,
  label: Manifest.name,
  icon: Manifest.icon,
  order: Manifest.number,
})

// Registers the people module's settings page (core #41 settings-schema demo).
import './settings'

const PeopleDashboardPage = lazy(() => import('./pages/Dashboard/Page'))
const CreatePersonPage = lazy(() => import('./pages/CreatePerson/Page'))
const EditPersonPage = lazy(() => import('./pages/EditPerson/Page'))
const PersonProfilePage = lazy(() => import('./pages/PersonProfile/Page'))
const HouseholdPage = lazy(() => import('./pages/Household/Page'))
const JourneyGridPage = lazy(() => import('./pages/JourneyGrid/Page'))
const TagsPage = lazy(() => import('./pages/Tags/Page'))
const EmailPage = lazy(() => import('./pages/Email/Page'))

function ModuleLayout() {
  return (
    <ModuleBreadcrumbProvider manifest={Manifest}>
      <Outlet />
    </ModuleBreadcrumbProvider>
  )
}

// Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
// layout component: its `index` route is the dashboard, mounted at `/people`.
export const routes: RouteObject[] = [
  {
    element: <ModuleLayout />,
    children: [
      { index: true, element: <PeopleDashboardPage /> },
      { path: 'new', element: <CreatePersonPage /> },
      { path: ':id', element: <EditPersonPage /> },
      { path: ':id/view', element: <PersonProfilePage /> },
      { path: 'journey', element: <JourneyGridPage /> },
      { path: 'tags', element: <TagsPage /> },
      { path: 'email', element: <EmailPage /> },
      // Legacy forms routes — redirect to the standalone forms module.
      { path: 'forms', element: <Navigate to="/forms" replace /> },
      { path: 'forms/*', element: <Navigate to="/forms" replace /> },
      { path: 'households/:id', element: <HouseholdPage /> },
    ],
  },
]