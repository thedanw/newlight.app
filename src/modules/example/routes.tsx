import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// Registers the example module's settings page (settings-schema extension).
import './settings'

const ExampleDashboardPage = lazy(() => import('./index'))
// Add more page lazy imports as you build them:
// const ExampleDetailPage = lazy(() => import('./pages/ExampleDetailPage'))

/**
 * Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
 * layout component: its `index` route is the dashboard, mounted at `/example`.
 */
export const exampleRoutes: RouteObject[] = [
  { index: true, element: <ExampleDashboardPage /> },
  // Add more routes here. Examples:
  // { path: 'new', element: <CreateExamplePage /> },
  // { path: ':id/edit', element: <EditExamplePage /> },
  // { path: ':id', element: <ExampleDetailPage /> },
]
