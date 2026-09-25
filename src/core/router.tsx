import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy } from 'react'
import ErrorPage from '@/core/errors/ErrorPage'
import { AppShell } from '@/core/ui'
import { RequireAuth } from '@/core/guards/RequireAuth'
import { routes as developersRoutes } from '@/modules/developers/routes'
import { routes as formsRoutes } from '@/modules/forms/routes'
import { routes as peopleRoutes } from '@/modules/people/routes'
import { coreRoutes } from '@/core/routes'

const FormPublicPage = lazy(() => import('@/modules/forms/pages/PublicPage'))
const LoginPage = lazy(() => import('@/core/auth/LoginPage'))
const AccountPage = lazy(() => import('@/core/auth/AccountPage'))

export const router = createBrowserRouter([
  {
    // Single shared app shell (Sidebar + Page.Root + ErrorBoundary + Suspense)
    // for every authenticated surface: the styleguide, module dashboards, and
    // settings. Public/unauthenticated routes live outside this shell.
    // RequireAuth (audit 1.3/H1) fail-closes the whole subtree while the
    // session restores and bounces signed-out visitors to /login with the
    // requested path in `state.from`, so deep links survive refresh + login.
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/people" replace /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'developers', children: developersRoutes },
      { path: 'forms', children: formsRoutes },
      { path: 'people', children: peopleRoutes },
      { path: 'settings', children: coreRoutes },
    ],
  },
  {
    path: '/forms/:formId',
    element: <FormPublicPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
])
