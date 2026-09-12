'use client'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { ModuleBreadcrumbProvider } from '@/core/ui'
import { peopleManifest } from './manifest'

// Registers the people module's settings page (core #41 settings-schema demo).
import './settings'

const PeopleDashboardPage = lazy(() => import('./dashboard'))
const CreatePersonPage = lazy(() => import('./pages/CreatePersonPage'))
const EditPersonPage = lazy(() => import('./pages/EditPersonPage'))
const PersonProfilePage = lazy(() => import('./pages/PersonProfilePage'))
const HouseholdPage = lazy(() => import('./pages/HouseholdPage'))
const JourneyGridPage = lazy(() => import('./pages/JourneyGridPage'))
const TagsPage = lazy(() => import('./pages/TagsPage'))

function PeopleLayout() {
  return (
    <ModuleBreadcrumbProvider manifest={peopleManifest}>
      <Outlet />
    </ModuleBreadcrumbProvider>
  )
}

// Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
// layout component: its `index` route is the dashboard, mounted at `/people`.
export const peopleRoutes: RouteObject[] = [
  {
    element: <PeopleLayout />,
    children: [
      { index: true, element: <PeopleDashboardPage /> },
      { path: 'new', element: <CreatePersonPage /> },
      { path: ':id', element: <EditPersonPage /> },
      { path: ':id/view', element: <PersonProfilePage /> },
      { path: 'journey', element: <JourneyGridPage /> },
      { path: 'tags', element: <TagsPage /> },
      // Legacy forms routes — redirect to the standalone forms module.
      { path: 'forms', element: <Navigate to="/forms" replace /> },
      { path: 'forms/*', element: <Navigate to="/forms" replace /> },
      { path: 'households/:id', element: <HouseholdPage /> },
    ],
  },
]
