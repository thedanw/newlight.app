'use client'
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { ModuleBreadcrumbProvider } from '@/core/ui'
import { settingsManifest } from './manifest'

import './settings'

const SettingsPage = lazy(() => import('./dashboard'))

// Children rendered beneath the shared `AppShell` (see `core/router.tsx`),
// which owns the `/settings` path, Sidebar, Page.Root, and error handling.
export const settingsRoutes: RouteObject[] = [
  {
    element: (
      <ModuleBreadcrumbProvider manifest={settingsManifest}>
        <Outlet />
      </ModuleBreadcrumbProvider>
    ),
    children: [
      { path: ':section?/:page?', element: <SettingsPage /> },
    ],
  },
]
