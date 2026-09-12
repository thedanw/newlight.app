import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { ModuleBreadcrumbProvider } from '@/core/ui'
import { formsManifest } from './manifest'

const FormsDashboardPage = lazy(() => import('./dashboard'))
const FormsListPage = lazy(() => import('./pages/ListPage'))
const FormBuilderPage = lazy(() => import('./pages/BuilderPage'))
const FormSubmissionsPage = lazy(() => import('./pages/SubmissionsPage'))

function FormsLayout() {
  return (
    <ModuleBreadcrumbProvider manifest={formsManifest}>
      <Outlet />
    </ModuleBreadcrumbProvider>
  )
}

/**
 * Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
 * layout component: its `index` route is the dashboard, mounted at `/forms`.
 */
export const formsRoutes: RouteObject[] = [
  {
    element: <FormsLayout />,
    children: [
      { index: true, element: <FormsDashboardPage /> },
      { path: 'new', element: <FormBuilderPage /> },
      { path: ':id/edit', element: <FormBuilderPage /> },
      { path: ':id/submissions', element: <FormSubmissionsPage /> },
      // Legacy list route — redirects to dashboard (which is the list).
      { path: 'list', element: <Navigate to="/forms" replace /> },
    ],
  },
]
