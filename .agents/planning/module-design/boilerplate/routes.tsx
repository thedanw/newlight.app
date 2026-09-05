import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// Registers the <moduleId> module's settings page (settings-schema extension).
import './settings'

const <Module>DashboardPage = lazy(() => import('./index'))
// Add more page lazy imports as you build them:
// const <Module>DetailPage = lazy(() => import('./pages/<Module>DetailPage'))

/**
 * Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
 * layout component: its `index` route is the dashboard, mounted at `/<moduleId>`.
 */
export const <module>Routes: RouteObject[] = [
  { index: true, element: <<Module>DashboardPage /> },
  // Add more routes here. Examples:
  // { path: 'new', element: <Create<Module>Page /> },
  // { path: ':id/edit', element: <Edit<Module>Page /> },
  // { path: ':id', element: <<Module>DetailPage /> },
]
