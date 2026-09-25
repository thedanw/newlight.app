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

// Registers the developers module's settings page (settings-schema extension).
import './settings'

const DevelopersDashboardPage = lazy(() => import('./dashboard'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const TypographyShowcasePage = lazy(() => import('./pages/TypographyShowcase'))

/**
 * Children of the shared `AppShell` (see `core/router.tsx`). The module owns no
 * layout component: its `index` route is the dashboard, mounted at `/developers`.
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
      { index: true, element: <DevelopersDashboardPage /> },
      { path: 'category/typography', element: <TypographyShowcasePage /> },
      { path: 'category/:categoryId', element: <CategoryPage /> },
    ],
  },
]