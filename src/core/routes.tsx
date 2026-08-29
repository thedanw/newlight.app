import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const SettingsLayout = lazy(() => import('./settings/SettingsLayout'))
const SettingsPage = lazy(() => import('./settings/SettingsPage'))

/**
 * Core route slice — module-system convention: core owns `src/core/routes.tsx`;
 * ONLY `src/core/router.tsx` calls `createBrowserRouter`. Spread `coreRoutes`
 * into the top-level router array.
 */
export const coreRoutes: RouteObject[] = [
  {
    path: '/settings',
    element: <SettingsLayout />,
    children: [
      // `/settings` → section list, `/settings/:section` → section panel,
      // `/settings/:section/:page` → page panel (push/pop panel stack).
      { path: ':section?/:page?', element: <SettingsPage /> },
    ],
  },
]