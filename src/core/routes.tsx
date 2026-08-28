import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const SettingsPage = lazy(() => import('./settings/SettingsPage'))

/**
 * Core route slice — module-system convention: core owns `src/core/routes.tsx`;
 * ONLY `src/core/router.tsx` calls `createBrowserRouter`. Spread `coreRoutes`
 * into the top-level router array.
 */
export const coreRoutes: RouteObject[] = [
  {
    path: '/settings/:section?',
    element: <SettingsPage />,
  },
]