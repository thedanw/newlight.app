'use client'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { RequireSuperAdmin } from '@/core/guards/RequireSuperAdmin'
import { ModuleBreadcrumbProvider } from '@/core/ui'
import { settingsManifest } from './manifest'

import './settings'

const SettingsPage = lazy(() => import('./dashboard'))

// Children rendered beneath the shared `AppShell` (see `core/router.tsx`),
// which owns the `/settings` path, Sidebar, Page.Root, and error handling.
// The whole subtree is super-admin only (audit REQ-2): signed-out users and
// any other role are redirected to /login by the route guard.
export const settingsRoutes: RouteObject[] = [
  {
    element: (
      <RequireSuperAdmin>
        <ModuleBreadcrumbProvider manifest={settingsManifest}>
          <Outlet />
        </ModuleBreadcrumbProvider>
      </RequireSuperAdmin>
    ),
    children: [
      { path: ':section?/:page?', element: <SettingsPage /> },
    ],
  },
]
