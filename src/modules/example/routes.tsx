import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// Registers the example module's settings page (settings-schema extension).
import './settings'

const ExampleDashboardPage = lazy(() => import('./dashboard'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const TypographyShowcasePage = lazy(() => import('./pages/TypographyShowcase'))

/**
 * Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
 * layout component: its `index` route is the dashboard, mounted at `/example`.
 */
export const exampleRoutes: RouteObject[] = [
  { index: true, element: <ExampleDashboardPage /> },
  { path: 'category/typography', element: <TypographyShowcasePage /> },
  { path: 'category/:categoryId', element: <CategoryPage /> },
]
