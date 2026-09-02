import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const SettingsPage = lazy(() => import('./settings/SettingsPage'))

// Children rendered beneath the shared `AppShell` (see `core/router.tsx`),
// which owns the `/settings` path, Sidebar, Page.Root, and error handling.
export const coreRoutes: RouteObject[] = [
  { path: ':section?/:page?', element: <SettingsPage /> },
]
